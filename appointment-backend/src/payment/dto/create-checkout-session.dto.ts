import { IsString, IsOptional } from 'class-validator';

export class CreateCheckoutSessionDto {
  @IsString()
  appointmentId: string;

  @IsString()
  doctorId: string;

  @IsString()
  patientIdentifier: string;

  @IsString()
  @IsOptional()
  currency?: string;
}
