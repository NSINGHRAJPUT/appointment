import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_FILE_COUNT = 5;

interface FileObject {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination?: string;
  filename?: string;
  path?: string;
  buffer?: Buffer;
}

@ValidatorConstraint({ name: 'isValidFiles', async: false })
export class IsValidFilesConstraint implements ValidatorConstraintInterface {
  validate(files: FileObject[] | undefined): boolean {
    if (!files || files.length === 0) {
      return true; // Empty is valid since field is optional
    }

    // Check file count
    if (files.length > MAX_FILE_COUNT) {
      return false;
    }

    // Check each file
    for (const file of files) {
      // Check MIME type
      if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        return false;
      }

      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        return false;
      }
    }

    return true;
  }

  defaultMessage(): string {
    return `Files must be PDF, JPG, or PNG format, max 5MB each, and max ${MAX_FILE_COUNT} files total`;
  }
}

export function IsValidFiles(validationOptions?: ValidationOptions) {
  return function (target: object, propertyName: string) {
    registerDecorator({
      target: target.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidFilesConstraint,
    });
  };
}
