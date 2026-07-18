import { MigrationInterface, QueryRunner } from 'typeorm';

export class Phase1Immunisations1718700000002 implements MigrationInterface {
  name = 'Phase1Immunisations1718700000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "immunisations" (
        "immunisation_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "nuhi" UUID NOT NULL REFERENCES "patients"("nuhi"),
        "encounter_id" UUID REFERENCES "encounters"("encounter_id"),
        "vaccine_code" VARCHAR NOT NULL,
        "vaccine_name" VARCHAR NOT NULL,
        "dose_number" INTEGER,
        "lot_number" VARCHAR,
        "site" VARCHAR,
        "route" VARCHAR,
        "administered_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "administered_by" UUID NOT NULL REFERENCES "providers"("provider_id"),
        "facility_id" UUID NOT NULL REFERENCES "facilities"("facility_id"),
        "status" VARCHAR NOT NULL DEFAULT 'completed',
        "notes" TEXT,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_immunisations_nuhi" ON "immunisations"("nuhi")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_immunisations_vaccine" ON "immunisations"("vaccine_code")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_referrals_receiving_facility" ON "referrals"("receiving_facility_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_prescriptions_encounter" ON "prescriptions"("encounter_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_diagnoses_encounter" ON "diagnoses"("encounter_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_lab_orders_encounter" ON "lab_orders"("encounter_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_dispenses_prescription" ON "dispenses"("prescription_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_dispenses_prescription"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_lab_orders_encounter"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_diagnoses_encounter"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_prescriptions_encounter"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_referrals_receiving_facility"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_immunisations_vaccine"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_immunisations_nuhi"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "immunisations"`);
  }
}
