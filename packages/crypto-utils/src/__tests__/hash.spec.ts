import { sha256, hmacSha256 } from '../hash';
import { randomBytes } from 'crypto';

describe('sha256', () => {
  it('should produce a consistent hash', () => {
    const hash = sha256('hello');
    expect(hash).toBe('2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824');
  });

  it('should produce different hashes for different inputs', () => {
    expect(sha256('a')).not.toBe(sha256('b'));
  });
});

describe('hmacSha256', () => {
  const key = randomBytes(32).toString('hex');

  it('should produce a consistent HMAC', () => {
    const hmac1 = hmacSha256('12345678901', key);
    const hmac2 = hmacSha256('12345678901', key);
    expect(hmac1).toBe(hmac2);
  });

  it('should produce different HMACs for different inputs', () => {
    expect(hmacSha256('a', key)).not.toBe(hmacSha256('b', key));
  });

  it('should produce different HMACs for different keys', () => {
    const key2 = randomBytes(32).toString('hex');
    expect(hmacSha256('data', key)).not.toBe(hmacSha256('data', key2));
  });
});
