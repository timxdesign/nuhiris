import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Patient } from '../patient/entities/patient.entity';
import { Provider } from '../provider/entities/provider.entity';
import { Facility } from '../facility/entities/facility.entity';
import { Encounter } from '../encounter/entities/encounter.entity';
import { Diagnosis } from '../encounter/entities/diagnosis.entity';
import { Observation } from '../encounter/entities/observation.entity';
import { Prescription } from '../encounter/entities/prescription.entity';
import { Dispense } from '../encounter/entities/dispense.entity';
import { Allergy } from '../encounter/entities/allergy.entity';
import { Immunisation } from '../encounter/entities/immunisation.entity';
import { LabOrder } from '../encounter/entities/lab-order.entity';
import { LabResult } from '../encounter/entities/lab-result.entity';
import { Referral } from '../encounter/entities/referral.entity';
import { DocumentRef } from '../document/entities/document-ref.entity';
import { Consent } from '../consent/entities/consent.entity';
import {
  buildFhirPatient,
  buildFhirPractitioner,
  buildFhirOrganization,
  buildFhirEncounter,
  buildFhirCondition,
  buildFhirObservation,
  buildFhirMedicationRequest,
  buildFhirMedicationDispense,
  buildFhirAllergyIntolerance,
  buildFhirImmunization,
  buildFhirDiagnosticReport,
  buildFhirServiceRequestFromLabOrder,
  buildFhirServiceRequestFromReferral,
  buildFhirDocumentReference,
  buildFhirConsent,
} from '@nuhiris/fhir-utils';
export type FhirResource = { id?: string; resourceType: string };
export interface FhirBundle { resourceType: 'Bundle'; type: string; total: number; entry: Array<{ resource: FhirResource; fullUrl: string }> }

@Injectable()
export class FhirService {
  constructor(
    @InjectRepository(Patient) private patientRepo: Repository<Patient>,
    @InjectRepository(Provider) private providerRepo: Repository<Provider>,
    @InjectRepository(Facility) private facilityRepo: Repository<Facility>,
    @InjectRepository(Encounter) private encounterRepo: Repository<Encounter>,
    @InjectRepository(Diagnosis) private diagnosisRepo: Repository<Diagnosis>,
    @InjectRepository(Observation) private observationRepo: Repository<Observation>,
    @InjectRepository(Prescription) private prescriptionRepo: Repository<Prescription>,
    @InjectRepository(Dispense) private dispenseRepo: Repository<Dispense>,
    @InjectRepository(Allergy) private allergyRepo: Repository<Allergy>,
    @InjectRepository(Immunisation) private immunisationRepo: Repository<Immunisation>,
    @InjectRepository(LabOrder) private labOrderRepo: Repository<LabOrder>,
    @InjectRepository(LabResult) private labResultRepo: Repository<LabResult>,
    @InjectRepository(Referral) private referralRepo: Repository<Referral>,
    @InjectRepository(DocumentRef) private documentRefRepo: Repository<DocumentRef>,
    @InjectRepository(Consent) private consentRepo: Repository<Consent>,
  ) {}

  // --- Patient ---

  async readPatient(nuhi: string): Promise<FhirResource> {
    const patient = await this.patientRepo.findOne({ where: { nuhi } });
    if (!patient) throw new NotFoundException(`Patient/${nuhi} not found`);
    return buildFhirPatient(patient as never);
  }

  async searchPatient(params: Record<string, string>): Promise<FhirBundle> {
    const qb = this.patientRepo.createQueryBuilder('p');
    if (params['name']) qb.andWhere("p.full_name ILIKE :name", { name: `%${params['name']}%` });
    if (params['birthdate']) qb.andWhere('p.date_of_birth = :dob', { dob: params['birthdate'] });
    if (params['address-state']) qb.andWhere('p.state = :state', { state: params['address-state'] });
    qb.take(100);
    const patients = await qb.getMany();
    return this.bundle('Patient', patients.map((p) => buildFhirPatient(p as never)));
  }

