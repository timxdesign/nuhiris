import { IsUUID, IsEnum, IsString, IsArray, IsOptional, IsDateString } from 'class-validator';
import { ConsentPurpose } from '@nuhiris/shared-types';

export class GrantConsentDto {
  @IsEnum(['provider', 'facility', 'role'] as const)
  granteeType!: 'provider' | 'facility' | 'role';

  @IsString()
  granteeId!: string;

  @IsEnum(ConsentPurpose)
  purpose!: ConsentPurpose;

  @IsArray()
  @IsString({ each: true })
  scope!: string[];

  @IsOptional()
  @IsDateString()
  validTo?: string;
}
