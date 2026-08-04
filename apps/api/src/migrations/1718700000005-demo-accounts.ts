import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Demo accounts for every user role, all sharing the password "Password1!".
 *
 * Also repairs databases that already ran SeedDevData1718700000001, which
 * stored a placeholder hash that did not match any known password — every
 * seeded account was impossible to log into.
 */
export class DemoAccounts1718700000005 implements MigrationInterface {
  name = 'DemoAccounts1718700000005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // bcrypt(10) of "Password1!"
    const passwordHash =
      '$2b$10$OoXH68bWyiDnhKzKzjr2Uen48VfxWNlXPs1tqwLjkh7w.VO/oi.ee';

    // ─── Audit inspector provider record (read-only oversight role) ───
    await queryRunner.query(`
      INSERT INTO "providers" ("provider_id","full_name","category","specialty","licence_number","regulatory_body","verification_status","status")
      VALUES ('b0000000-0000-4000-8000-000000000005','Tunde Adeyemi','admin','Health Information Governance','NUHIRIS/AUD/00011','NUHIRIS','verified','active')
      ON CONFLICT ("provider_id") DO NOTHING
    `);

    // ─── Accounts missing from the original seed ───
    await queryRunner.query(`
      INSERT INTO "user_accounts" ("account_id","username","email","password_hash","role","mfa_enabled","provider_id","facility_id","patient_nuhi","status")
      VALUES
        ('c0000000-0000-4000-8000-000000000009','auditor.tunde','tunde@nuhiris.gov.ng','${passwordHash}','audit_inspector',false,'b0000000-0000-4000-8000-000000000005',NULL,NULL,'active'),
        ('c0000000-0000-4000-8000-000000000010','patient.ibrahim','ibrahim@example.com','${passwordHash}','patient',false,NULL,NULL,'f0000000-0000-4000-8000-000000000003','active')
      ON CONFLICT ("account_id") DO NOTHING
    `);

    // ─── Repair every demo account: correct hash, unlocked, MFA off ───
    // Deliberately scoped to the c0000000-…-0000000000NN demo block so a real
    // operator account (e.g. 'timothy') keeps its own password.
    await queryRunner.query(`
      UPDATE "user_accounts"
         SET "password_hash" = '${passwordHash}',
             "status" = 'active',
             "failed_attempts" = 0,
             "locked_until" = NULL,
             "mfa_enabled" = false,
             "mfa_secret" = NULL,
             "mfa_type" = NULL
       WHERE "account_id" IN (
         'c0000000-0000-4000-8000-000000000001',
         'c0000000-0000-4000-8000-000000000002',
         'c0000000-0000-4000-8000-000000000003',
         'c0000000-0000-4000-8000-000000000004',
         'c0000000-0000-4000-8000-000000000005',
         'c0000000-0000-4000-8000-000000000006',
         'c0000000-0000-4000-8000-000000000007',
         'c0000000-0000-4000-8000-000000000008',
         'c0000000-0000-4000-8000-000000000009',
         'c0000000-0000-4000-8000-000000000010'
       )
    `);

    // ─── Facility admin needs a provider record for affiliation views ───
    await queryRunner.query(`
      INSERT INTO "provider_affiliations" ("affiliation_id","provider_id","facility_id","employment_type","start_date","status")
      VALUES ('d0000000-0000-4000-8000-000000000005','b0000000-0000-4000-8000-000000000005','a0000000-0000-4000-8000-000000000001','full_time','2023-05-01','active')
      ON CONFLICT ("affiliation_id") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "provider_affiliations" WHERE "affiliation_id" = 'd0000000-0000-4000-8000-000000000005'`,
    );
    await queryRunner.query(
      `DELETE FROM "user_accounts" WHERE "account_id" IN ('c0000000-0000-4000-8000-000000000009','c0000000-0000-4000-8000-000000000010')`,
    );
    await queryRunner.query(
      `DELETE FROM "providers" WHERE "provider_id" = 'b0000000-0000-4000-8000-000000000005'`,
    );
  }
}