  // --- Practitioner ---

  async readPractitioner(id: string): Promise<FhirResource> {
    const provider = await this.providerRepo.findOne({ where: { providerId: id } });
    if (!provider) throw new NotFoundException(`Practitioner/${id} not found`);
    return buildFhirPractitioner(provider as never);
  }

  async searchPractitioner(params: Record<string, string>): Promise<FhirBundle> {
    const qb = this.providerRepo.createQueryBuilder('p');
    if (params['name']) qb.andWhere("p.full_name ILIKE :name", { name: `%${params['name']}%` });
    if (params['identifier']) qb.andWhere('p.licence_number = :lic', { lic: params['identifier'] });
    qb.take(100);
    const providers = await qb.getMany();
    return this.bundle('Practitioner', providers.map((p) => buildFhirPractitioner(p as never)));
  }

  // --- Organization ---

  async readOrganization(id: string): Promise<FhirResource> {
    const facility = await this.facilityRepo.findOne({ where: { facilityId: id } });
    if (!facility) throw new NotFoundException(`Organization/${id} not found`);
    return buildFhirOrganization(facility as never);
  }

  async searchOrganization(params: Record<string, string>): Promise<FhirBundle> {
    const qb = this.facilityRepo.createQueryBuilder('f');
    if (params['name']) qb.andWhere("f.name ILIKE :name", { name: `%${params['name']}%` });
    if (params['address-state']) qb.andWhere('f.state = :state', { state: params['address-state'] });
    qb.take(100);
    const facilities = await qb.getMany();
    return this.bundle('Organization', facilities.map((f) => buildFhirOrganization(f as never)));
  }

  // --- Encounter ---

  async readEncounter(id: string): Promise<FhirResource> {
    const enc = await this.encounterRepo.findOne({ where: { encounterId: id } });
    if (!enc) throw new NotFoundException(`Encounter/${id} not found`);
    return buildFhirEncounter(enc as never);
  }

  async searchEncounter(params: Record<string, string>): Promise<FhirBundle> {
    const qb = this.encounterRepo.createQueryBuilder('e');
    if (params['patient']) qb.andWhere('e.nuhi = :nuhi', { nuhi: params['patient'] });
    if (params['status']) {
      const statusMap: Record<string, string> = { 'in-progress': 'open', finished: 'closed' };
      qb.andWhere('e.status = :status', { status: statusMap[params['status']] ?? params['status'] });
    }
    if (params['date']) qb.andWhere('e.date_time::date = :date', { date: params['date'] });
    qb.orderBy('e.date_time', 'DESC').take(100);
    const encounters = await qb.getMany();
    return this.bundle('Encounter', encounters.map((e) => buildFhirEncounter(e as never)));
  }

  // --- Condition ---

  async readCondition(id: string): Promise<FhirResource> {
    const diag = await this.diagnosisRepo.findOne({ where: { diagnosisId: id } });
    if (!diag) throw new NotFoundException(`Condition/${id} not found`);
    const enc = await this.encounterRepo.findOne({ where: { encounterId: diag.encounterId } });
    return buildFhirCondition({ ...diag, nuhi: enc?.nuhi ?? '' } as never);
  }

  async searchCondition(params: Record<string, string>): Promise<FhirBundle> {
    const qb = this.diagnosisRepo.createQueryBuilder('d')
      .innerJoin('encounters', 'e', 'e.encounter_id = d.encounter_id');
    if (params['patient']) qb.andWhere('e.nuhi = :nuhi', { nuhi: params['patient'] });
    if (params['code']) qb.andWhere('d.icd11_code = :code', { code: params['code'] });
    qb.addSelect('e.nuhi', 'd_nuhi').take(100);
    const rows = await qb.getRawAndEntities();
    const diagnoses = rows.entities.map((d, i) => ({
      ...d,
      nuhi: rows.raw[i]?.['d_nuhi'] ?? '',
    }));
    return this.bundle('Condition', diagnoses.map((d) => buildFhirCondition(d as never)));
  }

