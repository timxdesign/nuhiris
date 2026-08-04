import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Clinical demo data so every role has something on screen.
 *
 * All timestamps are relative to NOW() so the dataset stays inside the
 * analytics 30-day window no matter when the migration is run.
 */
export class DemoClinicalData1718700000006 implements MigrationInterface {
  name = 'DemoClinicalData1718700000006';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ─── Extra provider: receiving doctor at FMC Keffi (referral target) ───
    await queryRunner.query(`
      INSERT INTO "providers" ("provider_id","full_name","category","specialty","licence_number","regulatory_body","verification_status","status")
      VALUES ('b0000000-0000-4000-8000-000000000006','Dr Hauwa Sani','doctor','Cardiology','MDCN/2018/00456','MDCN','verified','active')
      ON CONFLICT ("provider_id") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "provider_affiliations" ("affiliation_id","provider_id","facility_id","employment_type","start_date","status")
      VALUES ('d0000000-0000-4000-8000-000000000006','b0000000-0000-4000-8000-000000000006','a0000000-0000-4000-8000-000000000002','consultant','2020-09-01','active')
      ON CONFLICT ("affiliation_id") DO NOTHING
    `);

    // ─── Extra patients: spread across states so analytics charts have shape ───
    await queryRunner.query(`
      INSERT INTO "patients" ("nuhi","full_name","date_of_birth","sex","state","lga","phone","registration_type","status","registration_facility_id","registered_by","created_at")
      VALUES
        ('f0000000-0000-4000-8000-000000000004','Funmilayo Adeyemi','1996-01-30','female','Lagos','Ikeja','+2348023456789','biometric_verified','active','a0000000-0000-4000-8000-000000000001','c0000000-0000-4000-8000-000000000007', NOW() - INTERVAL '18 days'),
        ('f0000000-0000-4000-8000-000000000005','Sadiq Abubakar','2001-09-15','male','FCT','Wuse','+2348034567890','selfie_verified','active','a0000000-0000-4000-8000-000000000003','c0000000-0000-4000-8000-000000000007', NOW() - INTERVAL '11 days'),
        ('f0000000-0000-4000-8000-000000000006','Blessing Okonkwo','1989-05-08','female','Enugu','Enugu North','+2348045678901','provisional','provisional','a0000000-0000-4000-8000-000000000001','c0000000-0000-4000-8000-000000000007', NOW() - INTERVAL '4 days')
      ON CONFLICT ("nuhi") DO NOTHING
    `);

    // Backdate the original seed patients so the registration trend is not one spike
    await queryRunner.query(`
      UPDATE "patients" SET "created_at" = NOW() - INTERVAL '25 days' WHERE "nuhi" = 'f0000000-0000-4000-8000-000000000001';
    `);
    await queryRunner.query(`
      UPDATE "patients" SET "created_at" = NOW() - INTERVAL '21 days' WHERE "nuhi" = 'f0000000-0000-4000-8000-000000000002';
    `);
    await queryRunner.query(`
      UPDATE "patients" SET "created_at" = NOW() - INTERVAL '14 days' WHERE "nuhi" = 'f0000000-0000-4000-8000-000000000003';
    `);

    // Provisional patients carry an upgrade deadline
    await queryRunner.query(`
      UPDATE "patients"
         SET "provisional_deadline" = (NOW() + INTERVAL '60 days')::date
       WHERE "status" = 'provisional' AND "provisional_deadline" IS NULL
    `);

