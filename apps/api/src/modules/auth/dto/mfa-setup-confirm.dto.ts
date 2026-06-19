import { IsString, IsNotEmpty, Length } from 'class-validator';

export class MfaSetupConfirmDto {
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  totpCode!: string;

  @IsString()
  @IsNotEmpty()
  tempSecret!: string;
}
