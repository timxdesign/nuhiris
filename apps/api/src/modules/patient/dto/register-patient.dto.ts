import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsDateString,
  IsUUID,
  Length,
  IsEmail,
  Matches,
} from 'class-validator';
import { RegistrationType } from '@nuhiris/shared-types';

export class RegisterPatientDto {
  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @IsDateString()
  dateOfBirth!: string;

  @IsEnum(['male', 'female', 'intersex', 'not_stated'])
  sex!: 'male' | 'female' | 'intersex' | 'not_stated';

  @IsString()
  @IsNotEmpty()
  state!: string;

  @IsOptional()
  @IsString()
  lga?: string;

  @IsOptional()
  @IsString()
  @Matches(/^(\+234|0)[0-9]{10}$/, { message: 'Phone must be a valid Nigerian number' })
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @Length(11, 11, { message: 'NIN must be exactly 11 digits' })
  @Matches(/^[0-9]{11}$/, { message: 'NIN must contain only digits' })
  nin?: string;

  @IsEnum(RegistrationType)
  registrationType!: RegistrationType;

  @IsOptional()
  @IsUUID()
  facilityId?: string;
}