    // ─── Encounters ───
    await queryRunner.query(`
      INSERT INTO "encounters" ("encounter_id","nuhi","provider_id","facility_id","encounter_type","status","reason","date_time","closed_at","notes")
      VALUES
        -- Closed outpatient visit with a full clinical trail
        ('11000000-0000-4000-8000-000000000001','f0000000-0000-4000-8000-000000000001','b0000000-0000-4000-8000-000000000001','a0000000-0000-4000-8000-000000000001','outpatient','closed','Recurrent headache and dizziness', NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days' + INTERVAL '2 hours','Hypertension confirmed. Started on amlodipine. Review in 2 weeks.'),
        -- Open follow-up: drives the pharmacy and laboratory queues
        ('11000000-0000-4000-8000-000000000002','f0000000-0000-4000-8000-000000000001','b0000000-0000-4000-8000-000000000001','a0000000-0000-4000-8000-000000000001','outpatient','open','Hypertension follow-up', NOW() - INTERVAL '2 days', NULL,'BP still elevated. Repeat lipid panel requested.'),
        -- Emergency case awaiting referral acceptance
        ('11000000-0000-4000-8000-000000000003','f0000000-0000-4000-8000-000000000002','b0000000-0000-4000-8000-000000000002','a0000000-0000-4000-8000-000000000001','emergency','in_progress','Severe abdominal pain, query appendicitis', NOW() - INTERVAL '1 day', NULL,'Vitals unstable on arrival. Surgical review requested.'),
        -- Laboratory encounter at a second facility
        ('11000000-0000-4000-8000-000000000004','f0000000-0000-4000-8000-000000000003','b0000000-0000-4000-8000-000000000004','a0000000-0000-4000-8000-000000000002','laboratory','closed','Routine malaria screening', NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days' + INTERVAL '3 hours','Sample processed same day.'),
        -- Antenatal visit
        ('11000000-0000-4000-8000-000000000005','f0000000-0000-4000-8000-000000000004','b0000000-0000-4000-8000-000000000002','a0000000-0000-4000-8000-000000000001','outpatient','closed','Antenatal booking visit', NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days' + INTERVAL '1 hour','First trimester. Routine bloods taken, TT vaccine given.'),
        -- Telemedicine consult
        ('11000000-0000-4000-8000-000000000006','f0000000-0000-4000-8000-000000000005','b0000000-0000-4000-8000-000000000001','a0000000-0000-4000-8000-000000000003','telemedicine','closed','Follow-up on asthma inhaler technique', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days' + INTERVAL '30 minutes','Technique corrected over video. No escalation needed.')
      ON CONFLICT ("encounter_id") DO NOTHING
    `);

    // ─── Diagnoses (ICD-11) ───
    await queryRunner.query(`
      INSERT INTO "diagnoses" ("diagnosis_id","encounter_id","icd11_code","description","onset_date","status","severity","created_by")
      VALUES
        ('12000000-0000-4000-8000-000000000001','11000000-0000-4000-8000-000000000001','BA00','Essential hypertension',(NOW() - INTERVAL '12 days')::date,'confirmed','moderate','b0000000-0000-4000-8000-000000000001'),
        ('12000000-0000-4000-8000-000000000002','11000000-0000-4000-8000-000000000003','DB10','Acute appendicitis',(NOW() - INTERVAL '1 day')::date,'provisional','severe','b0000000-0000-4000-8000-000000000002'),
        ('12000000-0000-4000-8000-000000000003','11000000-0000-4000-8000-000000000004','1F45','Malaria due to Plasmodium falciparum',(NOW() - INTERVAL '8 days')::date,'confirmed','mild','b0000000-0000-4000-8000-000000000004'),
        ('12000000-0000-4000-8000-000000000004','11000000-0000-4000-8000-000000000006','CA23','Asthma, mild persistent','2015-04-02','confirmed','mild','b0000000-0000-4000-8000-000000000001')
      ON CONFLICT ("diagnosis_id") DO NOTHING
    `);

