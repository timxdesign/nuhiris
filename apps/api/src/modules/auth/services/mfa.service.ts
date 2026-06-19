import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { generateSecret, generateURI, verifySync } from 'otplib';
import * as QRCode from 'qrcode';
import { UserAccount } from '../entities/user-account.entity';

const MFA_MAX_ATTEMPTS = 5;
const MFA_LOCKOUT_MINUTES = 30;

@Injectable()
export class MfaService {
  constructor(
    @InjectRepository(UserAccount)
    private userRepo: Repository<UserAccount>,
  ) {}

  createSecret(): string {
    return generateSecret();
  }

  async generateQrCode(username: string, secret: string): Promise<{ qrCodeDataUrl: string; otpauthUrl: string }> {
    const otpauthUrl = generateURI({ issuer: 'NUHIRIS', label: username, secret });
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);
    return { qrCodeDataUrl, otpauthUrl };
  }

  verifyToken(token: string, secret: string): boolean {
    return verifySync({ token, secret }).valid;
  }

  async enableMfa(accountId: string, secret: string): Promise<void> {
    await this.userRepo.update(accountId, {
      mfaEnabled: true,
      mfaSecret: secret,
      mfaType: 'totp',
    });
  }

  async disableMfa(accountId: string): Promise<void> {
    await this.userRepo.update(accountId, {
      mfaEnabled: false,
      mfaSecret: null,
      mfaType: null,
    });
  }

  async checkAndIncrementAttempts(user: UserAccount): Promise<void> {
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const remainingMs = user.lockedUntil.getTime() - Date.now();
      const remainingMin = Math.ceil(remainingMs / 60_000);
      throw new UnauthorizedException(`Account locked. Try again in ${remainingMin} minutes`);
    }

    if (user.failedAttempts >= MFA_MAX_ATTEMPTS) {
      const lockedUntil = new Date(Date.now() + MFA_LOCKOUT_MINUTES * 60_000);
      await this.userRepo.update(user.accountId, {
        lockedUntil,
        failedAttempts: 0,
      });
      throw new UnauthorizedException(`Too many failed attempts. Account locked for ${MFA_LOCKOUT_MINUTES} minutes`);
    }

    await this.userRepo.increment({ accountId: user.accountId }, 'failedAttempts', 1);
  }

  async resetAttempts(accountId: string): Promise<void> {
    await this.userRepo.update(accountId, {
      failedAttempts: 0,
      lockedUntil: null,
    });
  }
}
