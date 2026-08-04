import { join } from 'path';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config({ path: ['.env', '../../.env'] });

const isCompiled = __filename.endsWith('.js');

// Managed providers (Neon, Render) supply a single TLS connection URL; fall
// back to discrete settings for local Docker development.
const url = process.env.DATABASE_URL;
const ssl = process.env.DATABASE_SSL
  ? process.env.DATABASE_SSL !== 'false'
  : Boolean(url);

export default new DataSource({
  type: 'postgres',
  ...(url
    ? { url }
    : {
        host: process.env.DATABASE_HOST ?? 'localhost',
        port: parseInt(process.env.DATABASE_PORT ?? '5432', 10),
        database: process.env.DATABASE_NAME ?? 'nuhiris_db',
        username: process.env.DATABASE_USER ?? 'nuhiris_app',
        password: process.env.DATABASE_PASSWORD ?? '',
      }),
  ssl: ssl ? { rejectUnauthorized: false } : false,
  // In a built image this file is dist/config/*.js, so resolve siblings from
  // __dirname; from source the CLI runs through ts-node against src/*.ts.
  migrations: isCompiled
    ? [join(__dirname, '..', 'migrations', '*.js')]
    : ['src/migrations/*.ts'],
  entities: isCompiled
    ? [join(__dirname, '..', '**', '*.entity.js')]
    : ['src/**/*.entity.ts'],
});
