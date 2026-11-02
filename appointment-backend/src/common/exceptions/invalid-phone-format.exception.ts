import { BadRequestException } from '@nestjs/common';

export class InvalidPhoneFormatException extends BadRequestException {
  constructor() {
    super('Invalid phone format');
  }
}
