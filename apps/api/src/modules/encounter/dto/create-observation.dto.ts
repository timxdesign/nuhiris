import { IsString, IsOptional, IsNumber, IsDateString } from 'class-validator';

export class CreateObservationDto {
  @IsString()
  loincCode!: string;

  @IsOptional()
  @IsString()
  display?: string;

  @IsOptional()
  @IsNumber()
  valueQuantity?: number;

  @IsOptional()
  @IsString()
  valueUnit?: string;

  @IsOptional()
  @IsString()
  valueString?: string;

  @IsOptional()
  @IsString()
  valueCodeable?: string;

  @IsOptional()
  @IsString()
  referenceRange?: string;

  @IsOptional()
  @IsString()
  interpretation?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsDateString()
  effectiveDt?: string;
}
