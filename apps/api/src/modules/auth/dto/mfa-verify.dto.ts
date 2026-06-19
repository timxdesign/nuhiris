import { IsString, IsNotEmpty, Length } from 'class-validator';

export class MfaVerifyDto {
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  totpCode!: string;

  @IsString()
  @IsNotEmpty()
  mfaSessionToken!: string;
}
