import { IsOptional, IsString, IsEnum } from 'class-validator';
import { ProviderCategory } from '@nuhiris/shared-types';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

// See SearchPatientDto: pagination is folded in so the handler binds one
// @Query() object under the pipe's forbidNonWhitelisted setting.
export class SearchProviderDto extends PaginationQueryDto {
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
