import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedDevData1718700000001 implements MigrationInterface {
  name = 'SeedDevData1718700000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Password hash for "Password1!" — bcrypt 10 rounds
    const passwordHash =
      '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36i5sNqPL5E.kY7FGk.G2q6';

    // ─── Facility ───
    await queryRunner.query(`
      INSERT INTO "facilities" ("facility_id","name","short_name","type","level_of_care","ownership","state","lga","address","latitude","longitude","contact_phone","contact_email","accreditation_status","operational_status")
      VALUES
        ('a0000000-0000-4000-8000-000000000001','Lagos University Teaching Hospital','LUTH','hospital','tertiary','federal','Lagos','Idi-Araba','Ishaga Rd, Idi-Araba, Surulere',6.5095370,3.3564890,'+2341234567890','admin@luth.gov.ng','accredited','operational'),
        ('a0000000-0000-4000-8000-000000000002','Federal Medical Centre Keffi','FMC Keffi','hospital','secondary','federal','Nasarawa','Keffi','Hospital Rd, Keffi',8.8461440,7.8734140,'+2349876543210','admin@fmckeffi.gov.ng','accredited','operational'),
        ('a0000000-0000-4000-8000-000000000003','Wuse General Hospital','WGH','hospital','secondary','state','FCT','Wuse','Zone 3, Wuse, Abuja',9.0723860,7.4892180,'+2348011111111','admin@wgh.fct.gov.ng','accredited','operational')
    `);

    // ─── Providers ───
    await queryRunner.query(`
      INSERT INTO "providers" ("provider_id","full_name","category","specialty","licence_number","regulatory_body","verification_status","status")
      VALUES
        ('b0000000-0000-4000-8000-000000000001','Dr Amina Yusuf','doctor','Internal Medicine','MDCN/2020/00001','MDCN','verified','active'),
        ('b0000000-0000-4000-8000-000000000002','Nurse Chidi Okafor','nurse','General Nursing','NMCN/2021/00042','NMCN','verified','active'),
        ('b0000000-0000-4000-8000-000000000003','Pharm Fatima Bello','pharmacist',NULL,'PCN/2019/00123','PCN','verified','active'),
        ('b0000000-0000-4000-8000-000000000004','Dr Emeka Nwosu','lab_scientist','Clinical Chemistry','MLSCN/2022/00007','MLSCN','verified','active')
    `);

    // ─── User accounts ───
    await queryRunner.query(`
      INSERT INTO "user_accounts" ("account_id","username","email","password_hash","role","mfa_enabled","provider_id","facility_id","status")
      VALUES
        ('c0000000-0000-4000-8000-000000000001','admin','admin@nuhiris.gov.ng','${passwordHash}','national_admin',false,NULL,NULL,'active'),
        ('c0000000-0000-4000-8000-000000000002','fadmin','fadmin@luth.gov.ng','${passwordHash}','facility_admin',false,NULL,'a0000000-0000-4000-8000-000000000001','active'),
        ('c0000000-0000-4000-8000-000000000003','dr.amina','amina@luth.gov.ng','${passwordHash}','medical_officer',false,'b0000000-0000-4000-8000-000000000001','a0000000-0000-4000-8000-000000000001','active'),
        ('c0000000-0000-4000-8000-000000000004','nurse.chidi','chidi@luth.gov.ng','${passwordHash}','nurse',false,'b0000000-0000-4000-8000-000000000002','a0000000-0000-4000-8000-000000000001','active'),
        ('c0000000-0000-4000-8000-000000000005','pharm.fatima','fatima@luth.gov.ng','${passwordHash}','pharmacist',false,'b0000000-0000-4000-8000-000000000003','a0000000-0000-4000-8000-000000000001','active'),
        ('c0000000-0000-4000-8000-000000000006','lab.emeka','emeka@fmckeffi.gov.ng','${passwordHash}','lab_scientist',false,'b0000000-0000-4000-8000-000000000004','a0000000-0000-4000-8000-000000000002','active'),
        ('c0000000-0000-4000-8000-000000000007','hro.aisha','aisha@luth.gov.ng','${passwordHash}','health_records_officer',false,NULL,'a0000000-0000-4000-8000-000000000001','active'),
        ('c0000000-0000-4000-8000-000000000099','timothy','exodustimothy@gmail.com','$2b$12$j/mv3cQMjCHR0u9xvvvzveDnNt.xltxHCHhWKBACp3scW5OED.wNm','national_admin',false,NULL,NULL,'active')
    `);

    // ─── Provider affiliations ───
    await queryRunner.query(`
      INSERT INTO "provider_affiliations" ("affiliation_id","provider_id","facility_id","employment_type","start_date","status")
      VALUES
        ('d0000000-0000-4000-8000-000000000001','b0000000-0000-4000-8000-000000000001','a0000000-0000-4000-8000-000000000001','full_time','2022-01-01','active'),
        ('d0000000-0000-4000-8000-000000000002','b0000000-0000-4000-8000-000000000002','a0000000-0000-4000-8000-000000000001','full_time','2022-06-01','active'),
        ('d0000000-0000-4000-8000-000000000003','b0000000-0000-4000-8000-000000000003','a0000000-0000-4000-8000-000000000001','full_time','2021-03-15','active'),
        ('d0000000-0000-4000-8000-000000000004','b0000000-0000-4000-8000-000000000004','a0000000-0000-4000-8000-000000000002','full_time','2023-01-10','active')
    `);

    // ─── Registered device ───
    await queryRunner.query(`
      INSERT INTO "registered_devices" ("device_id","device_fingerprint","device_name","device_type","facility_id","trust_level","enrolled_by","status")
      VALUES
        ('e0000000-0000-4000-8000-000000000001','fp-luth-tablet-001','LUTH Registration Tablet','facility_tablet','a0000000-0000-4000-8000-000000000001','high','c0000000-0000-4000-8000-000000000002','active'),
        ('e0000000-0000-4000-8000-000000000002','fp-fmc-keffi-phone-001','FMC Keffi Mobile','facility_phone','a0000000-0000-4000-8000-000000000002','medium','c0000000-0000-4000-8000-000000000001','active')
    `);

    // ─── Sample patients ───
    await queryRunner.query(`
      INSERT INTO "patients" ("nuhi","full_name","date_of_birth","sex","state","lga","phone","registration_type","status","registration_facility_id","registered_by")
      VALUES
        ('f0000000-0000-4000-8000-000000000001','Adebayo Ogunlesi','1985-03-12','male','Lagos','Surulere','+2348012345678','biometric_verified','active','a0000000-0000-4000-8000-000000000001','c0000000-0000-4000-8000-000000000007'),
        ('f0000000-0000-4000-8000-000000000002','Ngozi Eze','1992-07-22','female','Enugu','Nsukka','+2348087654321','provisional','provisional','a0000000-0000-4000-8000-000000000001','c0000000-0000-4000-8000-000000000007'),
        ('f0000000-0000-4000-8000-000000000003','Ibrahim Musa','1978-11-04','male','Kano','Nassarawa','+2349011223344','biometric_verified','active','a0000000-0000-4000-8000-000000000002','c0000000-0000-4000-8000-000000000006')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "patients" WHERE "nuhi" IN ('f0000000-0000-4000-8000-000000000001','f0000000-0000-4000-8000-000000000002','f0000000-0000-4000-8000-000000000003')`);
    await queryRunner.query(`DELETE FROM "registered_devices" WHERE "device_id" IN ('e0000000-0000-4000-8000-000000000001','e0000000-0000-4000-8000-000000000002')`);
    await queryRunner.query(`DELETE FROM "provider_affiliations" WHERE "affiliation_id" LIKE 'd0000000-%'`);
    await queryRunner.query(`DELETE FROM "user_accounts" WHERE "account_id" LIKE 'c0000000-%' OR "email" = 'exodustimothy@gmail.com'`);
    await queryRunner.query(`DELETE FROM "providers" WHERE "provider_id" LIKE 'b0000000-%'`);
    await queryRunner.query(`DELETE FROM "facilities" WHERE "facility_id" LIKE 'a0000000-%'`);
  }
}
