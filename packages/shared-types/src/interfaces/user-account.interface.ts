import { UserRole } from '../enums';

export interface IUserAccount {
  accountId: string;
  username: string;
  email: string;
  role: UserRole;
  mfaEnabled: boolean;
  mfaType: 'totp' | 'fido2' | 'sms' | null;
  providerId: string | null;
  facilityId: string | null;
  status: 'active' | 'locked' | 'deactivated';
  lastLoginAt: string | null;
  createdAt: string;
}

export interface IJwtPayload {
  sub: string;
  roles: string[];
  facilityId: string | null;
  providerId: string | null;
  iat: number;
  exp: number;
  jti: string;
}
