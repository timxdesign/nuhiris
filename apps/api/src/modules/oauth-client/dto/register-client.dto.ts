import { IsString, IsArray, IsOptional, IsEmail, IsInt, Min, Max } from 'class-validator';

export class RegisterClientDto {
  @IsString()
  clientName!: string;

  @IsString()
  organizationName!: string;

  @IsEmail()
  contactEmail!: string;

  @IsArray()
  @IsString({ each: true })
  scopes!: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  redirectUris?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  grantTypes?: string[];

  @IsOptional()
  @IsInt()
  @Min(10)
  @Max(10000)
  rateLimit?: number;
}
