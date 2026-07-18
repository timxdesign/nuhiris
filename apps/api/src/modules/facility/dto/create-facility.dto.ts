import { IsString, IsEnum, IsOptional, IsNumber } from 'class-validator';
import { FacilityType, LevelOfCare, OwnershipType } from '@nuhiris/shared-types';

export class CreateFacilityDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  shortName?: string;

  @IsEnum(FacilityType)
  type!: FacilityType;

  @IsEnum(LevelOfCare)
  levelOfCare!: LevelOfCare;

  @IsEnum(OwnershipType)
  ownership!: OwnershipType;

  @IsString()
  state!: string;

  @IsOptional()
  @IsString()
  lga?: string;

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
}
