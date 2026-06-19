import { DeviceType, TrustLevel } from '../enums';

export interface IRegisteredDevice {
  deviceId: string;
  deviceFingerprint: string;
  deviceName: string | null;
  deviceType: DeviceType;
  facilityId: string | null;
  trustLevel: TrustLevel;
  enrolledBy: string | null;
  enrolledAt: string;
  lastSeenAt: string | null;
  lastSeenLat: number | null;
  lastSeenLng: number | null;
  status: 'active' | 'suspended' | 'revoked';
  revokedAt: string | null;
  revocationReason: string | null;
}
