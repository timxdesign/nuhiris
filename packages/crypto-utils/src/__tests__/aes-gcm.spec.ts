import { encrypt, decrypt, encryptToString, decryptFromString } from '../aes-gcm';
import { randomBytes } from 'crypto';

const TEST_KEY = randomBytes(32).toString('hex');

describe('AES-256-GCM', () => {
  it('should round-trip encrypt and decrypt', () => {
    const plaintext = '12345678901';
    const encrypted = encrypt(plaintext, TEST_KEY);
    const result = decrypt(encrypted, TEST_KEY);
    expect(result).toBe(plaintext);
  });

  it('should produce different ciphertext for the same plaintext (random IV)', () => {
    const plaintext = '12345678901';
    const a = encrypt(plaintext, TEST_KEY);
    const b = encrypt(plaintext, TEST_KEY);
    expect(a.ciphertext).not.toBe(b.ciphertext);
    expect(a.iv).not.toBe(b.iv);
  });

  it('should reject tampered ciphertext', () => {
    const encrypted = encrypt('sensitive data', TEST_KEY);
    encrypted.ciphertext = encrypted.ciphertext.replace(/.$/, 'f');
    expect(() => decrypt(encrypted, TEST_KEY)).toThrow();
  });

  it('should reject wrong key', () => {
    const encrypted = encrypt('sensitive data', TEST_KEY);
    const wrongKey = randomBytes(32).toString('hex');
    expect(() => decrypt(encrypted, wrongKey)).toThrow();
  });

  it('should reject invalid key length', () => {
    expect(() => encrypt('data', 'short')).toThrow('AES-256 key must be 32 bytes');
  });

  it('should round-trip with string format', () => {
    const plaintext = '12345678901';
    const encoded = encryptToString(plaintext, TEST_KEY);
    expect(encoded.split(':')).toHaveLength(3);
    const result = decryptFromString(encoded, TEST_KEY);
    expect(result).toBe(plaintext);
  });

  it('should reject invalid string format', () => {
    expect(() => decryptFromString('invalid', TEST_KEY)).toThrow('Invalid encrypted string format');
  });
});
