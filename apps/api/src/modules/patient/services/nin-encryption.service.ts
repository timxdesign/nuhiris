import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { encryptToString, decryptFromString } from '@nuhiris/crypto-utils';
import { hmacSha256 } from '@nuhiris/crypto-utils';

@Injectable()
export class NinEncryptionService {
  private readonly encryptionKeyHex: string;
  private readonly hmacKeyHex: string;

  constructor(config: ConfigService) {
    this.encryptionKeyHex = config.get<string>('ENCRYPTION_KEY')!;
    this.hmacKeyHex = config.get<string>('HMAC_KEY')!;
  }

  encrypt(nin: string): string {
    return encryptToString(nin, this.encryptionKeyHex);
  }

  decrypt(encryptedNin: string): string {
    return decryptFromString(encryptedNin, this.encryptionKeyHex);
  }

  hash(nin: string): string {
    return hmacSha256(nin, this.hmacKeyHex);
  }
}
