import { IsOptional, IsString, IsDateString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

// Extends pagination so the handler binds a single @Query() object. The global
// ValidationPipe uses forbidNonWhitelisted, so two separate @Query() DTOs would
// each reject the other's parameters and every search would 400.
export class SearchPatientDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  nin?: string;
}