    // ─── Observations (LOINC vitals) ───
    await queryRunner.query(`
      INSERT INTO "observations" ("observation_id","encounter_id","loinc_code","display","value_quantity","value_unit","reference_range","interpretation","status","effective_dt","created_by")
      VALUES
        ('13000000-0000-4000-8000-000000000001','11000000-0000-4000-8000-000000000001','8480-6','Systolic blood pressure',162,'mm[Hg]','90-120','high','final', NOW() - INTERVAL '12 days','b0000000-0000-4000-8000-000000000001'),
        ('13000000-0000-4000-8000-000000000002','11000000-0000-4000-8000-000000000001','8462-4','Diastolic blood pressure',98,'mm[Hg]','60-80','high','final', NOW() - INTERVAL '12 days','b0000000-0000-4000-8000-000000000001'),
        ('13000000-0000-4000-8000-000000000003','11000000-0000-4000-8000-000000000001','29463-7','Body weight',88.4,'kg',NULL,'normal','final', NOW() - INTERVAL '12 days','b0000000-0000-4000-8000-000000000001'),
        ('13000000-0000-4000-8000-000000000004','11000000-0000-4000-8000-000000000002','8480-6','Systolic blood pressure',148,'mm[Hg]','90-120','high','final', NOW() - INTERVAL '2 days','b0000000-0000-4000-8000-000000000001'),
        ('13000000-0000-4000-8000-000000000005','11000000-0000-4000-8000-000000000002','8462-4','Diastolic blood pressure',91,'mm[Hg]','60-80','high','final', NOW() - INTERVAL '2 days','b0000000-0000-4000-8000-000000000001'),
        ('13000000-0000-4000-8000-000000000006','11000000-0000-4000-8000-000000000003','8310-5','Body temperature',38.9,'Cel','36.1-37.2','high','final', NOW() - INTERVAL '1 day','b0000000-0000-4000-8000-000000000002'),
        ('13000000-0000-4000-8000-000000000007','11000000-0000-4000-8000-000000000003','8867-4','Heart rate',118,'/min','60-100','high','final', NOW() - INTERVAL '1 day','b0000000-0000-4000-8000-000000000002'),
        ('13000000-0000-4000-8000-000000000008','11000000-0000-4000-8000-000000000005','718-7','Haemoglobin',10.2,'g/dL','12.0-15.5','low','final', NOW() - INTERVAL '6 days','b0000000-0000-4000-8000-000000000002')
      ON CONFLICT ("observation_id") DO NOTHING
    `);

    // ─── Prescriptions ───
    await queryRunner.query(`
      INSERT INTO "prescriptions" ("prescription_id","encounter_id","prescriber_id","drug_code","drug_name","dosage","frequency","duration","route","quantity","instructions","status","created_at")
      VALUES
        ('14000000-0000-4000-8000-000000000001','11000000-0000-4000-8000-000000000001','b0000000-0000-4000-8000-000000000001','AMLO-5','Amlodipine 5mg tablet','5 mg','Once daily','30 days','oral','30 tablets','Take in the morning. Monitor for ankle swelling.','dispensed', NOW() - INTERVAL '12 days'),
        -- Active, not yet dispensed: what the pharmacist demo picks up
        ('14000000-0000-4000-8000-000000000002','11000000-0000-4000-8000-000000000002','b0000000-0000-4000-8000-000000000001','AMLO-10','Amlodipine 10mg tablet','10 mg','Once daily','30 days','oral','30 tablets','Dose increased from 5mg. Review BP in 4 weeks.','active', NOW() - INTERVAL '2 days'),
        ('14000000-0000-4000-8000-000000000003','11000000-0000-4000-8000-000000000002','b0000000-0000-4000-8000-000000000001','ATOR-20','Atorvastatin 20mg tablet','20 mg','Once at night','30 days','oral','30 tablets','Take at bedtime.','active', NOW() - INTERVAL '2 days'),
        ('14000000-0000-4000-8000-000000000004','11000000-0000-4000-8000-000000000004','b0000000-0000-4000-8000-000000000004','ACT-AL','Artemether/Lumefantrine 20/120mg','4 tablets','Twice daily','3 days','oral','24 tablets','Take with fatty food for absorption.','dispensed', NOW() - INTERVAL '8 days'),
        ('14000000-0000-4000-8000-000000000005','11000000-0000-4000-8000-000000000005','b0000000-0000-4000-8000-000000000002','FEFO-200','Ferrous sulphate 200mg tablet','200 mg','Twice daily','60 days','oral','120 tablets','Antenatal iron supplementation.','active', NOW() - INTERVAL '6 days')
      ON CONFLICT ("prescription_id") DO NOTHING
    `);

