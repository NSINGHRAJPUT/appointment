import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import * as streamifier from 'streamifier';

export interface UploadResult {
  url: string;
  publicId: string;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

@Injectable()
export class CloudinaryService {
  private readonly allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/png'];
  private readonly allowedExtensions = ['pdf', 'jpg', 'jpeg', 'png'];
  private readonly maxFileSize = 5 * 1024 * 1024; // 5MB

  constructor(private readonly configService: ConfigService) {
    // Initialize Cloudinary with environment variables
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  /**
   * Validates a file before upload
   * @param file Multer.File to validate
   * @returns ValidationResult with valid flag and optional error message
   */
  validateFile(file: Express.Multer.File): ValidationResult {
    if (!file) {
      return { valid: false, error: 'No file provided' };
    }

    // Check file type by MIME type
    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      return {
        valid: false,
        error: 'Only PDF, JPG, and PNG files are allowed',
      };
    }

    // Check file size
    if (file.size > this.maxFileSize) {
      return {
        valid: false,
        error: 'File size must not exceed 5MB',
      };
    }

    return { valid: true };
  }

  /**
   * Uploads a file to Cloudinary
   * @param file Multer.File to upload
   * @param doctorId Doctor ID for folder organization
   * @returns Promise with URL and publicId
   */
  async uploadFile(
    file: Express.Multer.File,
    doctorId: string,
  ): Promise<UploadResult> {
    // Validate file first
    const validation = this.validateFile(file);
    if (!validation.valid) {
      throw new BadRequestException(validation.error);
    }

    try {
      // Create a readable stream from the buffer
      const stream = streamifier.createReadStream(file.buffer);

      // Sanitize filename: remove special characters, keep only alphanumeric, hyphens, underscores, and dots
      const sanitizedName = file.originalname
        .replace(/[^a-zA-Z0-9._-]/g, '-')
        .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
        .replace(/-+/g, '-'); // Replace multiple hyphens with single hyphen

      // Upload to Cloudinary with folder structure
      const result = await new Promise<UploadResult>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: `doctor-documents/${doctorId}`,
            resource_type: 'auto',
            public_id: `${Date.now()}-${sanitizedName}`,
          },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve({
                url: result.secure_url,
                publicId: result.public_id,
              });
            }
          },
        );

        stream.pipe(uploadStream);
      });

      return result;
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw new BadRequestException('Failed to upload file. Please try again.');
    }
  }

  /**
   * Deletes a file from Cloudinary
   * @param publicId Public ID of the file to delete
   */
  async deleteFile(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      console.error('Cloudinary deletion error:', error);
      throw new BadRequestException('Failed to delete file. Please try again.');
    }
  }
}
