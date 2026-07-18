import { IsUUID, IsString, IsOptional, IsEnum } from 'class-validator';

export class UploadDocumentDto {
  @IsUUID()
  nuhi!: string;

  @IsOptional()
  @IsUUID()
  encounterId?: string;

  @IsEnum([
    'discharge_summary',
    'lab_report',
    'imaging',
    'consent_form',
    'referral_letter',
  ] as const)
  docType!: string;
}
