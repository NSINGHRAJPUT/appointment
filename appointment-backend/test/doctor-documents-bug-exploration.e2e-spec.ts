import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Bug Condition Exploration Test
 * 
 * **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**
 * 
 * This test explores the bug condition where a doctor attempts to register with documents.
 * 
 * Bug Condition (C): Request includes documents field (array of files) during doctor registration
 * Expected Property (P): Files are uploaded to Cloudinary and DoctorDocument records are created
 * 
 * CRITICAL: This test MUST FAIL on unfixed code - failure confirms the bug exists.
 * The test encodes the expected behavior and will validate the fix when it passes after implementation.
 * 
 * Counterexamples that demonstrate the bug:
 * - Registration request with documents field is rejected with validation error
 * - No endpoint exists for document uploads during onboarding
 * - Cloudinary credentials are not used to upload files
 * - DoctorDocument records are never created
 */
describe('Doctor Document Upload - Bug Condition Exploration (e2e)', () => {
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

  // Helper to generate unique license numbers
  const generateUniqueLicense = (index: number) => `LIC${Date.now()}${index}`;
  const generateUniqueEmail = (index: number) => `dr.test${Date.now()}${index}@example.com`;

  // Store emails for later lookup
  const testEmails: Record<number, string> = {};

  /**
   * Test Case 1: Doctor Registration with Single Document
   * 
   * Scenario: A doctor attempts to register with one PDF file
   * Expected: File is uploaded to Cloudinary and DoctorDocument record is created
   * 
   * This test will FAIL on unfixed code because:
   * - The RegisterDto rejects the documents field with validation error
   * - No CloudinaryService exists to upload files
   * - No logic exists to create DoctorDocument records
   */
  it('should accept doctor registration with single document and upload to Cloudinary', async () => {
    // Create a temporary test file
    const testFilePath = path.join(__dirname, 'test-license.pdf');
    fs.writeFileSync(testFilePath, Buffer.from('PDF test content'));
    
    const email = generateUniqueEmail(1);
    testEmails[1] = email;

    try {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .field('email', email)
        .field('password', 'SecurePass123')
        .field('fullName', 'Dr. Test One')
        .field('role', 'DOCTOR')
        .field('licenseNumber', generateUniqueLicense(1))
        .field('primarySpecialty', 'Cardiology')
        .attach('documents', testFilePath);

      // Expected: 201 Created (not 400 Bad Request)
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('accessToken');

      // Verify DoctorDocument was created
      const doctor = await prisma.doctorProfile.findFirst({
        where: { user: { email } },
        include: { documents: true },
      });

      expect(doctor).toBeDefined();
      expect(doctor?.documents).toHaveLength(1);
      expect(doctor?.documents[0]).toHaveProperty('fileUrl');
      expect(doctor?.documents[0].fileUrl).toMatch(/https:\/\/res\.cloudinary\.com\//);
      expect(doctor?.documents[0].title).toBe('test-license.pdf');
    } finally {
      // Cleanup
      if (fs.existsSync(testFilePath)) {
        fs.unlinkSync(testFilePath);
      }
    }
  });

  /**
   * Test Case 2: Doctor Registration with Multiple Documents
   * 
   * Scenario: A doctor attempts to register with multiple files (PDF and JPG)
   * Expected: All files are uploaded to Cloudinary and DoctorDocument records are created
   * 
   * This test will FAIL on unfixed code because:
   * - The RegisterDto rejects the documents field
   * - No logic exists to handle multiple file uploads
   * - No DoctorDocument records are created
   */
  it('should accept doctor registration with multiple documents and upload all to Cloudinary', async () => {
    // Create temporary test files
    const testFile1Path = path.join(__dirname, 'test-license.pdf');
    const testFile2Path = path.join(__dirname, 'test-certificate.jpg');
    fs.writeFileSync(testFile1Path, Buffer.from('PDF test content'));
    fs.writeFileSync(testFile2Path, Buffer.from('JPG test content'));
    
    const email = generateUniqueEmail(2);
    testEmails[2] = email;

    try {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .field('email', email)
        .field('password', 'SecurePass456')
        .field('fullName', 'Dr. Test Two')
        .field('role', 'DOCTOR')
        .field('licenseNumber', generateUniqueLicense(2))
        .field('primarySpecialty', 'Neurology')
        .attach('documents', testFile1Path)
        .attach('documents', testFile2Path);

      // Expected: 201 Created
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('accessToken');

      // Verify both DoctorDocuments were created
      const doctor = await prisma.doctorProfile.findFirst({
        where: { user: { email } },
        include: { documents: true },
      });

      expect(doctor).toBeDefined();
      expect(doctor?.documents).toHaveLength(2);
      
      // Verify all documents have Cloudinary URLs
      doctor?.documents.forEach((doc) => {
        expect(doc.fileUrl).toMatch(/https:\/\/res\.cloudinary\.com\//);
        expect(doc.title).toMatch(/test-(license|certificate)\.(pdf|jpg)/);
      });
    } finally {
      // Cleanup
      if (fs.existsSync(testFile1Path)) {
        fs.unlinkSync(testFile1Path);
      }
      if (fs.existsSync(testFile2Path)) {
        fs.unlinkSync(testFile2Path);
      }
    }
  });

  /**
   * Test Case 3: Doctor Registration Without Documents (Preservation)
   * 
   * Scenario: A doctor registers without the documents field
   * Expected: Registration succeeds and documents array is empty
   * 
   * This test verifies that existing registration flows without documents continue to work.
   * This should PASS on both fixed and unfixed code (preservation requirement).
   */
  it('should accept doctor registration without documents field (backward compatibility)', async () => {
    const email = generateUniqueEmail(3);
    testEmails[3] = email;
    
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email,
        password: 'SecurePass789',
        fullName: 'Dr. Test Three',
        role: 'DOCTOR',
        licenseNumber: generateUniqueLicense(3),
        primarySpecialty: 'Dermatology',
      });

    // Expected: 201 Created
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('accessToken');

    // Verify doctor profile was created with empty documents
    const doctor = await prisma.doctorProfile.findFirst({
      where: { user: { email } },
      include: { documents: true },
    });

    expect(doctor).toBeDefined();
    expect(doctor?.documents).toHaveLength(0);
  });

  /**
   * Test Case 4: Patient Registration Rejects Documents (Preservation)
   * 
   * Scenario: A patient attempts to register with documents field
   * Expected: Request is rejected with validation error
   * 
   * This test verifies that patient registrations continue to reject documents.
   * This should PASS on both fixed and unfixed code (preservation requirement).
   */
  it('should reject patient registration with documents field', async () => {
    // Create a temporary test file
    const testFilePath = path.join(__dirname, 'test-id.pdf');
    fs.writeFileSync(testFilePath, Buffer.from('PDF test content'));

    try {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .field('email', generateUniqueEmail(4))
        .field('password', 'SecurePass999')
        .field('fullName', 'Patient Test')
        .field('role', 'PATIENT')
        .attach('documents', testFilePath);

      // Expected: 400 Bad Request (documents not allowed for patients)
      expect(response.status).toBe(400);
      expect(response.body.message).toContain('documents');
    } finally {
      // Cleanup
      if (fs.existsSync(testFilePath)) {
        fs.unlinkSync(testFilePath);
      }
    }
  });

  /**
   * Test Case 5: Onboarding Document Upload Endpoint
   * 
   * Scenario: A doctor attempts to upload a document after registration via POST /doctors/documents
   * Expected: Document is uploaded to Cloudinary and DoctorDocument record is created
   * 
   * This test will FAIL on unfixed code because:
   * - The POST /doctors/documents endpoint doesn't exist
   * - No logic exists to handle document uploads during onboarding
   */
  it('should allow authenticated doctor to upload document via POST /doctors/documents endpoint', async () => {
    const email = generateUniqueEmail(5);
    testEmails[5] = email;
    
    // First, register a doctor
    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email,
        password: 'SecurePass111',
        fullName: 'Dr. Test Four',
        role: 'DOCTOR',
        licenseNumber: generateUniqueLicense(5),
        primarySpecialty: 'Orthopedics',
      });

    expect(registerResponse.status).toBe(201);
    const accessToken = registerResponse.body.accessToken;

    // Create a temporary test file
    const testFilePath = path.join(__dirname, 'test-updated-license.pdf');
    fs.writeFileSync(testFilePath, Buffer.from('Updated PDF test content'));

    try {
      // Upload document during onboarding
      const uploadResponse = await request(app.getHttpServer())
        .post('/doctors/documents')
        .set('Authorization', `Bearer ${accessToken}`)
        .field('title', 'Updated License')
        .attach('file', testFilePath);

      // Expected: 201 Created
      expect(uploadResponse.status).toBe(201);
      expect(uploadResponse.body).toHaveProperty('fileUrl');
      expect(uploadResponse.body.fileUrl).toMatch(/https:\/\/res\.cloudinary\.com\//);
      expect(uploadResponse.body.title).toBe('Updated License');

      // Verify DoctorDocument was created
      const doctor = await prisma.doctorProfile.findFirst({
        where: { user: { email } },
        include: { documents: true },
      });

      expect(doctor?.documents).toHaveLength(1);
      expect(doctor?.documents[0].fileUrl).toMatch(/https:\/\/res\.cloudinary\.com\//);
    } finally {
      // Cleanup
      if (fs.existsSync(testFilePath)) {
        fs.unlinkSync(testFilePath);
      }
    }
  });
});
