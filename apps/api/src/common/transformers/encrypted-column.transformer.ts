import { ValueTransformer } from 'typeorm';
import { encryptToString, decryptFromString } from '@nuhiris/crypto-utils';

export class EncryptedColumnTransformer implements ValueTransformer {
  constructor(private readonly getKey: () => string) {}

  to(value: string | null): string | null {
    if (value === null || value === undefined) return null;
    return encryptToString(value, this.getKey());
  }

  from(value: string | null): string | null {
    if (value === null || value === undefined) return null;
    try {
      return decryptFromString(value, this.getKey());
    } catch {
      return value;
    }
  }
}

let _encryptionKey = '';

export function setGlobalEncryptionKey(key: string): void {
  _encryptionKey = key;
}

export function getGlobalEncryptionKey(): string {
  return _encryptionKey;
}

export const encryptedTransformer = new EncryptedColumnTransformer(() => _encryptionKey);
