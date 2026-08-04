import { registerAs } from '@nestjs/config';

/**
 * Managed Redis (Render Key Value, Upstash, ElastiCache) is addressed by URL.
 * A rediss:// scheme implies TLS, which ioredis negotiates automatically.
 */
export default registerAs('redis', () => ({
  url: process.env.REDIS_URL,
  host: process.env.REDIS_HOST ?? 'localhost',
  port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
}));
