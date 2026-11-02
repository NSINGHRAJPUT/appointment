import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { CloudinaryService } from './cloudinary.service';

// Mock cloudinary
jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload_stream: jest.fn(),
      destroy: jest.fn(),
    },
  },
}));

jest.mock('streamifier', () => ({
  createReadStream: jest.fn((buffer) => ({
    pipe: jest.fn((stream) => {
      // Simulate successful upload
      setTimeout(() => {
        stream.emit('finish');
      }, 0);
    }),
  })),
}));

describe('CloudinaryService', () => {
  let service: CloudinaryService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CloudinaryService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config: Record<string, string> = {
                CLOUDINARY_CLOUD_NAME: 'test-cloud',
                CLOUDINARY_API_KEY: 'test-key',
                CLOUDINARY_API_SECRET: 'test-secret',
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<CloudinaryService>(CloudinaryService);
    configService = module.get<ConfigService>(ConfigService);
  });

  describe('validateFile', () => {
    it('should return valid for PDF file', () => {
      const file = {
        originalname: 'test.pdf',
        mimetype: 'application/pdf',
        size: 1024 * 1024, // 1MB
        buffer: Buffer.from('test'),
      } as any;

      const result = service.validateFile(file);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return valid for JPG file', () => {
      const file = {
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
        size: 2 * 1024 * 1024, // 2MB
        buffer: Buffer.from('test'),
      } as any;

      const result = service.validateFile(file);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return valid for PNG file', () => {
      const file = {
        originalname: 'test.png',
        mimetype: 'image/png',
        size: 3 * 1024 * 1024, // 3MB
        buffer: Buffer.from('test'),
      } as any;

      const result = service.validateFile(file);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject invalid file type', () => {
      const file = {
        originalname: 'test.txt',
        mimetype: 'text/plain',
        size: 1024,
        buffer: Buffer.from('test'),
      } as any;

      const result = service.validateFile(file);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Only PDF, JPG, and PNG files are allowed');
    });

    it('should reject file exceeding 5MB', () => {
      const file = {
        originalname: 'test.pdf',
        mimetype: 'application/pdf',
        size: 6 * 1024 * 1024, // 6MB
        buffer: Buffer.from('test'),
      } as any;

      const result = service.validateFile(file);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('File size must not exceed 5MB');
    });

    it('should reject when no file provided', () => {
      const result = service.validateFile(null as any);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('No file provided');
    });

    it('should accept file exactly at 5MB limit', () => {
      const file = {
        originalname: 'test.pdf',
        mimetype: 'application/pdf',
        size: 5 * 1024 * 1024, // Exactly 5MB
        buffer: Buffer.from('test'),
      } as any;

      const result = service.validateFile(file);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  describe('uploadFile', () => {
    it('should throw BadRequestException for invalid file type', async () => {
      const file = {
        originalname: 'test.txt',
        mimetype: 'text/plain',
        size: 1024,
        buffer: Buffer.from('test'),
      } as any;

      await expect(service.uploadFile(file, 'doctor123')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for oversized file', async () => {
      const file = {
        originalname: 'test.pdf',
        mimetype: 'application/pdf',
        size: 6 * 1024 * 1024,
        buffer: Buffer.from('test'),
      } as any;

      await expect(service.uploadFile(file, 'doctor123')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('deleteFile', () => {
    it('should call cloudinary uploader destroy', async () => {
      const { v2: cloudinary } = require('cloudinary');
      cloudinary.uploader.destroy.mockResolvedValue({ result: 'ok' });

      await service.deleteFile('public-id-123');

      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith('public-id-123');
    });

    it('should throw BadRequestException on deletion error', async () => {
      const { v2: cloudinary } = require('cloudinary');
      cloudinary.uploader.destroy.mockRejectedValue(new Error('Deletion failed'));

      await expect(service.deleteFile('public-id-123')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
