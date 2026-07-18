import { IsUUID, IsString, IsOptional } from 'class-validator';

export class CreateReferralDto {
  @IsUUID()
  receivingFacilityId!: string;

  @IsOptional()
  @IsUUID()
  receivingProviderId?: string;

  @IsOptional()
  @IsString()
  urgency?: string;

  @IsString()
  reason!: string;

  @IsOptional()
  @IsString()
  clinicalSummary?: string;
}
