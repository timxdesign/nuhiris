import { IsUUID, IsString, IsOptional } from 'class-validator';

export class CreateDispenseDto {
  @IsUUID()
  prescriptionId!: string;

  @IsString()
  quantity!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
