import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:3001',
  nodeEnv: process.env.NODE_ENV ?? 'development',
  encryptionKey: process.env.ENCRYPTION_KEY ?? '',
  hmacKey: process.env.HMAC_KEY ?? '',
  useRealNimc: process.env.USE_REAL_NIMC === 'true',
}));
