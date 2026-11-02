import { IsString } from 'class-validator';

export class VerifySessionDto {
  @IsString()
  sessionId: string;
}
