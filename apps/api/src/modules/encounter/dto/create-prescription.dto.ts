import { IsString, IsOptional } from 'class-validator';

export class CreatePrescriptionDto {
  @IsString()
  drugCode!: string;

  @IsString()
  drugName!: string;

  @IsString()
  dosage!: string;

  @IsString()
  frequency!: string;

  @IsOptional()
  @IsString()
  duration?: string;

  @IsOptional()
  @IsString()
  route?: string;

  @IsOptional()
  @IsString()
  quantity?: string;

  @IsOptional()
  @IsString()
  instructions?: string;
}
