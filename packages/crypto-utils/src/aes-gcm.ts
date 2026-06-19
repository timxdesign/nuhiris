import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

export interface EncryptedData {
  ciphertext: string;
  iv: string;
  authTag: string;
}

export function encrypt(plaintext: string, keyHex: string): EncryptedData {
  const key = Buffer.from(keyHex, 'hex');
  if (key.length !== 32) {
    throw new Error('AES-256 key must be 32 bytes (64 hex characters)');
  }

  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });

  let ciphertext = cipher.update(plaintext, 'utf8', 'hex');
  ciphertext += cipher.final('hex');
  const authTag = cipher.getAuthTag();

  return {
    ciphertext,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
  };
}

export function decrypt(encrypted: EncryptedData, keyHex: string): string {
  const key = Buffer.from(keyHex, 'hex');
  if (key.length !== 32) {
    throw new Error('AES-256 key must be 32 bytes (64 hex characters)');
  }

  const iv = Buffer.from(encrypted.iv, 'hex');
  const authTag = Buffer.from(encrypted.authTag, 'hex');
  const decipher = createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  decipher.setAuthTag(authTag);

  let plaintext = decipher.update(encrypted.ciphertext, 'hex', 'utf8');
  plaintext += decipher.final('utf8');

  return plaintext;
}

export function encryptToString(plaintext: string, keyHex: string): string {
  const { iv, authTag, ciphertext } = encrypt(plaintext, keyHex);
  return `${iv}:${authTag}:${ciphertext}`;
}

export function decryptFromString(encoded: string, keyHex: string): string {
  const parts = encoded.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted string format. Expected iv:authTag:ciphertext');
  }
  const [iv, authTag, ciphertext] = parts;
  return decrypt({ iv: iv!, authTag: authTag!, ciphertext: ciphertext! }, keyHex);
}
