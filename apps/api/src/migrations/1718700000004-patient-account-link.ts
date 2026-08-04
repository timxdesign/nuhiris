import { MigrationInterface, QueryRunner } from 'typeorm';

export class PatientAccountLink1718700000004 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE user_accounts
        ADD COLUMN IF NOT EXISTS patient_nuhi UUID REFERENCES patients(nuhi);
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_user_accounts_patient_nuhi ON user_accounts (patient_nuhi) WHERE patient_nuhi IS NOT NULL;`,
    );

    // Dev patient-portal account linked to seeded patient (password "Password1!")
    await queryRunner.query(`
      INSERT INTO "user_accounts" ("account_id","username","email","password_hash","role","mfa_enabled","status","patient_nuhi")
      VALUES (
        'c0000000-0000-4000-8000-000000000008',
        'patient.ada',
        'ada@example.com',
        '$2b$10$OoXH68bWyiDnhKzKzjr2Uen48VfxWNlXPs1tqwLjkh7w.VO/oi.ee',
        'patient',
        false,
        'active',
        'f0000000-0000-4000-8000-000000000001'
      )
      ON CONFLICT ("account_id") DO NOTHING;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "user_accounts" WHERE "account_id" = 'c0000000-0000-4000-8000-000000000008';`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS idx_user_accounts_patient_nuhi;`);
    await queryRunner.query(`ALTER TABLE user_accounts DROP COLUMN IF EXISTS patient_nuhi;`);
  }
}
