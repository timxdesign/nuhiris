import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';

jest.mock('otplib', () => ({
  generateSecret: jest.fn().mockReturnValue('MOCK_SECRET'),
  generateURI: jest.fn().mockReturnValue('otpauth://totp/test'),
  verifySync: jest.fn().mockReturnValue({ valid: false }),
}));

import { AuthService } from '../auth.service';
import { UserAccount } from '../entities/user-account.entity';
import { SessionService } from '../services/session.service';
import { MfaService } from '../services/mfa.service';
import { KeycloakAdminService } from '../services/keycloak-admin.service';
import { UserRole } from '@nuhiris/shared-types';
import { AuthResponseDto, MfaChallengeResponseDto } from '../dto/auth-response.dto';

const mockUser: UserAccount = {
  accountId: 'acc-1',
  username: 'dr.adeyemi',
  email: 'adeyemi@nuhiris.gov.ng',
  passwordHash: '$2b$12$hashedpassword',
  role: UserRole.MEDICAL_OFFICER,
  mfaEnabled: false,
  mfaSecret: null,
  mfaType: null,
  providerId: 'prov-1',
  facilityId: 'fac-1',
  patientNuhi: null,
  status: 'active',
  lastLoginAt: null,
  failedAttempts: 0,
  lockedUntil: null,
  createdAt: new Date(),
};

