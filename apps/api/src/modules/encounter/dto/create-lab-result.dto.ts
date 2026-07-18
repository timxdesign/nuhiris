import { IsUUID, IsString, IsOptional } from 'class-validator';

export class CreateLabResultDto {
  @IsUUID()
  orderId!: string;

  @IsOptional()
  @IsString()
  resultValue?: string;

  @IsOptional()
  @IsString()
  resultUnit?: string;

  @IsOptional()
  @IsString()
  referenceRange?: string;

  @IsOptional()
  @IsString()
  interpretation?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsUUID()
  reportDocId?: string;
}
