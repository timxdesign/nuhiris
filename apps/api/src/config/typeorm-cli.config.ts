import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config({ path: ['.env', '../../.env'] });

export default new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST ?? 'localhost',
  port: parseInt(process.env.DATABASE_PORT ?? '5432', 10),
  database: process.env.DATABASE_NAME ?? 'nuhiris_db',
  username: process.env.DATABASE_USER ?? 'nuhiris_app',
  password: process.env.DATABASE_PASSWORD ?? '',
  migrations: ['src/migrations/*.ts'],
  entities: ['src/**/*.entity.ts'],
});
