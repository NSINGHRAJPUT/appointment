import { ExceptionFilter, Catch, ArgumentsHost, BadRequestException } from '@nestjs/common';
import { Response } from 'express';

/**
 * Exception filter for multer errors
 * Catches and formats multer-specific errors
 */
@Catch()
export class MulterExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    // Check if this is a multer error
    if (exception.code === 'LIMIT_FILE_SIZE') {
      return response.status(400).json({
        statusCode: 400,
        message: 'File size must not exceed 5MB',
        error: 'Bad Request',
      });
    }

    if (exception.code === 'LIMIT_FILE_COUNT') {
      return response.status(400).json({
        statusCode: 400,
        message: 'Maximum 5 files allowed per upload',
        error: 'Bad Request',
      });
    }

    if (exception.code === 'LIMIT_UNEXPECTED_FILE' || exception.message?.includes('Unexpected field')) {
      return response.status(400).json({
        statusCode: 400,
        message: 'Maximum 5 files allowed per upload',
        error: 'Bad Request',
      });
    }

    // Re-throw if not a multer error
    throw exception;
  }
}
