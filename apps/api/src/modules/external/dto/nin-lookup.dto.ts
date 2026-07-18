import { IsString, Length, Matches } from 'class-validator';

export class NinLookupDto {
  @IsString()
  @Length(11, 11, { message: 'NIN must be exactly 11 digits' })
  @Matches(/^[0-9]{11}$/, { message: 'NIN must contain only digits' })
  nin!: string;
}