    // ─── Dispenses (pharmacist activity history) ───
    await queryRunner.query(`
      INSERT INTO "dispenses" ("dispense_id","prescription_id","pharmacist_id","facility_id","quantity","dispensed_at","notes")
      VALUES
        ('15000000-0000-4000-8000-000000000001','14000000-0000-4000-8000-000000000001','b0000000-0000-4000-8000-000000000003','a0000000-0000-4000-8000-000000000001','30 tablets', NOW() - INTERVAL '12 days' + INTERVAL '3 hours','Counselled on adherence.'),
        ('15000000-0000-4000-8000-000000000002','14000000-0000-4000-8000-000000000004','b0000000-0000-4000-8000-000000000003','a0000000-0000-4000-8000-000000000002','24 tablets', NOW() - INTERVAL '8 days' + INTERVAL '4 hours','Full ACT course supplied.')
      ON CONFLICT ("dispense_id") DO NOTHING
    `);

    // ─── Lab orders ───
    await queryRunner.query(`
      INSERT INTO "lab_orders" ("order_id","encounter_id","ordered_by","loinc_code","test_name","urgency","status","ordered_at")
      VALUES
        ('16000000-0000-4000-8000-000000000001','11000000-0000-4000-8000-000000000001','b0000000-0000-4000-8000-000000000001','2093-3','Total cholesterol','routine','completed', NOW() - INTERVAL '12 days'),
        -- Pending orders: what the lab scientist demo works through
        ('16000000-0000-4000-8000-000000000002','11000000-0000-4000-8000-000000000002','b0000000-0000-4000-8000-000000000001','57698-3','Lipid panel','routine','pending', NOW() - INTERVAL '2 days'),
        ('16000000-0000-4000-8000-000000000003','11000000-0000-4000-8000-000000000003','b0000000-0000-4000-8000-000000000002','26464-8','White blood cell count','urgent','pending', NOW() - INTERVAL '1 day'),
        ('16000000-0000-4000-8000-000000000004','11000000-0000-4000-8000-000000000004','b0000000-0000-4000-8000-000000000004','32700-7','Malaria parasite smear','routine','completed', NOW() - INTERVAL '8 days'),
        ('16000000-0000-4000-8000-000000000005','11000000-0000-4000-8000-000000000005','b0000000-0000-4000-8000-000000000002','718-7','Haemoglobin','routine','completed', NOW() - INTERVAL '6 days')
      ON CONFLICT ("order_id") DO NOTHING
    `);

    // ─── Lab results ───
    await queryRunner.query(`
      INSERT INTO "lab_results" ("result_id","order_id","performed_by","facility_id","result_value","result_unit","reference_range","interpretation","notes","resulted_at")
      VALUES
        ('17000000-0000-4000-8000-000000000001','16000000-0000-4000-8000-000000000001','b0000000-0000-4000-8000-000000000004','a0000000-0000-4000-8000-000000000001','6.8','mmol/L','< 5.2','high','Repeat fasting sample advised.', NOW() - INTERVAL '11 days'),
        ('17000000-0000-4000-8000-000000000002','16000000-0000-4000-8000-000000000004','b0000000-0000-4000-8000-000000000004','a0000000-0000-4000-8000-000000000002','Positive (++)',NULL,'Negative','abnormal','P. falciparum trophozoites seen.', NOW() - INTERVAL '8 days'),
        ('17000000-0000-4000-8000-000000000003','16000000-0000-4000-8000-000000000005','b0000000-0000-4000-8000-000000000004','a0000000-0000-4000-8000-000000000001','10.2','g/dL','12.0-15.5','low','Mild anaemia of pregnancy.', NOW() - INTERVAL '6 days')
      ON CONFLICT ("result_id") DO NOTHING
    `);

