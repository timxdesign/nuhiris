import { Injectable, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { UserAccount } from './entities/user-account.entity';
import { SessionService } from './services/session.service';
import { MfaService } from './services/mfa.service';
import { KeycloakAdminService } from './services/keycloak-admin.service';
import { UserRole } from '@nuhiris/shared-types';
import { AuthResponseDto, MfaChallengeResponseDto, MfaSetupResponseDto } from './dto/auth-response.dto';

const BCRYPT_ROUNDS = 12;

const MFA_REQUIRED_ROLES: UserRole[] = [
  UserRole.NATIONAL_ADMIN,
  UserRole.FACILITY_ADMIN,
  UserRole.MEDICAL_OFFICER,
  UserRole.NURSE,
  UserRole.PHARMACIST,
  UserRole.LAB_SCIENTIST,
  UserRole.HEALTH_RECORDS_OFFICER,
  UserRole.AUDIT_INSPECTOR,
];

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  private readonly devSecret: string;

  constructor(
    @InjectRepository(UserAccount)
    private userRepo: Repository<UserAccount>,
    private sessionService: SessionService,
    private mfaService: MfaService,
    private keycloakAdmin: KeycloakAdminService,
    config: ConfigService,
  ) {
    this.devSecret = config.get<string>('keycloak.devSecret') ?? '';
  }

  async login(username: string, password: string): Promise<AuthResponseDto | MfaChallengeResponseDto> {
    const user = await this.userRepo.findOne({ where: { username } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status === 'locked') {
      if (user.lockedUntil && user.lockedUntil > new Date()) {
        throw new UnauthorizedException('Account is locked');
      }
      await this.userRepo.update(user.accountId, { status: 'active', lockedUntil: null, failedAttempts: 0 });
    }

    if (user.status === 'deactivated') {
      throw new UnauthorizedException('Account is deactivated');
    }

    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
      await this.userRepo.increment({ accountId: user.accountId }, 'failedAttempts', 1);
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.userRepo.update(user.accountId, { failedAttempts: 0 });

    if (user.mfaEnabled && user.mfaSecret) {
      const mfaSessionToken = await this.sessionService.createMfaSession(user.accountId);
      return { mfaRequired: true, mfaSessionToken };
    }

    const requiresMfa = MFA_REQUIRED_ROLES.includes(user.role);
    if (requiresMfa && !user.mfaEnabled) {
      this.logger.warn(`User ${username} with role ${user.role} has not set up MFA`);
    }

    return this.issueTokens(user);
  }

  async verifyMfa(mfaSessionToken: string, totpCode: string): Promise<AuthResponseDto> {
    const accountId = await this.sessionService.consumeMfaSession(mfaSessionToken);
    if (!accountId) {
      throw new UnauthorizedException('Invalid or expired MFA session');
    }

    const user = await this.userRepo.findOneOrFail({ where: { accountId } });

    await this.mfaService.checkAndIncrementAttempts(user);

    if (!user.mfaSecret || !this.mfaService.verifyToken(totpCode, user.mfaSecret)) {
      throw new UnauthorizedException('Invalid MFA code');
    }

    await this.mfaService.resetAttempts(accountId);
    return this.issueTokens(user);
  }

  async refresh(refreshToken: string): Promise<AuthResponseDto> {
    const data = await this.sessionService.consumeRefreshToken(refreshToken);
    if (!data) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.userRepo.findOne({ where: { accountId: data.accountId } });
    if (!user || user.status !== 'active') {
      throw new UnauthorizedException('Account no longer active');
    }

    return this.issueTokens(user);
  }

  async logout(refreshToken: string): Promise<void> {
    await this.sessionService.revokeRefreshToken(refreshToken);
  }

  async setupMfa(accountId: string): Promise<MfaSetupResponseDto> {
    const user = await this.userRepo.findOneOrFail({ where: { accountId } });

    if (user.mfaEnabled) {
      throw new BadRequestException('MFA is already enabled');
    }

    const secret = this.mfaService.createSecret();
    const { qrCodeDataUrl, otpauthUrl } = await this.mfaService.generateQrCode(user.username, secret);

    return { secret, qrCodeDataUrl, otpauthUrl };
  }

  async confirmMfaSetup(accountId: string, tempSecret: string, totpCode: string): Promise<void> {
    if (!this.mfaService.verifyToken(totpCode, tempSecret)) {
      throw new BadRequestException('Invalid TOTP code — MFA setup failed');
    }

    await this.mfaService.enableMfa(accountId, tempSecret);
  }

  async removeMfa(accountId: string): Promise<void> {
    await this.mfaService.disableMfa(accountId);
  }

  async getProfile(accountId: string): Promise<Omit<UserAccount, 'passwordHash' | 'mfaSecret'>> {
    const user = await this.userRepo.findOneOrFail({ where: { accountId } });
    const { passwordHash: _, mfaSecret: __, ...profile } = user;
    return profile;
  }

  private async issueTokens(user: UserAccount): Promise<AuthResponseDto> {
    let accessToken: string;
    let expiresIn: number;

    try {
      const keycloakResponse = await this.keycloakAdmin.exchangeCredentials(user.username, user.passwordHash);
      accessToken = keycloakResponse.access_token;
      expiresIn = keycloakResponse.expires_in;
    } catch {
      expiresIn = 900;
      if (this.devSecret) {
        accessToken = jwt.sign(
          {
            sub: user.accountId,
            roles: [user.role],
            facility_id: user.facilityId,
            provider_id: user.providerId,
          },
          this.devSecret,
          { algorithm: 'HS256', expiresIn },
        );
        this.logger.warn(`Keycloak unavailable — issued dev JWT for ${user.username}`);
      } else {
        accessToken = '';
        this.logger.warn(`Keycloak token exchange failed for ${user.username}, no dev secret set`);
      }
    }

    const refreshToken = await this.sessionService.createRefreshToken({
      accountId: user.accountId,
      username: user.username,
      role: user.role,
      facilityId: user.facilityId,
      providerId: user.providerId,
    });

    await this.userRepo.update(user.accountId, { lastLoginAt: new Date() });

    return {
      accessToken,
      refreshToken,
      expiresIn,
      user: {
        accountId: user.accountId,
        username: user.username,
        email: user.email,
        role: user.role,
        facilityId: user.facilityId,
        providerId: user.providerId,
        mfaEnabled: user.mfaEnabled,
      },
    };
  }
}
