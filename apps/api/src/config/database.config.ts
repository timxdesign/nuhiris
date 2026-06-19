import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  host: process.env.DATABASE_HOST ?? 'localhost',
  port: parseInt(process.env.DATABASE_PORT ?? '5432', 10),
  name: process.env.DATABASE_NAME ?? 'nuhiris_db',
  username: process.env.DATABASE_USER ?? 'nuhiris_app',
  password: process.env.DATABASE_PASSWORD ?? '',
}));
