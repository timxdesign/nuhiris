import { registerAs } from '@nestjs/config';

/**
 * Managed Postgres providers (Neon, Render, RDS) hand out a single connection
 * URL and require TLS. When DATABASE_URL is present it wins; the discrete
 * host/port fields remain for local Docker development.
 */
export default registerAs('database', () => ({
  url: process.env.DATABASE_URL,
  host: process.env.DATABASE_HOST ?? 'localhost',
  port: parseInt(process.env.DATABASE_PORT ?? '5432', 10),
  name: process.env.DATABASE_NAME ?? 'nuhiris_db',
  username: process.env.DATABASE_USER ?? 'nuhiris_app',
  password: process.env.DATABASE_PASSWORD ?? '',
  // TLS defaults on whenever a managed URL is used; set DATABASE_SSL=false to
  // opt out (e.g. a plain Postgres container on a private network).
  ssl: process.env.DATABASE_SSL
    ? process.env.DATABASE_SSL !== 'false'
    : Boolean(process.env.DATABASE_URL),
}));
