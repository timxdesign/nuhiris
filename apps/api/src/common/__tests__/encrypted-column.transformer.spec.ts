import {
  EncryptedColumnTransformer,
  setGlobalEncryptionKey,
  encryptedTransformer,
} from '../transformers/encrypted-column.transformer';
import { randomBytes } from 'crypto';

describe('EncryptedColumnTransformer', () => {
  const testKey = randomBytes(32).toString('hex');

  describe('custom instance', () => {
    const transformer = new EncryptedColumnTransformer(() => testKey);

    it('encrypts and decrypts a value', () => {
      const plain = '12345678901';
      const encrypted = transformer.to(plain);
      expect(encrypted).not.toBe(plain);
      expect(encrypted).toContain(':');

      const decrypted = transformer.from(encrypted);
      expect(decrypted).toBe(plain);
    });

    it('handles null values', () => {
      expect(transformer.to(null)).toBeNull();
      expect(transformer.from(null)).toBeNull();
    });

    it('produces different ciphertext for same plaintext', () => {
      const plain = 'test-value';
      const a = transformer.to(plain);
      const b = transformer.to(plain);
      expect(a).not.toBe(b);
    });
  });

  describe('global transformer', () => {
    it('uses global key', () => {
      setGlobalEncryptionKey(testKey);
      const encrypted = encryptedTransformer.to('secret-data');
      expect(encrypted).not.toBeNull();
      const decrypted = encryptedTransformer.from(encrypted);
      expect(decrypted).toBe('secret-data');
    });
  });
});
