import { IsString, Length, Matches, IsOptional } from 'class-validator';

export class NinVerifyDto {
  @IsString()
  @Length(11, 11, { message: 'NIN must be exactly 11 digits' })
  @Matches(/^[0-9]{11}$/, { message: 'NIN must contain only digits' })
  nin!: string;

  @IsOptional()
  @IsString()
  imageBase64?: string;
}
