import { ConfigService } from '@nestjs/config';
import { NinEncryptionService } from '../services/nin-encryption.service';
import { randomBytes } from 'crypto';

const testKeyHex = randomBytes(32).toString('hex');
const testHmacKeyHex = randomBytes(32).toString('hex');

describe('NinEncryptionService', () => {
  let service: NinEncryptionService;

  beforeEach(() => {
    const config = {
      get: jest.fn((key: string) => {
        if (key === 'ENCRYPTION_KEY') return testKeyHex;
        if (key === 'HMAC_KEY') return testHmacKeyHex;
        return undefined;
      }),
    } as unknown as ConfigService;

    service = new NinEncryptionService(config);
  });

  it('encrypts and decrypts NIN round-trip', () => {
    const nin = '12345678901';
    const encrypted = service.encrypt(nin);
    expect(encrypted).not.toBe(nin);
    const decrypted = service.decrypt(encrypted);
    expect(decrypted).toBe(nin);
  });

  it('produces different ciphertext for same NIN (random IV)', () => {
    const nin = '12345678901';
    const a = service.encrypt(nin);
    const b = service.encrypt(nin);
    expect(a).not.toBe(b);
  });

  it('produces deterministic HMAC hash', () => {
    const nin = '12345678901';
    const hash1 = service.hash(nin);
    const hash2 = service.hash(nin);
    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64); // SHA-256 hex
  });

  it('produces different hashes for different NINs', () => {
    const hash1 = service.hash('12345678901');
    const hash2 = service.hash('98765432109');
    expect(hash1).not.toBe(hash2);
  });
});
