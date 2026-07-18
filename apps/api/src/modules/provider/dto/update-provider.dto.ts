import { IsString, IsOptional } from 'class-validator';

export class UpdateProviderDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  specialty?: string;

  @IsOptional()
  @IsString()
  licenceNumber?: string;

  @IsOptional()
  @IsString()
  regulatoryBody?: string;
}
