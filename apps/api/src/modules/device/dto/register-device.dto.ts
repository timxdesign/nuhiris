import { IsString, IsNotEmpty, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { DeviceType, TrustLevel } from '@nuhiris/shared-types';

export class RegisterDeviceDto {
  @IsString()
  @IsNotEmpty()
  deviceFingerprint!: string;

  @IsOptional()
  @IsString()
  deviceName?: string;

  @IsEnum(DeviceType)
  deviceType!: DeviceType;

  @IsOptional()
  @IsUUID()
  facilityId?: string;

  @IsEnum(TrustLevel)
  trustLevel!: TrustLevel;
}
