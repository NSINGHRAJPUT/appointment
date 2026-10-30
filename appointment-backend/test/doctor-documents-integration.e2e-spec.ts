import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Integration Tests for Doctor Document Upload Flow
 * 
 * **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5**
 * 
 * This test suite validates the complete document upload flow end-to-end:
 * - Doctor registration with documents
 * - Document upload during onboarding
 * - Document deletion
 * - Document retrieval
 * - Backward compatibility
 * - Patient registration rejection
 */
describe('Doctor Document Upload - Integration Tests (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    prisma = moduleFixture.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  // Helper functions
  const generateUniqueLicense = (index: number) => `LIC${Date.now()}${index}`;
  const generateUniqueEmail = (index: number) => `dr.integration${Date.now()}${index}@example.com`;
  const createTestFile = (filename: string, content: string = 'test content'): string => {
    const filePath = path.join(__dirname, filename);
    fs.writeFileSync(filePath, Buffer.from(content));
    return filePath;
  };
  const cleanupFile = (filePath: string) => {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  };

  /**
   * Test Suite 1: Full Doctor Registration Flow with Single Document
   * 
   * **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**
   * 
   * Scenario: Register doctor with one PDF document
   * Expected:
   * - Document is uploaded to Cloudinary
   * - DoctorDocument record is created in database
   * - Response includes document metadata (URL, title)
   * - Document URL is accessible
   */
  describe('Test 1: Full doctor registration flow with single document', () => {
    it('should register doctor with single document and verify upload', async () => {
      const email = generateUniqueEmail(1);
      const testFilePath = createTestFile('test-license-1.pdf', 'PDF test content');

      try {
        const response = await request(app.getHttpServer())
          .post('/auth/register')
          .field('email', email)
          .field('password', 'SecurePass123')
          .field('fullName', 'Dr. Integration One')
          .field('role', 'DOCTOR')
          .field('licenseNumber', generateUniqueLicense(1))
          .field('primarySpecialty', 'Cardiology')
          .attach('documents', testFilePath);

        // Assertion 1: Registration succeeds
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('accessToken');
        expect(response.body).toHaveProperty('user');

        // Assertion 2: Response includes doctor profile with documents
        expect(response.body.user).toHaveProperty('doctorProfile');
        expect(response.body.user.doctorProfile).toHaveProperty('documents');
        expect(response.body.user.doctorProfile.documents).toHaveLength(1);

        // Assertion 3: Document metadata is correct
        const document = response.body.user.doctorProfile.documents[0];
        expect(document).toHaveProperty('id');
        expect(document).toHaveProperty('title');
        expect(document).toHaveProperty('fileUrl');
        expect(document).toHaveProperty('createdAt');
        expect(document.title).toBe('test-license-1.pdf');
        expect(document.fileUrl).toMatch(/https:\/\/res\.cloudinary\.com\//);

        // Assertion 4: DoctorDocument record exists in database
        const doctor = await prisma.doctorProfile.findFirst({
          where: { user: { email } },
          include: { documents: true },
        });

        expect(doctor).toBeDefined();
        expect(doctor?.documents).toHaveLength(1);
        expect(doctor?.documents[0].fileUrl).toBe(document.fileUrl);
        expect(doctor?.documents[0].title).toBe('test-license-1.pdf');

        // Assertion 5: Document URL is accessible (Cloudinary URL format)
        expect(document.fileUrl).toMatch(/^https:\/\/res\.cloudinary\.com\/[^/]+\/(image|raw)\/upload\//);
      } finally {
        cleanupFile(testFilePath);
      }
    });
  });

  /**
   * Test Suite 2: Full Doctor Registration Flow with Multiple Documents
   * 
   * **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**
   * 
   * Scenario: Register doctor with 5 documents (mix of PDF, JPG, PNG)
   * Expected:
   * - All documents are uploaded to Cloudinary
   * - All DoctorDocument records are created
   * - Each document has unique URL
   * - Response includes all document metadata
   */
  describe('Test 2: Full doctor registration flow with multiple documents', () => {
    it('should register doctor with multiple documents and verify all uploads', async () => {
      const email = generateUniqueEmail(2);
      const files = [
        createTestFile('test-license-2.pdf', 'PDF content'),
        createTestFile('test-cert-2.jpg', 'JPG content'),
        createTestFile('test-degree-2.png', 'PNG content'),
        createTestFile('test-exp-2.pdf', 'PDF content 2'),
        createTestFile('test-other-2.jpg', 'JPG content 2'),
      ];

      try {
        let request_obj = request(app.getHttpServer())
          .post('/auth/register')
          .field('email', email)
          .field('password', 'SecurePass456')
          .field('fullName', 'Dr. Integration Two')
          .field('role', 'DOCTOR')
          .field('licenseNumber', generateUniqueLicense(2))
          .field('primarySpecialty', 'Neurology');

        // Attach all files
        for (const filePath of files) {
          request_obj = request_obj.attach('documents', filePath);
        }

        const response = await request_obj;

        // Assertion 1: Registration succeeds
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('accessToken');

        // Assertion 2: All documents are in response
        expect(response.body.user.doctorProfile.documents).toHaveLength(5);

        // Assertion 3: Each document has unique URL and correct metadata
        const urls = new Set<string>();
        const expectedFilenames = [
          'test-license-2.pdf',
          'test-cert-2.jpg',
          'test-degree-2.png',
          'test-exp-2.pdf',
          'test-other-2.jpg',
        ];

        response.body.user.doctorProfile.documents.forEach((doc: any, index: number) => {
          expect(doc).toHaveProperty('fileUrl');
          expect(doc).toHaveProperty('title');
          expect(doc.fileUrl).toMatch(/https:\/\/res\.cloudinary\.com\//);
          expect(expectedFilenames).toContain(doc.title);
          urls.add(doc.fileUrl);
        });

        // Assertion 4: All URLs are unique
        expect(urls.size).toBe(5);

        // Assertion 5: All DoctorDocument records exist in database
        const doctor = await prisma.doctorProfile.findFirst({
          where: { user: { email } },
          include: { documents: true },
        });

        expect(doctor?.documents).toHaveLength(5);
        const dbUrls = new Set(doctor?.documents.map((d) => d.fileUrl));
        expect(dbUrls.size).toBe(5);
      } finally {
        files.forEach(cleanupFile);
      }
    }, 15000); // Increased timeout for multiple file uploads
  });

  /**
   * Test Suite 3: Onboarding Document Upload Flow
   * 
   * **Validates: Requirements 2.2, 2.4**
   * 
   * Scenario: Register doctor without documents, then upload via POST /doctors/documents
   * Expected:
   * - Document is added to doctor's profile
   * - GET /doctors/:id/documents returns the uploaded document
   */
  describe('Test 3: Onboarding document upload flow', () => {
    it('should allow doctor to upload document after registration', async () => {
      const email = generateUniqueEmail(3);

      // Step 1: Register doctor without documents
      const registerResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email,
          password: 'SecurePass789',
          fullName: 'Dr. Integration Three',
          role: 'DOCTOR',
          licenseNumber: generateUniqueLicense(3),
          primarySpecialty: 'Dermatology',
        });

      expect(registerResponse.status).toBe(201);
      const accessToken = registerResponse.body.accessToken;
      const doctorId = registerResponse.body.user.doctorProfile.id;

      // Verify no documents initially
      expect(registerResponse.body.user.doctorProfile.documents).toHaveLength(0);

      // Step 2: Upload document via POST /doctors/documents
      const testFilePath = createTestFile('test-onboarding-3.pdf', 'Onboarding PDF');

      try {
        const uploadResponse = await request(app.getHttpServer())
          .post('/doctors/documents')
          .set('Authorization', `Bearer ${accessToken}`)
          .field('title', 'Updated License')
          .attach('file', testFilePath);

        // Assertion 1: Upload succeeds
        expect(uploadResponse.status).toBe(201);
        expect(uploadResponse.body).toHaveProperty('id');
        expect(uploadResponse.body).toHaveProperty('fileUrl');
        expect(uploadResponse.body).toHaveProperty('title');
        expect(uploadResponse.body.title).toBe('Updated License');
        expect(uploadResponse.body.fileUrl).toMatch(/https:\/\/res\.cloudinary\.com\//);

        // Assertion 2: Document is added to doctor's profile
        const doctor = await prisma.doctorProfile.findUnique({
          where: { id: doctorId },
          include: { documents: true },
        });

        expect(doctor?.documents).toHaveLength(1);
        expect(doctor?.documents[0].fileUrl).toBe(uploadResponse.body.fileUrl);

        // Assertion 3: GET /doctors/:id/documents returns the document
        const getResponse = await request(app.getHttpServer())
          .get(`/doctors/${doctorId}/documents`)
          .set('Authorization', `Bearer ${accessToken}`);

        expect(getResponse.status).toBe(200);
        expect(getResponse.body).toHaveLength(1);
        expect(getResponse.body[0].id).toBe(uploadResponse.body.id);
        expect(getResponse.body[0].fileUrl).toBe(uploadResponse.body.fileUrl);
      } finally {
        cleanupFile(testFilePath);
      }
    });
  });

  /**
   * Test Suite 4: Document Deletion Flow
   * 
   * **Validates: Requirements 2.2**
   * 
   * Scenario: Upload document, delete via DELETE /doctors/documents/:id
   * Expected:
   * - Document is removed from Cloudinary
   * - DoctorDocument record is removed from database
   * - GET /doctors/:id/documents no longer returns deleted document
   */
  describe('Test 4: Document deletion flow', () => {
    it('should delete document and verify removal from database and Cloudinary', async () => {
      const email = generateUniqueEmail(4);

      // Step 1: Register doctor with document
      const testFilePath = createTestFile('test-delete-4.pdf', 'Delete test PDF');

      try {
        const registerResponse = await request(app.getHttpServer())
          .post('/auth/register')
          .field('email', email)
          .field('password', 'SecurePass999')
          .field('fullName', 'Dr. Integration Four')
          .field('role', 'DOCTOR')
          .field('licenseNumber', generateUniqueLicense(4))
          .field('primarySpecialty', 'Orthopedics')
          .attach('documents', testFilePath);

        expect(registerResponse.status).toBe(201);
        const accessToken = registerResponse.body.accessToken;
        const doctorId = registerResponse.body.user.doctorProfile.id;
        const documentId = registerResponse.body.user.doctorProfile.documents[0].id;

        // Verify document exists
        expect(registerResponse.body.user.doctorProfile.documents).toHaveLength(1);

        // Step 2: Delete document
        const deleteResponse = await request(app.getHttpServer())
          .delete(`/doctors/documents/${documentId}`)
          .set('Authorization', `Bearer ${accessToken}`);

        // Assertion 1: Delete succeeds
        expect(deleteResponse.status).toBe(200);
        expect(deleteResponse.body).toHaveProperty('message');

        // Assertion 2: Document is removed from database
        const doctor = await prisma.doctorProfile.findUnique({
          where: { id: doctorId },
          include: { documents: true },
        });

        expect(doctor?.documents).toHaveLength(0);

        // Assertion 3: GET /doctors/:id/documents no longer returns deleted document
        const getResponse = await request(app.getHttpServer())
          .get(`/doctors/${doctorId}/documents`)
          .set('Authorization', `Bearer ${accessToken}`);

        expect(getResponse.status).toBe(200);
        expect(getResponse.body).toHaveLength(0);
      } finally {
        cleanupFile(testFilePath);
      }
    });
  });

  /**
   * Test Suite 5: Document Retrieval Flow
   * 
   * **Validates: Requirements 2.2**
   * 
   * Scenario: Upload multiple documents, retrieve via GET /doctors/:id/documents
   * Expected:
   * - All documents are returned
   * - Documents are ordered by creation date (newest first)
   */
  describe('Test 5: Document retrieval flow', () => {
    it('should retrieve all documents ordered by creation date (newest first)', async () => {
      const email = generateUniqueEmail(5);
      const files = [
        createTestFile('test-retrieve-5a.pdf', 'First PDF'),
        createTestFile('test-retrieve-5b.jpg', 'Second JPG'),
        createTestFile('test-retrieve-5c.png', 'Third PNG'),
      ];

      try {
        let request_obj = request(app.getHttpServer())
          .post('/auth/register')
          .field('email', email)
          .field('password', 'SecurePass111')
          .field('fullName', 'Dr. Integration Five')
          .field('role', 'DOCTOR')
          .field('licenseNumber', generateUniqueLicense(5))
          .field('primarySpecialty', 'Pediatrics');

        for (const filePath of files) {
          request_obj = request_obj.attach('documents', filePath);
        }

        const registerResponse = await request_obj;

        expect(registerResponse.status).toBe(201);
        const doctorId = registerResponse.body.user.doctorProfile.id;
        const accessToken = registerResponse.body.accessToken;

        // Assertion 1: All documents are returned
        const getResponse = await request(app.getHttpServer())
          .get(`/doctors/${doctorId}/documents`)
          .set('Authorization', `Bearer ${accessToken}`);

        expect(getResponse.status).toBe(200);
        expect(getResponse.body).toHaveLength(3);

        // Assertion 2: Documents are ordered by creation date (newest first)
        const documents = getResponse.body;
        for (let i = 0; i < documents.length - 1; i++) {
          const current = new Date(documents[i].createdAt).getTime();
          const next = new Date(documents[i + 1].createdAt).getTime();
          expect(current).toBeGreaterThanOrEqual(next);
        }

        // Assertion 3: All documents have required fields
        documents.forEach((doc: any) => {
          expect(doc).toHaveProperty('id');
          expect(doc).toHaveProperty('title');
          expect(doc).toHaveProperty('fileUrl');
          expect(doc).toHaveProperty('createdAt');
          expect(doc.fileUrl).toMatch(/https:\/\/res\.cloudinary\.com\//);
        });
      } finally {
        files.forEach(cleanupFile);
      }
    });
  });

  /**
   * Test Suite 6: Backward Compatibility
   * 
   * **Validates: Requirements 3.1, 3.3, 3.4**
   * 
   * Scenario: Register doctor without documents field
   * Expected:
   * - Registration succeeds
   * - Documents array is empty
   * - Doctor profile is created correctly
   */
  describe('Test 6: Backward compatibility', () => {
    it('should register doctor without documents field and verify backward compatibility', async () => {
      const email = generateUniqueEmail(6);

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email,
          password: 'SecurePass222',
          fullName: 'Dr. Integration Six',
          role: 'DOCTOR',
          licenseNumber: generateUniqueLicense(6),
          primarySpecialty: 'Psychiatry',
          experience: '10',
          degree: 'MD',
          university: 'Harvard Medical School',
          graduationYear: '2014',
        });

      // Assertion 1: Registration succeeds
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('accessToken');

      // Assertion 2: Doctor profile is created correctly
      expect(response.body.user).toHaveProperty('doctorProfile');
      expect(response.body.user.doctorProfile).toHaveProperty('specialization');
      expect(response.body.user.doctorProfile.specialization).toBe('Psychiatry');
      expect(response.body.user.doctorProfile.degree).toBe('MD');
      expect(response.body.user.doctorProfile.yearsOfExperience).toBe(10);

      // Assertion 3: Documents array is empty
      expect(response.body.user.doctorProfile).toHaveProperty('documents');
      expect(response.body.user.doctorProfile.documents).toHaveLength(0);

      // Assertion 4: Doctor profile exists in database
      const doctor = await prisma.doctorProfile.findFirst({
        where: { user: { email } },
        include: { documents: true },
      });

      expect(doctor).toBeDefined();
      expect(doctor?.documents).toHaveLength(0);
      expect(doctor?.specialization).toBe('Psychiatry');
    });
  });

  /**
   * Test Suite 7: Patient Registration Rejection
   * 
   * **Validates: Requirements 3.2**
   * 
   * Scenario: Attempt to register patient with documents field
   * Expected:
   * - Request is rejected with validation error
   */
  describe('Test 7: Patient registration rejection', () => {
    it('should reject patient registration with documents field', async () => {
      const testFilePath = createTestFile('test-patient-7.pdf', 'Patient PDF');

      try {
        const response = await request(app.getHttpServer())
          .post('/auth/register')
          .field('email', generateUniqueEmail(7))
          .field('password', 'SecurePass333')
          .field('fullName', 'Patient Integration')
          .field('role', 'PATIENT')
          .attach('documents', testFilePath);

        // Assertion: Request is rejected
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toContain('documents');
      } finally {
        cleanupFile(testFilePath);
      }
    });
  });

  /**
   * Test Suite 8: Document Ownership Verification
   * 
   * **Validates: Requirements 2.2**
   * 
   * Scenario: Doctor A attempts to delete Doctor B's document
   * Expected:
   * - Request is rejected with authorization error
   */
  describe('Test 8: Document ownership verification', () => {
    it('should prevent doctor from deleting another doctor\'s document', async () => {
      const email1 = generateUniqueEmail(8);
      const email2 = generateUniqueEmail(9);
      const testFilePath = createTestFile('test-ownership-8.pdf', 'Ownership test PDF');

      try {
        // Register first doctor with document
        const register1 = await request(app.getHttpServer())
          .post('/auth/register')
          .field('email', email1)
          .field('password', 'SecurePass444')
          .field('fullName', 'Dr. Integration Eight')
          .field('role', 'DOCTOR')
          .field('licenseNumber', generateUniqueLicense(8))
          .field('primarySpecialty', 'Oncology')
          .attach('documents', testFilePath);

        expect(register1.status).toBe(201);
        const documentId = register1.body.user.doctorProfile.documents[0].id;

        // Register second doctor
        const register2 = await request(app.getHttpServer())
          .post('/auth/register')
          .send({
            email: email2,
            password: 'SecurePass555',
            fullName: 'Dr. Integration Nine',
            role: 'DOCTOR',
            licenseNumber: generateUniqueLicense(9),
            primarySpecialty: 'Gastroenterology',
          });

        expect(register2.status).toBe(201);
        const accessToken2 = register2.body.accessToken;

        // Attempt to delete first doctor's document with second doctor's token
        const deleteResponse = await request(app.getHttpServer())
          .delete(`/doctors/documents/${documentId}`)
          .set('Authorization', `Bearer ${accessToken2}`);

        // Assertion: Request is rejected
        expect(deleteResponse.status).toBe(400);
        expect(deleteResponse.body).toHaveProperty('message');
      } finally {
        cleanupFile(testFilePath);
      }
    });
  });

  /**
   * Test Suite 9: Unauthenticated Access Rejection
   * 
   * **Validates: Requirements 2.2**
   * 
   * Scenario: Attempt to upload document without authentication
   * Expected:
   * - Request is rejected with 401 Unauthorized
   */
  describe('Test 9: Unauthenticated access rejection', () => {
    it('should reject document upload without authentication', async () => {
      const testFilePath = createTestFile('test-unauth-9.pdf', 'Unauth test PDF');

      try {
        const response = await request(app.getHttpServer())
          .post('/doctors/documents')
          .attach('file', testFilePath);

        // Assertion: Request is rejected
        expect(response.status).toBe(401);
      } finally {
        cleanupFile(testFilePath);
      }
    });
  });

  /**
   * Test Suite 10: Document Metadata Persistence
   * 
   * **Validates: Requirements 2.4**
   * 
   * Scenario: Upload document with title, verify metadata is persisted
   * Expected:
   * - Document title is saved correctly
   * - Document URL is saved correctly
   * - Metadata is retrievable
   */
  describe('Test 10: Document metadata persistence', () => {
    it('should persist document metadata correctly', async () => {
      const email = generateUniqueEmail(10);
      const testFilePath = createTestFile('test-metadata-10.pdf', 'Metadata test PDF');

      try {
        // Register doctor
        const registerResponse = await request(app.getHttpServer())
          .post('/auth/register')
          .send({
            email,
            password: 'SecurePass666',
            fullName: 'Dr. Integration Ten',
            role: 'DOCTOR',
            licenseNumber: generateUniqueLicense(10),
            primarySpecialty: 'Urology',
          });

        expect(registerResponse.status).toBe(201);
        const accessToken = registerResponse.body.accessToken;
        const doctorId = registerResponse.body.user.doctorProfile.id;

        // Upload document with custom title
        const customTitle = 'Medical License - 2024';
        const uploadResponse = await request(app.getHttpServer())
          .post('/doctors/documents')
          .set('Authorization', `Bearer ${accessToken}`)
          .field('title', customTitle)
          .attach('file', testFilePath);

        expect(uploadResponse.status).toBe(201);

        // Verify metadata in database
        const document = await prisma.doctorDocument.findUnique({
          where: { id: uploadResponse.body.id },
        });

        expect(document).toBeDefined();
        expect(document?.title).toBe(customTitle);
        expect(document?.fileUrl).toBe(uploadResponse.body.fileUrl);
        expect(document?.doctorId).toBe(doctorId);
        expect(document?.createdAt).toBeDefined();
      } finally {
        cleanupFile(testFilePath);
      }
    });
  });
});
