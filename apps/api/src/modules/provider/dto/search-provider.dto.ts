import { IsOptional, IsString, IsEnum } from 'class-validator';
import { ProviderCategory } from '@nuhiris/shared-types';

export class SearchProviderDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  licenceNumber?: string;

  @IsOptional()
  @IsEnum(ProviderCategory)
  category?: ProviderCategory;

  @IsOptional()
  @IsString()
  specialty?: string;
}
