import { IsString, IsOptional, IsEnum, IsNumber, IsDateString } from 'class-validator';
import { AccreditationStatus } from '@nuhiris/shared-types';

export class UpdateFacilityDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  shortName?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsString()
  contactPhone?: string;

  @IsOptional()
  @IsString()
  contactEmail?: string;

  @IsOptional()
  @IsEnum(AccreditationStatus)
  accreditationStatus?: AccreditationStatus;

  @IsOptional()
  @IsDateString()
  accreditationExpiry?: string;

  @IsOptional()
  @IsEnum(['operational', 'closed', 'suspended'] as const)
  operationalStatus?: 'operational' | 'closed' | 'suspended';
}