describe('AuthService', () => {
  let service: AuthService;
  let userRepo: {
    findOne: jest.Mock;
    findOneOrFail: jest.Mock;
    update: jest.Mock;
    increment: jest.Mock;
  };
  let sessionService: {
    createRefreshToken: jest.Mock;
    consumeRefreshToken: jest.Mock;
    revokeRefreshToken: jest.Mock;
    createMfaSession: jest.Mock;
    consumeMfaSession: jest.Mock;
  };
  let mfaService: {
    createSecret: jest.Mock;
    generateQrCode: jest.Mock;
    verifyToken: jest.Mock;
    enableMfa: jest.Mock;
    disableMfa: jest.Mock;
    checkAndIncrementAttempts: jest.Mock;
    resetAttempts: jest.Mock;
  };
  let keycloakAdmin: {
    exchangeCredentials: jest.Mock;
  };

  beforeEach(async () => {
    userRepo = {
      findOne: jest.fn(),
      findOneOrFail: jest.fn(),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
      increment: jest.fn().mockResolvedValue({ affected: 1 }),
    };

    sessionService = {
      createRefreshToken: jest.fn().mockResolvedValue('refresh-token-abc'),
      consumeRefreshToken: jest.fn(),
      revokeRefreshToken: jest.fn().mockResolvedValue(undefined),
      createMfaSession: jest.fn().mockResolvedValue('mfa-session-xyz'),
      consumeMfaSession: jest.fn(),
    };

    mfaService = {
      createSecret: jest.fn().mockReturnValue('JBSWY3DPEHPK3PXP'),
      generateQrCode: jest.fn().mockResolvedValue({
        qrCodeDataUrl: 'data:image/png;base64,abc',
        otpauthUrl: 'otpauth://totp/NUHIRIS:user?secret=JBSWY3DPEHPK3PXP',
      }),
      verifyToken: jest.fn(),
      enableMfa: jest.fn().mockResolvedValue(undefined),
      disableMfa: jest.fn().mockResolvedValue(undefined),
      checkAndIncrementAttempts: jest.fn().mockResolvedValue(undefined),
      resetAttempts: jest.fn().mockResolvedValue(undefined),
    };

    keycloakAdmin = {
      exchangeCredentials: jest.fn().mockResolvedValue({
        access_token: 'kc-access-token',
        expires_in: 900,
        refresh_token: 'kc-refresh',
        refresh_expires_in: 604800,
        token_type: 'Bearer',
      }),
    };

    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(UserAccount), useValue: userRepo },
        { provide: SessionService, useValue: sessionService },
        { provide: MfaService, useValue: mfaService },
        { provide: KeycloakAdminService, useValue: keycloakAdmin },
        { provide: ConfigService, useValue: { get: () => '' } },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  describe('login', () => {
    it('throws for unknown username', async () => {
      userRepo.findOne.mockResolvedValue(null);
      await expect(service.login('unknown', 'pass')).rejects.toThrow(UnauthorizedException);
    });

    it('throws for deactivated account', async () => {
      userRepo.findOne.mockResolvedValue({ ...mockUser, status: 'deactivated' });
      await expect(service.login('dr.adeyemi', 'pass')).rejects.toThrow(UnauthorizedException);
    });

    it('returns MFA challenge when MFA is enabled', async () => {
      const bcrypt = jest.requireActual('bcrypt') as typeof import('bcrypt');
      const hash = await bcrypt.hash('password123', 4);
      userRepo.findOne.mockResolvedValue({
        ...mockUser,
        passwordHash: hash,
        mfaEnabled: true,
        mfaSecret: 'secret',
      });

      const result = await service.login('dr.adeyemi', 'password123');
      expect((result as MfaChallengeResponseDto).mfaRequired).toBe(true);
      expect((result as MfaChallengeResponseDto).mfaSessionToken).toBe('mfa-session-xyz');
    });

    it('returns tokens when MFA is not enabled', async () => {
      const bcrypt = jest.requireActual('bcrypt') as typeof import('bcrypt');
      const hash = await bcrypt.hash('password123', 4);
      userRepo.findOne.mockResolvedValue({ ...mockUser, passwordHash: hash });

      const result = (await service.login('dr.adeyemi', 'password123')) as AuthResponseDto;
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBe('refresh-token-abc');
      expect(result.user.username).toBe('dr.adeyemi');
    });

    it('increments failed attempts on wrong password', async () => {
      userRepo.findOne.mockResolvedValue(mockUser);
      await expect(service.login('dr.adeyemi', 'wrong')).rejects.toThrow(UnauthorizedException);
      expect(userRepo.increment).toHaveBeenCalled();
    });
  });

  describe('verifyMfa', () => {
    it('throws for invalid MFA session', async () => {
      sessionService.consumeMfaSession.mockResolvedValue(null);
      await expect(service.verifyMfa('bad-token', '123456')).rejects.toThrow(UnauthorizedException);
    });

    it('returns tokens on valid TOTP', async () => {
      sessionService.consumeMfaSession.mockResolvedValue('acc-1');
      userRepo.findOneOrFail.mockResolvedValue({ ...mockUser, mfaSecret: 'secret' });
      mfaService.verifyToken.mockReturnValue(true);

      const result = await service.verifyMfa('session-token', '123456');
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBe('refresh-token-abc');
    });

    it('throws on invalid TOTP', async () => {
      sessionService.consumeMfaSession.mockResolvedValue('acc-1');
      userRepo.findOneOrFail.mockResolvedValue({ ...mockUser, mfaSecret: 'secret' });
      mfaService.verifyToken.mockReturnValue(false);

      await expect(service.verifyMfa('session-token', '000000')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refresh', () => {
    it('issues new tokens on valid refresh', async () => {
      sessionService.consumeRefreshToken.mockResolvedValue({
        accountId: 'acc-1',
        username: 'dr.adeyemi',
        role: 'medical_officer',
        facilityId: 'fac-1',
        providerId: 'prov-1',
      });
      userRepo.findOne.mockResolvedValue(mockUser);

      const result = await service.refresh('old-refresh-token');
      expect(result.refreshToken).toBe('refresh-token-abc');
    });

    it('throws for expired/invalid refresh token', async () => {
      sessionService.consumeRefreshToken.mockResolvedValue(null);
      await expect(service.refresh('bad-token')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('MFA setup', () => {
    it('returns QR code for MFA setup', async () => {
      userRepo.findOneOrFail.mockResolvedValue(mockUser);
      const result = await service.setupMfa('acc-1');
      expect(result.secret).toBe('JBSWY3DPEHPK3PXP');
      expect(result.qrCodeDataUrl).toMatch(/^data:image/);
    });

    it('throws when MFA is already enabled', async () => {
      userRepo.findOneOrFail.mockResolvedValue({ ...mockUser, mfaEnabled: true });
      await expect(service.setupMfa('acc-1')).rejects.toThrow(BadRequestException);
    });

    it('confirms MFA setup with valid code', async () => {
      mfaService.verifyToken.mockReturnValue(true);
      await service.confirmMfaSetup('acc-1', 'JBSWY3DPEHPK3PXP', '123456');
      expect(mfaService.enableMfa).toHaveBeenCalledWith('acc-1', 'JBSWY3DPEHPK3PXP');
    });

    it('rejects MFA setup with invalid code', async () => {
      mfaService.verifyToken.mockReturnValue(false);
      await expect(service.confirmMfaSetup('acc-1', 'secret', '000000')).rejects.toThrow(BadRequestException);
    });
  });

  describe('logout', () => {
    it('revokes the refresh token', async () => {
      await service.logout('refresh-token');
      expect(sessionService.revokeRefreshToken).toHaveBeenCalledWith('refresh-token');
    });
  });

  describe('getProfile', () => {
    it('returns user without sensitive fields', async () => {
      userRepo.findOneOrFail.mockResolvedValue(mockUser);
      const profile = await service.getProfile('acc-1');
      expect(profile).not.toHaveProperty('passwordHash');
      expect(profile).not.toHaveProperty('mfaSecret');
      expect(profile).toHaveProperty('username', 'dr.adeyemi');
    });
  });
});
