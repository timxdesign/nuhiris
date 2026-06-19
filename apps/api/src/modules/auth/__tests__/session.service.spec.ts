import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SessionService } from '../services/session.service';

const mockRedis = {
  setex: jest.fn().mockResolvedValue('OK'),
  get: jest.fn(),
  del: jest.fn().mockResolvedValue(1),
  quit: jest.fn().mockResolvedValue('OK'),
};

jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => mockRedis);
});

describe('SessionService', () => {
  let service: SessionService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module = await Test.createTestingModule({
      providers: [
        SessionService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'redis.host') return 'localhost';
              if (key === 'redis.port') return 6379;
              return undefined;
            }),
          },
        },
      ],
    }).compile();

    service = module.get(SessionService);
    service.onModuleInit();
  });

  afterEach(async () => {
    await service.onModuleDestroy();
  });

  describe('refresh tokens', () => {
    it('creates a refresh token and stores it in Redis', async () => {
      const data = {
        accountId: 'acc-1',
        username: 'admin',
        role: 'national_admin',
        facilityId: null,
        providerId: null,
      };

      const token = await service.createRefreshToken(data);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBe(96);
      expect(mockRedis.setex).toHaveBeenCalledWith(
        `refresh:${token}`,
        7 * 24 * 60 * 60,
        JSON.stringify(data),
      );
    });

    it('consumes a refresh token (single use)', async () => {
      const storedData = JSON.stringify({
        accountId: 'acc-1',
        username: 'admin',
        role: 'national_admin',
        facilityId: null,
        providerId: null,
      });
      mockRedis.get.mockResolvedValueOnce(storedData);

      const result = await service.consumeRefreshToken('some-token');
      expect(result).toEqual(JSON.parse(storedData));
      expect(mockRedis.del).toHaveBeenCalledWith('refresh:some-token');
    });

    it('returns null for an invalid/expired refresh token', async () => {
      mockRedis.get.mockResolvedValueOnce(null);
      const result = await service.consumeRefreshToken('invalid-token');
      expect(result).toBeNull();
    });
  });

  describe('MFA sessions', () => {
    it('creates an MFA session token', async () => {
      const token = await service.createMfaSession('acc-1');
      expect(token).toBeDefined();
      expect(token.length).toBe(64);
      expect(mockRedis.setex).toHaveBeenCalledWith(
        `mfa_session:${token}`,
        5 * 60,
        'acc-1',
      );
    });

    it('consumes an MFA session token', async () => {
      mockRedis.get.mockResolvedValueOnce('acc-1');
      const accountId = await service.consumeMfaSession('mfa-token');
      expect(accountId).toBe('acc-1');
      expect(mockRedis.del).toHaveBeenCalledWith('mfa_session:mfa-token');
    });

    it('returns null for expired MFA session', async () => {
      mockRedis.get.mockResolvedValueOnce(null);
      const result = await service.consumeMfaSession('expired-token');
      expect(result).toBeNull();
    });
  });
});
