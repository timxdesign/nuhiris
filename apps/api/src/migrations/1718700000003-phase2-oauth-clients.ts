import { MigrationInterface, QueryRunner } from 'typeorm';

export class Phase2OauthClients1718700000003 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS oauth_clients (
        client_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        client_name        VARCHAR NOT NULL UNIQUE,
        client_secret_hash VARCHAR NOT NULL,
        organization_name  VARCHAR NOT NULL,
        contact_email      VARCHAR NOT NULL,
        scopes             TEXT[] NOT NULL DEFAULT '{}',
        redirect_uris      TEXT[] NOT NULL DEFAULT '{}',
        grant_types        TEXT[] NOT NULL DEFAULT '{client_credentials}',
        status             VARCHAR NOT NULL DEFAULT 'active',
        rate_limit         INTEGER NOT NULL DEFAULT 1000,
        registered_by      UUID NOT NULL,
        created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await queryRunner.query(`CREATE INDEX idx_oauth_clients_status ON oauth_clients (status);`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS oauth_clients;`);
  }
}
