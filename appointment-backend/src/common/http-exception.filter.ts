import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';

/**
 * Global HTTP exception filter
 * Handles all HTTP exceptions and formats them consistently
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    
    // Get status code
    let status = 500;
    if (exception instanceof HttpException) {
      status = exception.getStatus();
    }

    // Get exception response
    let exceptionResponse = exception.getResponse?.() || { message: exception.message };
    let message = exceptionResponse['message'] || exception.message;
    
    // Handle 413 Payload Too Large (multer file size limit)
    if (status === 413) {
      return response.status(400).json({
        statusCode: 400,
        message: 'File size must not exceed 5MB',
        error: 'Bad Request',
      });
    }

    // Handle multer errors
    if (exception.code === 'LIMIT_FILE_SIZE') {
      return response.status(400).json({
        statusCode: 400,
        message: 'File size must not exceed 5MB',
        error: 'Bad Request',
      });
    }

    if (exception.code === 'LIMIT_UNEXPECTED_FILE') {
      return response.status(400).json({
        statusCode: 400,
        message: 'Maximum 5 files allowed per upload',
        error: 'Bad Request',
      });
    }

    // Check if this is a multer file filter error
    if (message && typeof message === 'string') {
      if (message.includes('Only PDF, JPG, and PNG files are allowed')) {
        return response.status(400).json({
          statusCode: 400,
          message: 'Only PDF, JPG, and PNG files are allowed',
          error: 'Bad Request',
        });
      }
      if (message.includes('File size must not exceed 5MB')) {
        return response.status(400).json({
          statusCode: 400,
          message: 'File size must not exceed 5MB',
          error: 'Bad Request',
        });
      }
      if (message.includes('Maximum 5 files allowed')) {
        return response.status(400).json({
          statusCode: 400,
          message: 'Maximum 5 files allowed per upload',
          error: 'Bad Request',
        });
      }
      // Handle multer "Unexpected field" error (too many files)
      if (message.includes('Unexpected field') && message.includes('documents')) {
        return response.status(400).json({
          statusCode: 400,
          message: 'Maximum 5 files allowed per upload',
          error: 'Bad Request',
        });
      }
    }

    // Default error response
    if (exception instanceof HttpException) {
      return response.status(status).json(exceptionResponse);
    }

    // For non-HTTP exceptions, return 500
    return response.status(500).json({
      statusCode: 500,
      message: 'Internal server error',
      error: 'Internal Server Error',
    });
  }
}
