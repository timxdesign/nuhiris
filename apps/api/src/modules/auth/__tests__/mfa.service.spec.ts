import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UnauthorizedException } from '@nestjs/common';

const mockGenerateSecret = jest.fn().mockReturnValue('JBSWY3DPEHPK3PXP');
const mockGenerateURI = jest.fn().mockReturnValue('otpauth://totp/NUHIRIS:testuser?secret=JBSWY3DPEHPK3PXP&issuer=NUHIRIS');
const mockVerifySync = jest.fn().mockReturnValue({ valid: false });

jest.mock('otplib', () => ({
  generateSecret: mockGenerateSecret,
  generateURI: mockGenerateURI,
  verifySync: mockVerifySync,
}));

import { MfaService } from '../services/mfa.service';
import { UserAccount } from '../entities/user-account.entity';
import { UserRole } from '@nuhiris/shared-types';

describe('MfaService', () => {
  let service: MfaService;
  let repo: jest.Mocked<Partial<Repository<UserAccount>>>;

  beforeEach(async () => {
    repo = {
      update: jest.fn().mockResolvedValue({ affected: 1 }),
      increment: jest.fn().mockResolvedValue({ affected: 1 }),
    };

    const module = await Test.createTestingModule({
      providers: [
        MfaService,
        { provide: getRepositoryToken(UserAccount), useValue: repo },
      ],
    }).compile();

    service = module.get(MfaService);
  });

  it('generates a secret by delegating to otplib', () => {
    const secret = service.createSecret();
    expect(secret).toBe('JBSWY3DPEHPK3PXP');
    expect(mockGenerateSecret).toHaveBeenCalled();
  });

  it('generates a QR code data URL', async () => {
    const result = await service.generateQrCode('testuser', 'JBSWY3DPEHPK3PXP');
    expect(result.otpauthUrl).toContain('NUHIRIS');
    expect(result.otpauthUrl).toContain('testuser');
    expect(mockGenerateURI).toHaveBeenCalledWith(
      expect.objectContaining({ issuer: 'NUHIRIS', label: 'testuser', secret: 'JBSWY3DPEHPK3PXP' }),
    );
  });

  it('returns true when otplib verifySync returns valid', () => {
    mockVerifySync.mockReturnValueOnce({ valid: true, offset: 0 });
    expect(service.verifyToken('123456', 'secret')).toBe(true);
  });

  it('returns false when otplib verifySync returns invalid', () => {
    mockVerifySync.mockReturnValueOnce({ valid: false });
    expect(service.verifyToken('000000', 'secret')).toBe(false);
  });

  it('enables MFA for a user', async () => {
    await service.enableMfa('user-123', 'JBSWY3DPEHPK3PXP');
    expect(repo.update).toHaveBeenCalledWith('user-123', {
      mfaEnabled: true,
      mfaSecret: 'JBSWY3DPEHPK3PXP',
      mfaType: 'totp',
    });
  });

  it('disables MFA for a user', async () => {
    await service.disableMfa('user-123');
    expect(repo.update).toHaveBeenCalledWith('user-123', {
      mfaEnabled: false,
      mfaSecret: null,
      mfaType: null,
    });
  });

  it('throws when account is locked', async () => {
    const user = {
      accountId: 'user-123',
      failedAttempts: 0,
      lockedUntil: new Date(Date.now() + 60_000),
    } as UserAccount;

    await expect(service.checkAndIncrementAttempts(user)).rejects.toThrow(UnauthorizedException);
  });

  it('locks account after max failed attempts', async () => {
    const user = {
      accountId: 'user-123',
      failedAttempts: 5,
      lockedUntil: null,
      role: UserRole.MEDICAL_OFFICER,
    } as UserAccount;

    await expect(service.checkAndIncrementAttempts(user)).rejects.toThrow(UnauthorizedException);
    expect(repo.update).toHaveBeenCalledWith('user-123', expect.objectContaining({ failedAttempts: 0 }));
  });

  it('increments failed attempts when under limit', async () => {
    const user = {
      accountId: 'user-123',
      failedAttempts: 2,
      lockedUntil: null,
    } as UserAccount;

    await service.checkAndIncrementAttempts(user);
    expect(repo.increment).toHaveBeenCalledWith({ accountId: 'user-123' }, 'failedAttempts', 1);
  });
});
