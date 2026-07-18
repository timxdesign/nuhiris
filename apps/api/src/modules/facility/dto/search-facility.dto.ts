import { IsOptional, IsString, IsEnum } from 'class-validator';
import { FacilityType, LevelOfCare } from '@nuhiris/shared-types';

export class SearchFacilityDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  lga?: string;

  @IsOptional()
  @IsEnum(FacilityType)
  type?: FacilityType;

  @IsOptional()
  @IsEnum(LevelOfCare)
  levelOfCare?: LevelOfCare;
}