  // --- Observation ---

  async readObservation(id: string): Promise<FhirResource> {
    const obs = await this.observationRepo.findOne({ where: { observationId: id } });
    if (!obs) throw new NotFoundException(`Observation/${id} not found`);
    const enc = await this.encounterRepo.findOne({ where: { encounterId: obs.encounterId } });
    return buildFhirObservation({ ...obs, nuhi: enc?.nuhi ?? '' } as never);
  }

  async searchObservation(params: Record<string, string>): Promise<FhirBundle> {
    const qb = this.observationRepo.createQueryBuilder('o')
      .innerJoin('encounters', 'e', 'e.encounter_id = o.encounter_id');
    if (params['patient']) qb.andWhere('e.nuhi = :nuhi', { nuhi: params['patient'] });
    if (params['code']) qb.andWhere('o.loinc_code = :code', { code: params['code'] });
    qb.addSelect('e.nuhi', 'o_nuhi').take(100);
    const rows = await qb.getRawAndEntities();
    const observations = rows.entities.map((o, i) => ({
      ...o,
      nuhi: rows.raw[i]?.['o_nuhi'] ?? '',
    }));
    return this.bundle('Observation', observations.map((o) => buildFhirObservation(o as never)));
  }

  // --- MedicationRequest ---

  async readMedicationRequest(id: string): Promise<FhirResource> {
    const rx = await this.prescriptionRepo.findOne({ where: { prescriptionId: id } });
    if (!rx) throw new NotFoundException(`MedicationRequest/${id} not found`);
    const enc = await this.encounterRepo.findOne({ where: { encounterId: rx.encounterId } });
    return buildFhirMedicationRequest({ ...rx, nuhi: enc?.nuhi ?? '' } as never);
  }

  async searchMedicationRequest(params: Record<string, string>): Promise<FhirBundle> {
    const qb = this.prescriptionRepo.createQueryBuilder('rx')
      .innerJoin('encounters', 'e', 'e.encounter_id = rx.encounter_id');
    if (params['patient']) qb.andWhere('e.nuhi = :nuhi', { nuhi: params['patient'] });
    if (params['status']) qb.andWhere('rx.status = :status', { status: params['status'] });
    qb.addSelect('e.nuhi', 'rx_nuhi').take(100);
    const rows = await qb.getRawAndEntities();
    const prescriptions = rows.entities.map((rx, i) => ({
      ...rx,
      nuhi: rows.raw[i]?.['rx_nuhi'] ?? '',
    }));
    return this.bundle('MedicationRequest', prescriptions.map((rx) => buildFhirMedicationRequest(rx as never)));
  }

  // --- MedicationDispense ---

  async readMedicationDispense(id: string): Promise<FhirResource> {
    const d = await this.dispenseRepo.findOne({ where: { dispenseId: id } });
    if (!d) throw new NotFoundException(`MedicationDispense/${id} not found`);
    return buildFhirMedicationDispense(d as never);
  }

  // --- AllergyIntolerance ---

  async readAllergyIntolerance(id: string): Promise<FhirResource> {
    const a = await this.allergyRepo.findOne({ where: { allergyId: id } });
    if (!a) throw new NotFoundException(`AllergyIntolerance/${id} not found`);
    return buildFhirAllergyIntolerance(a as never);
  }

  async searchAllergyIntolerance(params: Record<string, string>): Promise<FhirBundle> {
    const qb = this.allergyRepo.createQueryBuilder('a');
    if (params['patient']) qb.andWhere('a.nuhi = :nuhi', { nuhi: params['patient'] });
    qb.take(100);
    const allergies = await qb.getMany();
    return this.bundle('AllergyIntolerance', allergies.map((a) => buildFhirAllergyIntolerance(a as never)));
  }

  // --- Immunization ---

  async readImmunization(id: string): Promise<FhirResource> {
    const imm = await this.immunisationRepo.findOne({ where: { immunisationId: id } });
    if (!imm) throw new NotFoundException(`Immunization/${id} not found`);
    return buildFhirImmunization(imm as never);
  }

