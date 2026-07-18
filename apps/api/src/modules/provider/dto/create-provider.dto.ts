import { IsString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { ProviderCategory } from '@nuhiris/shared-types';

export class CreateProviderDto {
  @IsString()
  fullName!: string;

  @IsEnum(ProviderCategory)
  category!: ProviderCategory;

  @IsOptional()
  @IsString()
  specialty?: string;

  @IsOptional()
  @IsString()
  licenceNumber?: string;

  @IsOptional()
  @IsString()
  regulatoryBody?: string;

  @IsOptional()
  @IsUUID()
  accountId?: string;
}
