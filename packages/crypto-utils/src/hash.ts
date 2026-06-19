import { createHash, createHmac } from 'crypto';

export function sha256(data: string): string {
  return createHash('sha256').update(data).digest('hex');
}

export function hmacSha256(data: string, keyHex: string): string {
  const key = Buffer.from(keyHex, 'hex');
  return createHmac('sha256', key).update(data).digest('hex');
}
