import { IsUUID, IsString } from 'class-validator';

export class BreakGlassDto {
  @IsUUID()
  patientNuhi!: string;

  @IsString()
  reason!: string;
}