    // ─── Allergies (safety banner on the patient chart) ───
    await queryRunner.query(`
      INSERT INTO "allergies" ("allergy_id","nuhi","encounter_id","substance_code","substance_name","reaction","severity","status","recorded_by","recorded_at")
      VALUES
        ('18000000-0000-4000-8000-000000000001','f0000000-0000-4000-8000-000000000001','11000000-0000-4000-8000-000000000001','PEN','Penicillin','Urticarial rash','moderate','active','b0000000-0000-4000-8000-000000000001', NOW() - INTERVAL '12 days'),
        ('18000000-0000-4000-8000-000000000002','f0000000-0000-4000-8000-000000000003',NULL,'SULF','Sulphonamides','Anaphylaxis','severe','active','b0000000-0000-4000-8000-000000000004', NOW() - INTERVAL '8 days'),
        ('18000000-0000-4000-8000-000000000003','f0000000-0000-4000-8000-000000000005','11000000-0000-4000-8000-000000000006','DUST','House dust mite','Bronchospasm','moderate','active','b0000000-0000-4000-8000-000000000001', NOW() - INTERVAL '3 days')
      ON CONFLICT ("allergy_id") DO NOTHING
    `);

    // ─── Referrals (cross-facility continuity — the headline NUHIRIS story) ───
    await queryRunner.query(`
      INSERT INTO "referrals" ("referral_id","encounter_id","referring_provider_id","receiving_facility_id","receiving_provider_id","urgency","reason","clinical_summary","status","referred_at","accepted_at","completed_at")
      VALUES
        ('19000000-0000-4000-8000-000000000001','11000000-0000-4000-8000-000000000003','b0000000-0000-4000-8000-000000000002','a0000000-0000-4000-8000-000000000002','b0000000-0000-4000-8000-000000000006','emergency','Suspected acute appendicitis requiring surgical review','38-year-old female, 12-hour history of right iliac fossa pain, temp 38.9C, HR 118. Awaiting WBC. No known drug allergies.','pending', NOW() - INTERVAL '1 day', NULL, NULL),
        ('19000000-0000-4000-8000-000000000002','11000000-0000-4000-8000-000000000001','b0000000-0000-4000-8000-000000000001','a0000000-0000-4000-8000-000000000002','b0000000-0000-4000-8000-000000000006','routine','Cardiology review for resistant hypertension','Newly diagnosed hypertension, BP 162/98 on presentation. Commenced amlodipine 5mg. Cholesterol 6.8 mmol/L.','accepted', NOW() - INTERVAL '11 days', NOW() - INTERVAL '10 days', NULL),
        ('19000000-0000-4000-8000-000000000003','11000000-0000-4000-8000-000000000004','b0000000-0000-4000-8000-000000000004','a0000000-0000-4000-8000-000000000001',NULL,'routine','Follow-up after malaria treatment','Completed ACT course. Repeat smear negative. Discharged to primary care.','completed', NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days', NOW() - INTERVAL '5 days')
      ON CONFLICT ("referral_id") DO NOTHING
    `);

    // ─── Consents (patient portal consent management) ───
    await queryRunner.query(`
      INSERT INTO "consents" ("consent_id","nuhi","grantor_id","grantee_type","grantee_id","purpose","scope","valid_from","valid_to","revoked_at","revocation_reason")
      VALUES
        ('1a000000-0000-4000-8000-000000000001','f0000000-0000-4000-8000-000000000001','c0000000-0000-4000-8000-000000000008','facility','a0000000-0000-4000-8000-000000000001','TREATMENT', ARRAY['encounters','diagnoses','observations','prescriptions'], NOW() - INTERVAL '25 days', NOW() + INTERVAL '340 days', NULL, NULL),
        ('1a000000-0000-4000-8000-000000000002','f0000000-0000-4000-8000-000000000001','c0000000-0000-4000-8000-000000000008','facility','a0000000-0000-4000-8000-000000000002','TREATMENT', ARRAY['encounters','diagnoses'], NOW() - INTERVAL '11 days', NOW() + INTERVAL '80 days', NULL, NULL),
        -- A revoked consent so the audit and consent screens show state changes
        ('1a000000-0000-4000-8000-000000000003','f0000000-0000-4000-8000-000000000001','c0000000-0000-4000-8000-000000000008','facility','a0000000-0000-4000-8000-000000000003','RESEARCH', ARRAY['observations'], NOW() - INTERVAL '20 days', NOW() + INTERVAL '160 days', NOW() - INTERVAL '3 days','Patient withdrew consent for research use'),
        ('1a000000-0000-4000-8000-000000000004','f0000000-0000-4000-8000-000000000003','c0000000-0000-4000-8000-000000000010','facility','a0000000-0000-4000-8000-000000000002','TREATMENT', ARRAY['encounters','diagnoses','observations'], NOW() - INTERVAL '14 days', NOW() + INTERVAL '350 days', NULL, NULL)
      ON CONFLICT ("consent_id") DO NOTHING
    `);

