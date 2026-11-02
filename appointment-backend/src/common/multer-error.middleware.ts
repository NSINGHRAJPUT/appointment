import { Injectable, NestMiddleware, BadRequestException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to catch and handle multer errors
 * Converts multer errors to proper HTTP 400 responses
 */
@Injectable()
export class MulterErrorMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Intercept the response to catch multer errors
    const originalSend = res.send;

    res.send = function (data: any) {
      // Check if this is a 413 Payload Too Large error
      if (res.statusCode === 413) {
        res.statusCode = 400;
        const errorResponse = {
          statusCode: 400,
          message: 'File size must not exceed 5MB',
          error: 'Bad Request',
        };
        return originalSend.call(this, errorResponse);
      }

      // Check if this is a multer "Unexpected field" error (too many files)
      if (res.statusCode === 400 && typeof data === 'object' && data.message) {
        if (data.message.includes('Unexpected field') && data.message.includes('documents')) {
          const errorResponse = {
            statusCode: 400,
            message: 'Maximum 5 files allowed per upload',
            error: 'Bad Request',
          };
          return originalSend.call(this, errorResponse);
        }
      }

      return originalSend.call(this, data);
    };

    next();
  }
}
