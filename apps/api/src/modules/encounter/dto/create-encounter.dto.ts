import { IsUUID, IsEnum, IsOptional, IsString } from 'class-validator';
import { EncounterType } from '@nuhiris/shared-types';

export class CreateEncounterDto {
  @IsUUID()
  nuhi!: string;

  @IsEnum(EncounterType)
  encounterType!: EncounterType;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
