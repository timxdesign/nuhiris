import { IsUUID, IsEnum, IsDateString, IsOptional } from 'class-validator';
import { EmploymentType } from '@nuhiris/shared-types';

export class CreateAffiliationDto {
  @IsUUID()
  facilityId!: string;

  @IsEnum(EmploymentType)
  employmentType!: EmploymentType;

  @IsDateString()
  startDate!: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