  async searchImmunization(params: Record<string, string>): Promise<FhirBundle> {
    const qb = this.immunisationRepo.createQueryBuilder('i');
    if (params['patient']) qb.andWhere('i.nuhi = :nuhi', { nuhi: params['patient'] });
    qb.take(100);
    const immunisations = await qb.getMany();
    return this.bundle('Immunization', immunisations.map((i) => buildFhirImmunization(i as never)));
  }

  // --- DiagnosticReport ---

  async readDiagnosticReport(id: string): Promise<FhirResource> {
    const lr = await this.labResultRepo.findOne({ where: { resultId: id } });
    if (!lr) throw new NotFoundException(`DiagnosticReport/${id} not found`);
    const order = await this.labOrderRepo.findOne({ where: { orderId: lr.orderId } });
    const enc = order
      ? await this.encounterRepo.findOne({ where: { encounterId: order.encounterId } })
      : null;
    return buildFhirDiagnosticReport({
      ...lr,
      encounterId: order?.encounterId ?? '',
      nuhi: enc?.nuhi ?? '',
      loincCode: order?.loincCode ?? '',
      testName: order?.testName ?? '',
    } as never);
  }

  // --- ServiceRequest (lab orders + referrals) ---

  async readServiceRequest(id: string): Promise<FhirResource> {
    const order = await this.labOrderRepo.findOne({ where: { orderId: id } });
    if (order) {
      const enc = await this.encounterRepo.findOne({ where: { encounterId: order.encounterId } });
      return buildFhirServiceRequestFromLabOrder({ ...order, nuhi: enc?.nuhi ?? '' } as never);
    }
    const referral = await this.referralRepo.findOne({ where: { referralId: id } });
    if (referral) {
      const enc = await this.encounterRepo.findOne({ where: { encounterId: referral.encounterId } });
      return buildFhirServiceRequestFromReferral({ ...referral, nuhi: enc?.nuhi ?? '' } as never);
    }
    throw new NotFoundException(`ServiceRequest/${id} not found`);
  }

  // --- DocumentReference ---

  async readDocumentReference(id: string): Promise<FhirResource> {
    const doc = await this.documentRefRepo.findOne({ where: { docId: id } });
    if (!doc) throw new NotFoundException(`DocumentReference/${id} not found`);
    return buildFhirDocumentReference(doc as never);
  }

  async searchDocumentReference(params: Record<string, string>): Promise<FhirBundle> {
    const qb = this.documentRefRepo.createQueryBuilder('d');
    if (params['patient']) qb.andWhere('d.nuhi = :nuhi', { nuhi: params['patient'] });
    if (params['type']) qb.andWhere('d.doc_type = :type', { type: params['type'] });
    qb.take(100);
    const docs = await qb.getMany();
    return this.bundle('DocumentReference', docs.map((d) => buildFhirDocumentReference(d as never)));
  }

  // --- Consent ---

  async readConsent(id: string): Promise<FhirResource> {
    const c = await this.consentRepo.findOne({ where: { consentId: id } });
    if (!c) throw new NotFoundException(`Consent/${id} not found`);
    return buildFhirConsent(c as never);
  }

  async searchConsent(params: Record<string, string>): Promise<FhirBundle> {
    const qb = this.consentRepo.createQueryBuilder('c');
    if (params['patient']) qb.andWhere('c.nuhi = :nuhi', { nuhi: params['patient'] });
    qb.take(100);
    const consents = await qb.getMany();
    return this.bundle('Consent', consents.map((c) => buildFhirConsent(c as never)));
  }

  // --- Helpers ---

  private bundle(resourceType: string, entries: FhirResource[]): FhirBundle {
    return {
      resourceType: 'Bundle',
      type: 'searchset',
      total: entries.length,
      entry: entries.map((resource) => ({
        resource,
        fullUrl: `${resourceType}/${resource.id ?? ''}`,
      })),
    };
  }
}
