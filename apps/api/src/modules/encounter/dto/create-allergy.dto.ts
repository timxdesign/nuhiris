import { IsString, IsOptional, IsUUID } from 'class-validator';

export class CreateAllergyDto {
  @IsUUID()
  nuhi!: string;

  @IsOptional()
  @IsString()
  substanceCode?: string;

  @IsString()
  substanceName!: string;

  @IsOptional()
  @IsString()
  reaction?: string;

  @IsOptional()
  @IsString()
  severity?: string;
}
