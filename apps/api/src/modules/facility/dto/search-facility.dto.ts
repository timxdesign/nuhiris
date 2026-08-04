import { IsOptional, IsString, IsEnum } from 'class-validator';
import { FacilityType, LevelOfCare } from '@nuhiris/shared-types';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

// See SearchPatientDto: pagination is folded in so the handler binds one
// @Query() object under the pipe's forbidNonWhitelisted setting.
export class SearchFacilityDto extends PaginationQueryDto {
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