    // ─── Immunisations ───
    await queryRunner.query(`
      INSERT INTO "immunisations" ("immunisation_id","nuhi","encounter_id","vaccine_code","vaccine_name","dose_number","lot_number","site","route","administered_at","administered_by","facility_id","status","notes")
      VALUES
        ('1b000000-0000-4000-8000-000000000001','f0000000-0000-4000-8000-000000000004','11000000-0000-4000-8000-000000000005','TT','Tetanus Toxoid',1,'TT-2026-0417','left deltoid','intramuscular', NOW() - INTERVAL '6 days','b0000000-0000-4000-8000-000000000002','a0000000-0000-4000-8000-000000000001','completed','Antenatal TT1. TT2 due in 4 weeks.'),
        ('1b000000-0000-4000-8000-000000000002','f0000000-0000-4000-8000-000000000001',NULL,'COVID-19','COVID-19 mRNA vaccine',2,'CV-2025-8891','right deltoid','intramuscular', NOW() - INTERVAL '25 days','b0000000-0000-4000-8000-000000000002','a0000000-0000-4000-8000-000000000001','completed','Booster dose.'),
        ('1b000000-0000-4000-8000-000000000003','f0000000-0000-4000-8000-000000000005',NULL,'HEPB','Hepatitis B vaccine',3,'HB-2025-1203','left deltoid','intramuscular', NOW() - INTERVAL '11 days','b0000000-0000-4000-8000-000000000002','a0000000-0000-4000-8000-000000000003','completed','Course complete.')
      ON CONFLICT ("immunisation_id") DO NOTHING
    `);

    // ─── Biometric events (identity assurance evidence) ───
    await queryRunner.query(`
      INSERT INTO "biometric_events" ("event_id","nuhi","device_id","event_type","method","result","confidence_score","nimc_api_called","nimc_reference_id","liveness_passed","device_attested","geofence_passed","performed_by","facility_id","timestamp")
      VALUES
        ('1c000000-0000-4000-8000-000000000001','f0000000-0000-4000-8000-000000000001','e0000000-0000-4000-8000-000000000001','registration','fingerprint','match',0.9820,true,'NIMC-REF-100001',true,true,true,'c0000000-0000-4000-8000-000000000007','a0000000-0000-4000-8000-000000000001', NOW() - INTERVAL '25 days'),
        ('1c000000-0000-4000-8000-000000000002','f0000000-0000-4000-8000-000000000001','e0000000-0000-4000-8000-000000000001','identity_check','face','match',0.9410,false,NULL,true,true,true,'c0000000-0000-4000-8000-000000000003','a0000000-0000-4000-8000-000000000001', NOW() - INTERVAL '2 days'),
        ('1c000000-0000-4000-8000-000000000003','f0000000-0000-4000-8000-000000000003','e0000000-0000-4000-8000-000000000002','registration','fingerprint','match',0.9670,true,'NIMC-REF-100002',true,true,true,'c0000000-0000-4000-8000-000000000006','a0000000-0000-4000-8000-000000000002', NOW() - INTERVAL '14 days'),
        -- Failure cases: proof the assurance controls actually reject things
        ('1c000000-0000-4000-8000-000000000004','f0000000-0000-4000-8000-000000000002','e0000000-0000-4000-8000-000000000001','identity_check','face_liveness','liveness_fail',0.3120,false,NULL,false,true,true,'c0000000-0000-4000-8000-000000000007','a0000000-0000-4000-8000-000000000001', NOW() - INTERVAL '21 days'),
        ('1c000000-0000-4000-8000-000000000005',NULL,NULL,'nin_lookup','documentary','no_match',0.1040,true,'NIMC-REF-100003',NULL,false,false,'c0000000-0000-4000-8000-000000000007','a0000000-0000-4000-8000-000000000001', NOW() - INTERVAL '5 days'),
        ('1c000000-0000-4000-8000-000000000006','f0000000-0000-4000-8000-000000000004','e0000000-0000-4000-8000-000000000001','registration','face','match',0.9550,true,'NIMC-REF-100004',true,true,true,'c0000000-0000-4000-8000-000000000007','a0000000-0000-4000-8000-000000000001', NOW() - INTERVAL '18 days'),
        ('1c000000-0000-4000-8000-000000000007','f0000000-0000-4000-8000-000000000005',NULL,'access_gate','face','device_untrusted',0.8800,false,NULL,true,false,true,'c0000000-0000-4000-8000-000000000003','a0000000-0000-4000-8000-000000000003', NOW() - INTERVAL '3 days')
      ON CONFLICT ("event_id") DO NOTHING
    `);

