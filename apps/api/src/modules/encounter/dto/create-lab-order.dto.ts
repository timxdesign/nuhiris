import { IsString, IsOptional } from 'class-validator';

export class CreateLabOrderDto {
  @IsString()
  loincCode!: string;

  @IsString()
  testName!: string;

  @IsOptional()
  @IsString()
  urgency?: string;
}
