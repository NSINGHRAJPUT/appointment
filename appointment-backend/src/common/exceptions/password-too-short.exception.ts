import { BadRequestException } from '@nestjs/common';

export class PasswordTooShortException extends BadRequestException {
  constructor() {
    super('Password must be at least 8 characters');
  }
}
