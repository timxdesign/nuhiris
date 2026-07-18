import { IsString, IsOptional, IsDateString } from 'class-validator';

export class CreateDiagnosisDto {
  @IsString()
  icd11Code!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  onsetDate?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  severity?: string;
}
