export class AuthResponseDto {
  accessToken!: string;
  refreshToken!: string;
  expiresIn!: number;
  user!: {
    accountId: string;
    username: string;
    email: string;
    role: string;
    facilityId: string | null;
    providerId: string | null;
    mfaEnabled: boolean;
  };
}

export class MfaChallengeResponseDto {
  mfaRequired!: boolean;
  mfaSessionToken!: string;
}

export class MfaSetupResponseDto {
  secret!: string;
  qrCodeDataUrl!: string;
  otpauthUrl!: string;
}
