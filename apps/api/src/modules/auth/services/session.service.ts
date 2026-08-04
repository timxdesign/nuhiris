import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'node:crypto';
import Redis from 'ioredis';

const REFRESH_PREFIX = 'refresh:';
const MFA_SESSION_PREFIX = 'mfa_session:';
const REFRESH_TTL = 7 * 24 * 60 * 60; // 7 days
const MFA_SESSION_TTL = 5 * 60; // 5 minutes

interface RefreshTokenData {
  accountId: string;
  username: string;
  role: string;
  facilityId: string | null;
  providerId: string | null;
}

@Injectable()
export class SessionService implements OnModuleInit, OnModuleDestroy {
  private redis!: Redis;

  constructor(private config: ConfigService) {}

  onModuleInit() {
    const url = this.config.get<string>('redis.url');
    this.redis = url
      ? new Redis(url, { lazyConnect: true })
      : new Redis({
          host: this.config.get<string>('redis.host'),
          port: this.config.get<number>('redis.port'),
          lazyConnect: true,
        });
  }

  async onModuleDestroy() {
    await this.redis.quit();
  }

  async createRefreshToken(data: RefreshTokenData): Promise<string> {
    const token = randomBytes(48).toString('hex');
    await this.redis.setex(REFRESH_PREFIX + token, REFRESH_TTL, JSON.stringify(data));
    return token;
  }

  async consumeRefreshToken(token: string): Promise<RefreshTokenData | null> {
    const key = REFRESH_PREFIX + token;
    const raw = await this.redis.get(key);
    if (!raw) return null;
    await this.redis.del(key);
    return JSON.parse(raw) as RefreshTokenData;
  }

  async revokeRefreshToken(token: string): Promise<void> {
    await this.redis.del(REFRESH_PREFIX + token);
  }

  async createMfaSession(accountId: string): Promise<string> {
    const token = randomBytes(32).toString('hex');
    await this.redis.setex(MFA_SESSION_PREFIX + token, MFA_SESSION_TTL, accountId);
    return token;
  }

  async consumeMfaSession(token: string): Promise<string | null> {
    const key = MFA_SESSION_PREFIX + token;
    const accountId = await this.redis.get(key);
    if (!accountId) return null;
    await this.redis.del(key);
    return accountId;
  }
}