    // ─── Audit events (the audit inspector's whole screen) ───
    await queryRunner.query(`
      INSERT INTO "audit_events" ("event_id","actor_id","actor_role","actor_facility_id","resource_type","resource_id","action","outcome","failure_reason","patient_nuhi","pathway","ip_address","user_agent","timestamp","metadata")
      VALUES
        ('1d000000-0000-4000-8000-000000000001','c0000000-0000-4000-8000-000000000007','health_records_officer','a0000000-0000-4000-8000-000000000001','Patient','f0000000-0000-4000-8000-000000000001','CREATE','success',NULL,'f0000000-0000-4000-8000-000000000001','registration','10.20.1.14','Mozilla/5.0 (NUHIRIS Facility Tablet)', NOW() - INTERVAL '25 days','{"registrationType":"biometric_verified"}'),
        ('1d000000-0000-4000-8000-000000000002','c0000000-0000-4000-8000-000000000003','medical_officer','a0000000-0000-4000-8000-000000000001','Patient','f0000000-0000-4000-8000-000000000001','READ','success',NULL,'f0000000-0000-4000-8000-000000000001','consent','10.20.1.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64)', NOW() - INTERVAL '12 days','{"consentId":"1a000000-0000-4000-8000-000000000001"}'),
        ('1d000000-0000-4000-8000-000000000003','c0000000-0000-4000-8000-000000000003','medical_officer','a0000000-0000-4000-8000-000000000001','Encounter','11000000-0000-4000-8000-000000000001','CREATE','success',NULL,'f0000000-0000-4000-8000-000000000001','consent','10.20.1.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64)', NOW() - INTERVAL '12 days','{"encounterType":"outpatient"}'),
        ('1d000000-0000-4000-8000-000000000004','c0000000-0000-4000-8000-000000000005','pharmacist','a0000000-0000-4000-8000-000000000001','Dispense','15000000-0000-4000-8000-000000000001','CREATE','success',NULL,'f0000000-0000-4000-8000-000000000001','consent','10.20.1.31','Mozilla/5.0 (Windows NT 10.0; Win64; x64)', NOW() - INTERVAL '12 days','{"drug":"Amlodipine 5mg"}'),
        -- Denied access: consent was never granted for this facility
        ('1d000000-0000-4000-8000-000000000005','c0000000-0000-4000-8000-000000000006','lab_scientist','a0000000-0000-4000-8000-000000000002','Patient','f0000000-0000-4000-8000-000000000002','FAILED_ACCESS','denied','No active consent for requesting facility','f0000000-0000-4000-8000-000000000002','consent','10.30.4.8','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', NOW() - INTERVAL '9 days','{"requestedScope":"observations"}'),
        -- Break-glass: the emergency override path, reviewed after the fact
        ('1d000000-0000-4000-8000-000000000006','c0000000-0000-4000-8000-000000000004','nurse','a0000000-0000-4000-8000-000000000001','Patient','f0000000-0000-4000-8000-000000000002','EMERGENCY_OVERRIDE','success',NULL,'f0000000-0000-4000-8000-000000000002','break_glass','10.20.1.45','Mozilla/5.0 (NUHIRIS Facility Tablet)', NOW() - INTERVAL '1 day','{"justification":"Unconscious patient in A&E, next of kin unreachable","reviewRequired":true}'),
        ('1d000000-0000-4000-8000-000000000007','c0000000-0000-4000-8000-000000000008','patient',NULL,'Consent','1a000000-0000-4000-8000-000000000003','UPDATE','success',NULL,'f0000000-0000-4000-8000-000000000001','patient_portal','197.210.44.9','Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X)', NOW() - INTERVAL '3 days','{"action":"revoked","purpose":"RESEARCH"}'),
        ('1d000000-0000-4000-8000-000000000008','c0000000-0000-4000-8000-000000000001','national_admin',NULL,'AuditEvent',NULL,'EXPORT','success',NULL,NULL,'admin','10.10.0.2','Mozilla/5.0 (Windows NT 10.0; Win64; x64)', NOW() - INTERVAL '2 days','{"format":"csv","rowCount":1284}'),
        ('1d000000-0000-4000-8000-000000000009',NULL,NULL,NULL,'UserAccount',NULL,'LOGIN','failure','Invalid credentials',NULL,'auth','102.89.33.7','Mozilla/5.0 (Linux; Android 13)', NOW() - INTERVAL '6 hours','{"username":"admin","attempt":3}'),
        ('1d000000-0000-4000-8000-000000000010','c0000000-0000-4000-8000-000000000009','audit_inspector',NULL,'AuditEvent',NULL,'READ','success',NULL,NULL,'admin','10.10.0.9','Mozilla/5.0 (Windows NT 10.0; Win64; x64)', NOW() - INTERVAL '4 hours','{"filter":"EMERGENCY_OVERRIDE"}'),
        ('1d000000-0000-4000-8000-000000000011','c0000000-0000-4000-8000-000000000003','medical_officer','a0000000-0000-4000-8000-000000000001','Referral','19000000-0000-4000-8000-000000000001','CREATE','success',NULL,'f0000000-0000-4000-8000-000000000002','consent','10.20.1.22','Mozilla/5.0 (Windows NT 10.0; Win64; x64)', NOW() - INTERVAL '1 day','{"urgency":"emergency","receivingFacility":"FMC Keffi"}'),
        ('1d000000-0000-4000-8000-000000000012','c0000000-0000-4000-8000-000000000006','lab_scientist','a0000000-0000-4000-8000-000000000002','LabResult','17000000-0000-4000-8000-000000000002','CREATE','success',NULL,'f0000000-0000-4000-8000-000000000003','consent','10.30.4.8','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', NOW() - INTERVAL '8 days','{"test":"Malaria parasite smear"}')
      ON CONFLICT ("event_id") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tables: [string, string, string][] = [
      ['audit_events', 'event_id', '1d000000-%'],
      ['biometric_events', 'event_id', '1c000000-%'],
      ['immunisations', 'immunisation_id', '1b000000-%'],
      ['consents', 'consent_id', '1a000000-%'],
      ['referrals', 'referral_id', '19000000-%'],
      ['allergies', 'allergy_id', '18000000-%'],
      ['lab_results', 'result_id', '17000000-%'],
      ['lab_orders', 'order_id', '16000000-%'],
      ['dispenses', 'dispense_id', '15000000-%'],
      ['prescriptions', 'prescription_id', '14000000-%'],
      ['observations', 'observation_id', '13000000-%'],
      ['diagnoses', 'diagnosis_id', '12000000-%'],
      ['encounters', 'encounter_id', '11000000-%'],
    ];

    for (const [table, pk, prefix] of tables) {
      await queryRunner.query(`DELETE FROM "${table}" WHERE "${pk}"::text LIKE '${prefix}'`);
    }

    await queryRunner.query(
      `DELETE FROM "patients" WHERE "nuhi" IN ('f0000000-0000-4000-8000-000000000004','f0000000-0000-4000-8000-000000000005','f0000000-0000-4000-8000-000000000006')`,
    );
    await queryRunner.query(
      `DELETE FROM "provider_affiliations" WHERE "affiliation_id" = 'd0000000-0000-4000-8000-000000000006'`,
    );
    await queryRunner.query(
      `DELETE FROM "providers" WHERE "provider_id" = 'b0000000-0000-4000-8000-000000000006'`,
    );
  }
}
