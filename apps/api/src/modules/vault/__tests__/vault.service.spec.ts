import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { VaultService } from '../vault.service';

describe('VaultService', () => {
  let service: VaultService;
  let configService: { get: jest.Mock };

  beforeEach(async () => {
    configService = {
      get: jest.fn().mockImplementation((key: string, defaultValue?: unknown) => {
        const config: Record<string, unknown> = {
          'vault.enabled': false,
          'vault.address': 'http://127.0.0.1:8200',
          'vault.mountPath': 'secret',
          'vault.secretPath': 'nuhiris',
          'vault.authMethod': 'token',
          'vault.token': 'test-token',
          'vault.roleId': '',
          'vault.secretId': '',
          'vault.renewalIntervalMs': 300000,
          ENCRYPTION_KEY: 'a'.repeat(64),
          HMAC_KEY: 'b'.repeat(64),
        };
        return config[key] ?? defaultValue;
      }),
    };

    const module = await Test.createTestingModule({
      providers: [
        VaultService,
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get(VaultService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('returns env var when vault is disabled', () => {
    const key = service.getEncryptionKey();
    expect(key).toBe('a'.repeat(64));
  });

  it('returns hmac key from env', () => {
    const key = service.getHmacKey();
    expect(key).toBe('b'.repeat(64));
  });

  it('falls back to empty string for missing key', () => {
    const key = service.getSecret('minioSecretKey');
    expect(key).toBe('');
  });

  it('does not throw on init when vault is disabled', async () => {
    await expect(service.onModuleInit()).resolves.not.toThrow();
  });

  it('cleans up on destroy', () => {
    expect(() => service.onModuleDestroy()).not.toThrow();
  });
});
