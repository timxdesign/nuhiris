import { IsString, IsOptional, IsUUID, IsNumber, IsDateString } from 'class-validator';

export class CreateImmunisationDto {
  @IsUUID()
  nuhi!: string;

  @IsString()
  vaccineCode!: string;

  @IsString()
  vaccineName!: string;

  @IsOptional()
  @IsNumber()
  doseNumber?: number;

  @IsOptional()
  @IsString()
  lotNumber?: string;

  @IsOptional()
  @IsString()
  site?: string;

  @IsOptional()
  @IsString()
  route?: string;

  @IsOptional()
  @IsDateString()
  administeredAt?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
