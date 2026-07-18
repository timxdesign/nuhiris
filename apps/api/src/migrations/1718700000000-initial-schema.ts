import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1718700000000 implements MigrationInterface {
  name = 'InitialSchema1718700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    await queryRunner.query(`
      CREATE TYPE "user_role_enum" AS ENUM (
        'national_admin','facility_admin','medical_officer','nurse',
        'pharmacist','lab_scientist','health_records_officer','audit_inspector','patient'
      )
    `);
    await queryRunner.query(`
      CREATE TYPE "facility_type_enum" AS ENUM (
        'hospital','clinic','PHC','laboratory','pharmacy',
        'diagnostic_centre','specialist_centre','dental_clinic','maternity_home','rehabilitation_centre'
      )
    `);
    await queryRunner.query(`
      CREATE TYPE "level_of_care_enum" AS ENUM ('primary','secondary','tertiary')
    `);
    await queryRunner.query(`
      CREATE TYPE "ownership_type_enum" AS ENUM ('federal','state','LGA','faith-based','private','NGO')
    `);
    await queryRunner.query(`
      CREATE TYPE "accreditation_status_enum" AS ENUM ('pending','accredited','expired','suspended')
    `);
    await queryRunner.query(`
      CREATE TYPE "provider_category_enum" AS ENUM (
        'doctor','nurse','pharmacist','lab_scientist','radiographer',
        'physiotherapist','allied_health','admin'
      )
    `);
    await queryRunner.query(`
      CREATE TYPE "verification_status_enum" AS ENUM ('pending','verified','rejected','expired')
    `);
    await queryRunner.query(`
      CREATE TYPE "employment_type_enum" AS ENUM ('full_time','part_time','locum','consultant')
    `);
    await queryRunner.query(`
      CREATE TYPE "registration_type_enum" AS ENUM (
        'biometric_verified','selfie_verified','provider_initiated','provisional','emergency'
      )
    `);
    await queryRunner.query(`
      CREATE TYPE "patient_status_enum" AS ENUM ('active','provisional','deceased','merged')
    `);
    await queryRunner.query(`
      CREATE TYPE "device_type_enum" AS ENUM ('facility_tablet','facility_phone','patient_personal')
    `);
    await queryRunner.query(`
      CREATE TYPE "trust_level_enum" AS ENUM ('high','medium','low')
    `);
    await queryRunner.query(`
      CREATE TYPE "biometric_event_type_enum" AS ENUM (
        'registration','identity_check','liveness_check','access_gate','nin_lookup'
      )
    `);
    await queryRunner.query(`
      CREATE TYPE "biometric_method_enum" AS ENUM (
        'fingerprint','face','face_liveness','fingerprint_liveness','documentary'
      )
    `);
    await queryRunner.query(`
      CREATE TYPE "biometric_result_enum" AS ENUM (
        'match','no_match','inconclusive','liveness_fail','device_untrusted'
      )
    `);
    await queryRunner.query(`
      CREATE TYPE "encounter_type_enum" AS ENUM (
        'outpatient','inpatient','emergency','telemedicine','pharmacy','laboratory','radiology','referral'
      )
    `);
    await queryRunner.query(`
      CREATE TYPE "encounter_status_enum" AS ENUM ('open','in_progress','closed','cancelled')
    `);
    await queryRunner.query(`
      CREATE TYPE "consent_purpose_enum" AS ENUM ('TREATMENT','RESEARCH','INSURANCE','ADMIN')
    `);
    await queryRunner.query(`
      CREATE TYPE "audit_action_enum" AS ENUM (
        'READ','CREATE','UPDATE','DELETE','EXPORT',
        'EMERGENCY_OVERRIDE','LOGIN','LOGOUT','FAILED_ACCESS'
      )
    `);

    // ─── facilities ───
    await queryRunner.query(`
      CREATE TABLE "facilities" (
        "facility_id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" varchar NOT NULL,
        "short_name" varchar,
        "type" "facility_type_enum" NOT NULL,
        "level_of_care" "level_of_care_enum" NOT NULL,
        "ownership" "ownership_type_enum" NOT NULL,
        "state" varchar NOT NULL,
        "lga" varchar,
        "address" varchar,
        "latitude" decimal(10,7),
        "longitude" decimal(10,7),
        "contact_phone" varchar,
        "contact_email" varchar,
        "accreditation_status" "accreditation_status_enum" NOT NULL DEFAULT 'pending',
        "accreditation_expiry" date,
        "operational_status" varchar NOT NULL DEFAULT 'operational',
        "closure_date" date,
        "created_at" timestamptz NOT NULL DEFAULT NOW(),
        "updated_at" timestamptz NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_facilities" PRIMARY KEY ("facility_id")
      )
    `);

    // ─── user_accounts ───
    await queryRunner.query(`
      CREATE TABLE "user_accounts" (
        "account_id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "username" varchar NOT NULL,
        "email" varchar NOT NULL,
        "password_hash" varchar NOT NULL,
        "role" "user_role_enum" NOT NULL,
        "mfa_enabled" boolean NOT NULL DEFAULT false,
        "mfa_secret" varchar,
        "mfa_type" varchar,
        "provider_id" uuid,
        "facility_id" uuid,
        "status" varchar NOT NULL DEFAULT 'active',
        "last_login_at" timestamptz,
        "failed_attempts" integer NOT NULL DEFAULT 0,
        "locked_until" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_user_accounts" PRIMARY KEY ("account_id"),
        CONSTRAINT "UQ_user_accounts_username" UNIQUE ("username"),
        CONSTRAINT "UQ_user_accounts_email" UNIQUE ("email"),
        CONSTRAINT "FK_user_accounts_facility" FOREIGN KEY ("facility_id") REFERENCES "facilities"("facility_id")
      )
    `);

    // ─── providers ───
    await queryRunner.query(`
      CREATE TABLE "providers" (
        "provider_id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "full_name" varchar NOT NULL,
        "category" "provider_category_enum" NOT NULL,
        "specialty" varchar,
        "licence_number" varchar,
        "regulatory_body" varchar,
        "verification_status" "verification_status_enum" NOT NULL DEFAULT 'pending',
        "verified_at" timestamptz,
        "verification_source" varchar,
        "status" varchar NOT NULL DEFAULT 'active',
        "account_id" uuid,
        "created_at" timestamptz NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_providers" PRIMARY KEY ("provider_id"),
        CONSTRAINT "UQ_providers_licence" UNIQUE ("licence_number"),
        CONSTRAINT "FK_providers_account" FOREIGN KEY ("account_id") REFERENCES "user_accounts"("account_id")
      )
    `);

    // back-reference: user_accounts.provider_id -> providers
    await queryRunner.query(`
      ALTER TABLE "user_accounts"
        ADD CONSTRAINT "FK_user_accounts_provider" FOREIGN KEY ("provider_id") REFERENCES "providers"("provider_id")
    `);

    // ─── provider_affiliations ───
    await queryRunner.query(`
      CREATE TABLE "provider_affiliations" (
        "affiliation_id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "provider_id" uuid NOT NULL,
        "facility_id" uuid NOT NULL,
        "employment_type" "employment_type_enum" NOT NULL,
        "start_date" date NOT NULL,
        "end_date" date,
        "status" varchar NOT NULL DEFAULT 'active',
        "created_at" timestamptz NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_provider_affiliations" PRIMARY KEY ("affiliation_id"),
        CONSTRAINT "FK_prov_aff_provider" FOREIGN KEY ("provider_id") REFERENCES "providers"("provider_id"),
        CONSTRAINT "FK_prov_aff_facility" FOREIGN KEY ("facility_id") REFERENCES "facilities"("facility_id")
      )
    `);

    // ─── patients ───
    await queryRunner.query(`
      CREATE TABLE "patients" (
        "nuhi" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "full_name" varchar NOT NULL,
        "date_of_birth" date NOT NULL,
        "sex" varchar NOT NULL,
        "state" varchar NOT NULL,
        "lga" varchar,
        "phone" varchar,
        "email" varchar,
        "nin" varchar,
        "nin_hash" varchar,
        "nin_verified" boolean NOT NULL DEFAULT false,
        "nin_verification_date" timestamptz,
        "nin_verification_method" varchar,
        "nimc_photo_ref" varchar,
        "registration_type" "registration_type_enum" NOT NULL DEFAULT 'biometric_verified',
        "status" "patient_status_enum" NOT NULL DEFAULT 'active',
        "provisional_deadline" date,
        "deceased_at" timestamptz,
        "merged_into" uuid,
        "registration_facility_id" uuid,
        "registered_by" uuid,
        "created_at" timestamptz NOT NULL DEFAULT NOW(),
        "updated_at" timestamptz NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_patients" PRIMARY KEY ("nuhi"),
        CONSTRAINT "UQ_patients_nin" UNIQUE ("nin"),
        CONSTRAINT "UQ_patients_nin_hash" UNIQUE ("nin_hash"),
        CONSTRAINT "FK_patients_merged" FOREIGN KEY ("merged_into") REFERENCES "patients"("nuhi"),
        CONSTRAINT "FK_patients_facility" FOREIGN KEY ("registration_facility_id") REFERENCES "facilities"("facility_id"),
        CONSTRAINT "FK_patients_registered_by" FOREIGN KEY ("registered_by") REFERENCES "user_accounts"("account_id")
      )
    `);

    // ─── patient_history ───
    await queryRunner.query(`
      CREATE TABLE "patient_history" (
        "history_id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "nuhi" uuid NOT NULL,
        "changed_by" uuid NOT NULL,
        "changed_at" timestamptz NOT NULL DEFAULT NOW(),
        "field_name" varchar NOT NULL,
        "old_value" varchar,
        "new_value" varchar,
        "change_reason" varchar,
        CONSTRAINT "PK_patient_history" PRIMARY KEY ("history_id"),
        CONSTRAINT "FK_patient_history_nuhi" FOREIGN KEY ("nuhi") REFERENCES "patients"("nuhi"),
        CONSTRAINT "FK_patient_history_changed_by" FOREIGN KEY ("changed_by") REFERENCES "user_accounts"("account_id")
      )
    `);

    // ─── registered_devices ───
    await queryRunner.query(`
      CREATE TABLE "registered_devices" (
        "device_id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "device_fingerprint" varchar NOT NULL,
        "device_name" varchar,
        "device_type" "device_type_enum" NOT NULL,
        "facility_id" uuid,
        "trust_level" "trust_level_enum" NOT NULL,
        "enrolled_by" uuid,
        "enrolled_at" timestamptz NOT NULL DEFAULT NOW(),
        "last_seen_at" timestamptz,
        "last_seen_lat" decimal(10,7),
        "last_seen_lng" decimal(10,7),
        "status" varchar NOT NULL DEFAULT 'active',
        "revoked_at" timestamptz,
        "revocation_reason" varchar,
        CONSTRAINT "PK_registered_devices" PRIMARY KEY ("device_id"),
        CONSTRAINT "UQ_registered_devices_fingerprint" UNIQUE ("device_fingerprint"),
        CONSTRAINT "FK_devices_facility" FOREIGN KEY ("facility_id") REFERENCES "facilities"("facility_id"),
        CONSTRAINT "FK_devices_enrolled_by" FOREIGN KEY ("enrolled_by") REFERENCES "user_accounts"("account_id")
      )
    `);

    // ─── biometric_events ───
    await queryRunner.query(`
      CREATE TABLE "biometric_events" (
        "event_id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "nuhi" uuid,
        "nin" varchar,
        "device_id" uuid,
        "event_type" "biometric_event_type_enum" NOT NULL,
        "method" "biometric_method_enum" NOT NULL,
        "result" "biometric_result_enum" NOT NULL,
        "confidence_score" decimal(5,4),
        "nimc_api_called" boolean NOT NULL DEFAULT false,
        "nimc_reference_id" varchar,
        "liveness_passed" boolean,
        "device_attested" boolean,
        "geofence_passed" boolean,
        "performed_by" uuid,
        "facility_id" uuid,
        "timestamp" timestamptz NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_biometric_events" PRIMARY KEY ("event_id"),
        CONSTRAINT "FK_bio_events_device" FOREIGN KEY ("device_id") REFERENCES "registered_devices"("device_id") ON DELETE SET NULL,
        CONSTRAINT "FK_bio_events_nuhi" FOREIGN KEY ("nuhi") REFERENCES "patients"("nuhi"),
        CONSTRAINT "FK_bio_events_performed_by" FOREIGN KEY ("performed_by") REFERENCES "user_accounts"("account_id"),
        CONSTRAINT "FK_bio_events_facility" FOREIGN KEY ("facility_id") REFERENCES "facilities"("facility_id")
      )
    `);

    // ─── encounters ───
    await queryRunner.query(`
      CREATE TABLE "encounters" (
        "encounter_id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "nuhi" uuid NOT NULL,
        "provider_id" uuid NOT NULL,
        "facility_id" uuid NOT NULL,
        "encounter_type" "encounter_type_enum" NOT NULL,
        "status" "encounter_status_enum" NOT NULL DEFAULT 'open',
        "reason" varchar,
        "date_time" timestamptz NOT NULL DEFAULT NOW(),
        "closed_at" timestamptz,
        "notes" text,
        "created_at" timestamptz NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_encounters" PRIMARY KEY ("encounter_id"),
        CONSTRAINT "FK_encounters_nuhi" FOREIGN KEY ("nuhi") REFERENCES "patients"("nuhi"),
        CONSTRAINT "FK_encounters_provider" FOREIGN KEY ("provider_id") REFERENCES "providers"("provider_id"),
        CONSTRAINT "FK_encounters_facility" FOREIGN KEY ("facility_id") REFERENCES "facilities"("facility_id")
      )
    `);

    // ─── diagnoses ───
    await queryRunner.query(`
      CREATE TABLE "diagnoses" (
        "diagnosis_id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "encounter_id" uuid NOT NULL,
        "icd11_code" varchar NOT NULL,
        "description" varchar,
        "onset_date" date,
        "status" varchar,
        "severity" varchar,
        "version" integer NOT NULL DEFAULT 1,
        "is_current" boolean NOT NULL DEFAULT true,
        "created_by" uuid NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_diagnoses" PRIMARY KEY ("diagnosis_id"),
        CONSTRAINT "FK_diagnoses_encounter" FOREIGN KEY ("encounter_id") REFERENCES "encounters"("encounter_id"),
        CONSTRAINT "FK_diagnoses_created_by" FOREIGN KEY ("created_by") REFERENCES "providers"("provider_id")
      )
    `);

    // ─── observations ───
    await queryRunner.query(`
      CREATE TABLE "observations" (
        "observation_id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "encounter_id" uuid NOT NULL,
        "loinc_code" varchar NOT NULL,
        "display" varchar,
        "value_quantity" decimal,
        "value_unit" varchar,
        "value_string" varchar,
        "value_codeable" varchar,
        "reference_range" varchar,
        "interpretation" varchar,
        "status" varchar,
        "effective_dt" timestamptz,
        "created_by" uuid NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_observations" PRIMARY KEY ("observation_id"),
        CONSTRAINT "FK_observations_encounter" FOREIGN KEY ("encounter_id") REFERENCES "encounters"("encounter_id"),
        CONSTRAINT "FK_observations_created_by" FOREIGN KEY ("created_by") REFERENCES "providers"("provider_id")
      )
    `);

    // ─── prescriptions ───
    await queryRunner.query(`
      CREATE TABLE "prescriptions" (
        "prescription_id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "encounter_id" uuid NOT NULL,
        "prescriber_id" uuid NOT NULL,
        "drug_code" varchar NOT NULL,
        "drug_name" varchar NOT NULL,
        "dosage" varchar NOT NULL,
        "frequency" varchar NOT NULL,
        "duration" varchar,
        "route" varchar,
        "quantity" varchar,
        "instructions" text,
        "status" varchar NOT NULL DEFAULT 'active',
        "created_at" timestamptz NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_prescriptions" PRIMARY KEY ("prescription_id"),
        CONSTRAINT "FK_prescriptions_encounter" FOREIGN KEY ("encounter_id") REFERENCES "encounters"("encounter_id"),
        CONSTRAINT "FK_prescriptions_prescriber" FOREIGN KEY ("prescriber_id") REFERENCES "providers"("provider_id")
      )
    `);

    // ─── dispenses ───
    await queryRunner.query(`
      CREATE TABLE "dispenses" (
        "dispense_id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "prescription_id" uuid NOT NULL,
        "pharmacist_id" uuid NOT NULL,
        "facility_id" uuid NOT NULL,
        "quantity" varchar NOT NULL,
        "dispensed_at" timestamptz NOT NULL DEFAULT NOW(),
        "notes" text,
        CONSTRAINT "PK_dispenses" PRIMARY KEY ("dispense_id"),
        CONSTRAINT "FK_dispenses_prescription" FOREIGN KEY ("prescription_id") REFERENCES "prescriptions"("prescription_id"),
        CONSTRAINT "FK_dispenses_pharmacist" FOREIGN KEY ("pharmacist_id") REFERENCES "providers"("provider_id"),
        CONSTRAINT "FK_dispenses_facility" FOREIGN KEY ("facility_id") REFERENCES "facilities"("facility_id")
      )
    `);

    // ─── lab_orders ───
    await queryRunner.query(`
      CREATE TABLE "lab_orders" (
        "order_id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "encounter_id" uuid NOT NULL,
        "ordered_by" uuid NOT NULL,
        "loinc_code" varchar NOT NULL,
        "test_name" varchar NOT NULL,
        "urgency" varchar NOT NULL DEFAULT 'routine',
        "status" varchar NOT NULL DEFAULT 'pending',
        "ordered_at" timestamptz NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_lab_orders" PRIMARY KEY ("order_id"),
        CONSTRAINT "FK_lab_orders_encounter" FOREIGN KEY ("encounter_id") REFERENCES "encounters"("encounter_id"),
        CONSTRAINT "FK_lab_orders_ordered_by" FOREIGN KEY ("ordered_by") REFERENCES "providers"("provider_id")
      )
    `);

    // ─── lab_results ───
    await queryRunner.query(`
      CREATE TABLE "lab_results" (
        "result_id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "order_id" uuid NOT NULL,
        "performed_by" uuid NOT NULL,
        "facility_id" uuid NOT NULL,
        "result_value" varchar,
        "result_unit" varchar,
        "reference_range" varchar,
        "interpretation" varchar,
        "notes" text,
        "resulted_at" timestamptz NOT NULL DEFAULT NOW(),
        "report_doc_id" uuid,
        CONSTRAINT "PK_lab_results" PRIMARY KEY ("result_id"),
        CONSTRAINT "FK_lab_results_order" FOREIGN KEY ("order_id") REFERENCES "lab_orders"("order_id"),
        CONSTRAINT "FK_lab_results_performed_by" FOREIGN KEY ("performed_by") REFERENCES "providers"("provider_id"),
        CONSTRAINT "FK_lab_results_facility" FOREIGN KEY ("facility_id") REFERENCES "facilities"("facility_id")
      )
    `);

    // ─── allergies ───
    await queryRunner.query(`
      CREATE TABLE "allergies" (
        "allergy_id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "nuhi" uuid NOT NULL,
        "encounter_id" uuid,
        "substance_code" varchar,
        "substance_name" varchar NOT NULL,
        "reaction" varchar,
        "severity" varchar,
        "status" varchar NOT NULL DEFAULT 'active',
        "recorded_by" uuid NOT NULL,
        "recorded_at" timestamptz NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_allergies" PRIMARY KEY ("allergy_id"),
        CONSTRAINT "FK_allergies_nuhi" FOREIGN KEY ("nuhi") REFERENCES "patients"("nuhi"),
        CONSTRAINT "FK_allergies_encounter" FOREIGN KEY ("encounter_id") REFERENCES "encounters"("encounter_id"),
        CONSTRAINT "FK_allergies_recorded_by" FOREIGN KEY ("recorded_by") REFERENCES "providers"("provider_id")
      )
    `);

    // ─── referrals ───
    await queryRunner.query(`
      CREATE TABLE "referrals" (
        "referral_id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "encounter_id" uuid NOT NULL,
        "referring_provider_id" uuid NOT NULL,
        "receiving_facility_id" uuid NOT NULL,
        "receiving_provider_id" uuid,
        "urgency" varchar NOT NULL DEFAULT 'routine',
        "reason" text NOT NULL,
        "clinical_summary" text,
        "status" varchar NOT NULL DEFAULT 'pending',
        "referred_at" timestamptz NOT NULL DEFAULT NOW(),
        "accepted_at" timestamptz,
        "completed_at" timestamptz,
        CONSTRAINT "PK_referrals" PRIMARY KEY ("referral_id"),
        CONSTRAINT "FK_referrals_encounter" FOREIGN KEY ("encounter_id") REFERENCES "encounters"("encounter_id"),
        CONSTRAINT "FK_referrals_referring" FOREIGN KEY ("referring_provider_id") REFERENCES "providers"("provider_id"),
        CONSTRAINT "FK_referrals_recv_facility" FOREIGN KEY ("receiving_facility_id") REFERENCES "facilities"("facility_id"),
        CONSTRAINT "FK_referrals_recv_provider" FOREIGN KEY ("receiving_provider_id") REFERENCES "providers"("provider_id")
      )
    `);

    // ─── document_refs ───
    await queryRunner.query(`
      CREATE TABLE "document_refs" (
        "doc_id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "encounter_id" uuid,
        "nuhi" uuid NOT NULL,
        "doc_type" varchar NOT NULL,
        "storage_url" varchar NOT NULL,
        "content_hash" varchar NOT NULL,
        "mime_type" varchar NOT NULL,
        "file_size_bytes" integer,
        "uploaded_by" uuid NOT NULL,
        "uploaded_at" timestamptz NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_document_refs" PRIMARY KEY ("doc_id"),
        CONSTRAINT "FK_document_refs_encounter" FOREIGN KEY ("encounter_id") REFERENCES "encounters"("encounter_id"),
        CONSTRAINT "FK_document_refs_nuhi" FOREIGN KEY ("nuhi") REFERENCES "patients"("nuhi"),
        CONSTRAINT "FK_document_refs_uploaded_by" FOREIGN KEY ("uploaded_by") REFERENCES "user_accounts"("account_id")
      )
    `);

    // back-reference: lab_results.report_doc_id -> document_refs
    await queryRunner.query(`
      ALTER TABLE "lab_results"
        ADD CONSTRAINT "FK_lab_results_report_doc" FOREIGN KEY ("report_doc_id") REFERENCES "document_refs"("doc_id")
    `);

    // ─── consents ───
    await queryRunner.query(`
      CREATE TABLE "consents" (
        "consent_id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "nuhi" uuid NOT NULL,
        "grantor_id" uuid NOT NULL,
        "grantee_type" varchar NOT NULL,
        "grantee_id" uuid NOT NULL,
        "purpose" "consent_purpose_enum" NOT NULL,
        "scope" text[] NOT NULL,
        "valid_from" timestamptz NOT NULL DEFAULT NOW(),
        "valid_to" timestamptz,
        "revoked_at" timestamptz,
        "revocation_reason" varchar,
        "created_at" timestamptz NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_consents" PRIMARY KEY ("consent_id"),
        CONSTRAINT "FK_consents_nuhi" FOREIGN KEY ("nuhi") REFERENCES "patients"("nuhi"),
        CONSTRAINT "FK_consents_grantor" FOREIGN KEY ("grantor_id") REFERENCES "user_accounts"("account_id")
      )
    `);

    // ─── audit_events (append-only) ───
    await queryRunner.query(`
      CREATE TABLE "audit_events" (
        "event_id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "actor_id" uuid,
        "actor_role" varchar,
        "actor_facility_id" uuid,
        "resource_type" varchar,
        "resource_id" uuid,
        "action" "audit_action_enum" NOT NULL,
        "outcome" varchar NOT NULL,
        "failure_reason" varchar,
        "patient_nuhi" uuid,
        "pathway" varchar,
        "ip_address" varchar,
        "user_agent" varchar,
        "session_id" varchar,
        "timestamp" timestamptz NOT NULL DEFAULT NOW(),
        "metadata" jsonb,
        CONSTRAINT "PK_audit_events" PRIMARY KEY ("event_id")
      )
    `);

    // ─── provenance ───
    await queryRunner.query(`
      CREATE TABLE "provenance" (
        "prov_id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "resource_type" varchar NOT NULL,
        "resource_id" uuid NOT NULL,
        "author_id" uuid NOT NULL,
        "source_system" varchar,
        "recorded_at" timestamptz NOT NULL DEFAULT NOW(),
        "notes" text,
        CONSTRAINT "PK_provenance" PRIMARY KEY ("prov_id"),
        CONSTRAINT "FK_provenance_author" FOREIGN KEY ("author_id") REFERENCES "providers"("provider_id")
      )
    `);

    // ─── indexes ───
    await queryRunner.query(`CREATE INDEX "IDX_patients_nin_hash" ON "patients" ("nin_hash")`);
    await queryRunner.query(`CREATE INDEX "IDX_patients_full_name" ON "patients" USING gin (to_tsvector('simple', "full_name"))`);
    await queryRunner.query(`CREATE INDEX "IDX_patients_state" ON "patients" ("state")`);
    await queryRunner.query(`CREATE INDEX "IDX_patients_status" ON "patients" ("status")`);
    await queryRunner.query(`CREATE INDEX "IDX_patient_history_nuhi" ON "patient_history" ("nuhi")`);
    await queryRunner.query(`CREATE INDEX "IDX_encounters_nuhi" ON "encounters" ("nuhi")`);
    await queryRunner.query(`CREATE INDEX "IDX_encounters_provider" ON "encounters" ("provider_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_encounters_facility" ON "encounters" ("facility_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_encounters_date" ON "encounters" ("date_time")`);
    await queryRunner.query(`CREATE INDEX "IDX_diagnoses_encounter" ON "diagnoses" ("encounter_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_observations_encounter" ON "observations" ("encounter_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_prescriptions_encounter" ON "prescriptions" ("encounter_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_lab_orders_encounter" ON "lab_orders" ("encounter_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_allergies_nuhi" ON "allergies" ("nuhi")`);
    await queryRunner.query(`CREATE INDEX "IDX_referrals_encounter" ON "referrals" ("encounter_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_consents_nuhi" ON "consents" ("nuhi")`);
    await queryRunner.query(`CREATE INDEX "IDX_consents_grantee" ON "consents" ("grantee_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_audit_events_actor" ON "audit_events" ("actor_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_audit_events_patient" ON "audit_events" ("patient_nuhi")`);
    await queryRunner.query(`CREATE INDEX "IDX_audit_events_timestamp" ON "audit_events" ("timestamp")`);
    await queryRunner.query(`CREATE INDEX "IDX_biometric_events_device" ON "biometric_events" ("device_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_biometric_events_nuhi" ON "biometric_events" ("nuhi")`);
    await queryRunner.query(`CREATE INDEX "IDX_biometric_events_timestamp" ON "biometric_events" ("timestamp")`);
    await queryRunner.query(`CREATE INDEX "IDX_document_refs_nuhi" ON "document_refs" ("nuhi")`);
    await queryRunner.query(`CREATE INDEX "IDX_provenance_resource" ON "provenance" ("resource_type","resource_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_provider_affiliations_provider" ON "provider_affiliations" ("provider_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_provider_affiliations_facility" ON "provider_affiliations" ("facility_id")`);

    // ─── prevent UPDATE/DELETE on audit_events ───
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION prevent_audit_mutation() RETURNS trigger AS $$
      BEGIN
        RAISE EXCEPTION 'audit_events table is append-only';
      END;
      $$ LANGUAGE plpgsql
    `);
    await queryRunner.query(`
      CREATE TRIGGER trg_audit_no_update
        BEFORE UPDATE OR DELETE ON "audit_events"
        FOR EACH ROW EXECUTE FUNCTION prevent_audit_mutation()
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TRIGGER IF EXISTS trg_audit_no_update ON "audit_events"`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS prevent_audit_mutation()`);

    await queryRunner.query(`DROP TABLE IF EXISTS "provenance" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "audit_events" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "consents" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "document_refs" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "referrals" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "allergies" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "lab_results" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "lab_orders" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "dispenses" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "prescriptions" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "observations" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "diagnoses" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "encounters" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "biometric_events" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "registered_devices" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "patient_history" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "patients" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "provider_affiliations" CASCADE`);
    await queryRunner.query(`ALTER TABLE "user_accounts" DROP CONSTRAINT IF EXISTS "FK_user_accounts_provider"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "providers" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_accounts" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "facilities" CASCADE`);

    const enums = [
      'audit_action_enum', 'consent_purpose_enum', 'encounter_status_enum',
      'encounter_type_enum', 'biometric_result_enum', 'biometric_method_enum',
      'biometric_event_type_enum', 'trust_level_enum', 'device_type_enum',
      'patient_status_enum', 'registration_type_enum', 'employment_type_enum',
      'verification_status_enum', 'provider_category_enum', 'accreditation_status_enum',
      'ownership_type_enum', 'level_of_care_enum', 'facility_type_enum', 'user_role_enum',
    ];
    for (const e of enums) {
      await queryRunner.query(`DROP TYPE IF EXISTS "${e}"`);
    }
  }
}
