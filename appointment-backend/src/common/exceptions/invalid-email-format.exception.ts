import { BadRequestException } from '@nestjs/common';

export class InvalidEmailFormatException extends BadRequestException {
  constructor() {
    super('Invalid email format');
  }
}
