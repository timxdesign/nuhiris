import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Encounter } from './entities/encounter.entity';
import { Diagnosis } from './entities/diagnosis.entity';
import { Observation } from './entities/observation.entity';
import { Prescription } from './entities/prescription.entity';
import { Dispense } from './entities/dispense.entity';
import { LabOrder } from './entities/lab-order.entity';
import { LabResult } from './entities/lab-result.entity';
import { Allergy } from './entities/allergy.entity';
import { Referral } from './entities/referral.entity';
import { Immunisation } from './entities/immunisation.entity';
import { CreateEncounterDto } from './dto/create-encounter.dto';
import { CreateDiagnosisDto } from './dto/create-diagnosis.dto';
import { CreateObservationDto } from './dto/create-observation.dto';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { CreateDispenseDto } from './dto/create-dispense.dto';
import { CreateLabOrderDto } from './dto/create-lab-order.dto';
import { CreateLabResultDto } from './dto/create-lab-result.dto';
import { CreateAllergyDto } from './dto/create-allergy.dto';
import { CreateReferralDto } from './dto/create-referral.dto';
import { CreateImmunisationDto } from './dto/create-immunisation.dto';
import { EncounterStatus } from '@nuhiris/shared-types';
import { IJwtPayload } from '@nuhiris/shared-types';

@Injectable()
export class EncounterService {
  constructor(
    @InjectRepository(Encounter)
    private encounterRepo: Repository<Encounter>,
    @InjectRepository(Diagnosis)
    private diagnosisRepo: Repository<Diagnosis>,
    @InjectRepository(Observation)
    private observationRepo: Repository<Observation>,
    @InjectRepository(Prescription)
    private prescriptionRepo: Repository<Prescription>,
    @InjectRepository(Dispense)
    private dispenseRepo: Repository<Dispense>,
    @InjectRepository(LabOrder)
    private labOrderRepo: Repository<LabOrder>,
    @InjectRepository(LabResult)
    private labResultRepo: Repository<LabResult>,
    @InjectRepository(Allergy)
    private allergyRepo: Repository<Allergy>,
    @InjectRepository(Referral)
    private referralRepo: Repository<Referral>,
    @InjectRepository(Immunisation)
    private immunisationRepo: Repository<Immunisation>,
  ) {}

  async createEncounter(dto: CreateEncounterDto, user: IJwtPayload): Promise<Encounter> {
    if (!user.providerId) {
      throw new ForbiddenException('Only providers can open encounters');
    }
    if (!user.facilityId) {
      throw new ForbiddenException('Facility context required to open encounter');
    }

    const encounter = this.encounterRepo.create({
      nuhi: dto.nuhi,
      providerId: user.providerId,
      facilityId: user.facilityId,
      encounterType: dto.encounterType,
      reason: dto.reason ?? null,
      notes: dto.notes ?? null,
    });

    return this.encounterRepo.save(encounter);
  }

  async findById(encounterId: string): Promise<Encounter> {
    const encounter = await this.encounterRepo.findOne({ where: { encounterId } });
    if (!encounter) {
      throw new NotFoundException('Encounter not found');
    }
    return encounter;
  }

  async updateStatus(encounterId: string, status: EncounterStatus): Promise<Encounter> {
    const encounter = await this.findById(encounterId);

    if (encounter.status === EncounterStatus.CLOSED) {
      throw new BadRequestException('Cannot modify a closed encounter');
    }

    encounter.status = status;
    if (status === EncounterStatus.CLOSED) {
      encounter.closedAt = new Date();
    }

    return this.encounterRepo.save(encounter);
  }

  async findByPatient(nuhi: string, page: number, limit: number): Promise<[Encounter[], number]> {
    return this.encounterRepo.findAndCount({
      where: { nuhi },
      order: { dateTime: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  async addDiagnosis(encounterId: string, dto: CreateDiagnosisDto, providerId: string): Promise<Diagnosis> {
    await this.validateEncounterOpen(encounterId);

    const diagnosis = this.diagnosisRepo.create({
      encounterId,
      icd11Code: dto.icd11Code,
      description: dto.description ?? null,
      onsetDate: dto.onsetDate ?? null,
      status: dto.status ?? 'active',
      severity: dto.severity ?? null,
      createdBy: providerId,
    });

    return this.diagnosisRepo.save(diagnosis);
  }

  async getDiagnoses(encounterId: string): Promise<Diagnosis[]> {
    return this.diagnosisRepo.find({
      where: { encounterId, isCurrent: true },
      order: { createdAt: 'DESC' },
    });
  }

  async addObservation(encounterId: string, dto: CreateObservationDto, providerId: string): Promise<Observation> {
    await this.validateEncounterOpen(encounterId);

    const observation = this.observationRepo.create({
      encounterId,
      loincCode: dto.loincCode,
      display: dto.display ?? null,
      valueQuantity: dto.valueQuantity?.toString() ?? null,
      valueUnit: dto.valueUnit ?? null,
      valueString: dto.valueString ?? null,
      valueCodeable: dto.valueCodeable ?? null,
      referenceRange: dto.referenceRange ?? null,
      interpretation: dto.interpretation ?? null,
      status: dto.status ?? 'final',
      effectiveDt: dto.effectiveDt ? new Date(dto.effectiveDt) : null,
      createdBy: providerId,
    });

    return this.observationRepo.save(observation);
  }

  async getObservations(encounterId: string): Promise<Observation[]> {
    return this.observationRepo.find({
      where: { encounterId },
      order: { createdAt: 'DESC' },
    });
  }

  async addPrescription(encounterId: string, dto: CreatePrescriptionDto, prescriberId: string): Promise<Prescription> {
    await this.validateEncounterOpen(encounterId);

    const prescription = this.prescriptionRepo.create({
      encounterId,
      prescriberId,
      drugCode: dto.drugCode,
      drugName: dto.drugName,
      dosage: dto.dosage,
      frequency: dto.frequency,
      duration: dto.duration ?? null,
      route: dto.route ?? null,
      quantity: dto.quantity ?? null,
      instructions: dto.instructions ?? null,
    });

    return this.prescriptionRepo.save(prescription);
  }

  async getPrescriptions(encounterId: string): Promise<Prescription[]> {
    return this.prescriptionRepo.find({
      where: { encounterId },
      order: { createdAt: 'DESC' },
    });
  }

  async addDispense(encounterId: string, dto: CreateDispenseDto, user: IJwtPayload): Promise<Dispense> {
    if (!user.providerId || !user.facilityId) {
      throw new ForbiddenException('Provider and facility context required');
    }

    const prescription = await this.prescriptionRepo.findOne({
      where: { prescriptionId: dto.prescriptionId },
    });
    if (!prescription) {
      throw new NotFoundException('Prescription not found');
    }
    if (prescription.status === 'dispensed') {
      throw new BadRequestException('Prescription already fully dispensed');
    }

    const dispense = this.dispenseRepo.create({
      prescriptionId: dto.prescriptionId,
      pharmacistId: user.providerId,
      facilityId: user.facilityId,
      quantity: dto.quantity,
      notes: dto.notes ?? null,
    });

    prescription.status = 'dispensed';
    await this.prescriptionRepo.save(prescription);

    return this.dispenseRepo.save(dispense);
  }

  async addLabOrder(encounterId: string, dto: CreateLabOrderDto, providerId: string): Promise<LabOrder> {
    await this.validateEncounterOpen(encounterId);

    const labOrder = this.labOrderRepo.create({
      encounterId,
      orderedBy: providerId,
      loincCode: dto.loincCode,
      testName: dto.testName,
      urgency: dto.urgency ?? 'routine',
    });

    return this.labOrderRepo.save(labOrder);
  }

  async getLabOrders(encounterId: string): Promise<LabOrder[]> {
    return this.labOrderRepo.find({
      where: { encounterId },
      order: { orderedAt: 'DESC' },
    });
  }

  async addLabResult(encounterId: string, dto: CreateLabResultDto, user: IJwtPayload): Promise<LabResult> {
    if (!user.providerId || !user.facilityId) {
      throw new ForbiddenException('Provider and facility context required');
    }

    const order = await this.labOrderRepo.findOne({ where: { orderId: dto.orderId } });
    if (!order) {
      throw new NotFoundException('Lab order not found');
    }
    if (order.status === 'completed') {
      throw new BadRequestException('Lab order already has a result');
    }

    const result = this.labResultRepo.create({
      orderId: dto.orderId,
      performedBy: user.providerId,
      facilityId: user.facilityId,
      resultValue: dto.resultValue ?? null,
      resultUnit: dto.resultUnit ?? null,
      referenceRange: dto.referenceRange ?? null,
      interpretation: dto.interpretation ?? null,
      notes: dto.notes ?? null,
      reportDocId: dto.reportDocId ?? null,
    });

    order.status = 'completed';
    await this.labOrderRepo.save(order);

    return this.labResultRepo.save(result);
  }

  async addAllergy(encounterId: string, dto: CreateAllergyDto, providerId: string): Promise<Allergy> {
    const allergy = this.allergyRepo.create({
      nuhi: dto.nuhi,
      encounterId: encounterId,
      substanceCode: dto.substanceCode ?? null,
      substanceName: dto.substanceName,
      reaction: dto.reaction ?? null,
      severity: dto.severity ?? null,
      recordedBy: providerId,
    });

    return this.allergyRepo.save(allergy);
  }

  async getAllergies(nuhi: string): Promise<Allergy[]> {
    return this.allergyRepo.find({
      where: { nuhi, status: 'active' },
      order: { recordedAt: 'DESC' },
    });
  }

  async addReferral(encounterId: string, dto: CreateReferralDto, providerId: string): Promise<Referral> {
    await this.validateEncounterOpen(encounterId);

    const referral = this.referralRepo.create({
      encounterId,
      referringProviderId: providerId,
      receivingFacilityId: dto.receivingFacilityId,
      receivingProviderId: dto.receivingProviderId ?? null,
      urgency: dto.urgency ?? 'routine',
      reason: dto.reason,
      clinicalSummary: dto.clinicalSummary ?? null,
    });

    return this.referralRepo.save(referral);
  }

  async updateReferralStatus(
    referralId: string,
    status: 'accepted' | 'completed' | 'rejected',
  ): Promise<Referral> {
    const referral = await this.referralRepo.findOne({ where: { referralId } });
    if (!referral) {
      throw new NotFoundException('Referral not found');
    }

    referral.status = status;
    if (status === 'accepted') referral.acceptedAt = new Date();
    if (status === 'completed') referral.completedAt = new Date();

    return this.referralRepo.save(referral);
  }

  async getReferrals(encounterId: string): Promise<Referral[]> {
    return this.referralRepo.find({
      where: { encounterId },
      order: { referredAt: 'DESC' },
    });
  }

  async addImmunisation(
    encounterId: string,
    dto: CreateImmunisationDto,
    user: IJwtPayload,
  ): Promise<Immunisation> {
    if (!user.providerId || !user.facilityId) {
      throw new ForbiddenException('Provider and facility context required');
    }

    const immunisation = this.immunisationRepo.create({
      nuhi: dto.nuhi,
      encounterId,
      vaccineCode: dto.vaccineCode,
      vaccineName: dto.vaccineName,
      doseNumber: dto.doseNumber ?? null,
      lotNumber: dto.lotNumber ?? null,
      site: dto.site ?? null,
      route: dto.route ?? null,
      administeredAt: dto.administeredAt ? new Date(dto.administeredAt) : new Date(),
      administeredBy: user.providerId,
      facilityId: user.facilityId,
      notes: dto.notes ?? null,
    });

    return this.immunisationRepo.save(immunisation);
  }

  async getImmunisations(nuhi: string): Promise<Immunisation[]> {
    return this.immunisationRepo.find({
      where: { nuhi },
      order: { administeredAt: 'DESC' },
    });
  }

  async getClinicalSummary(nuhi: string): Promise<{
    encounters: Encounter[];
    allergies: Allergy[];
    activePrescriptions: Prescription[];
  }> {
    const [encounters] = await this.encounterRepo.findAndCount({
      where: { nuhi },
      order: { dateTime: 'DESC' },
      take: 50,
    });

    const allergies = await this.getAllergies(nuhi);

    const activePrescriptions = await this.prescriptionRepo
      .createQueryBuilder('p')
      .innerJoin('encounters', 'e', 'e.encounter_id = p.encounter_id')
      .where('e.nuhi = :nuhi', { nuhi })
      .andWhere('p.status = :status', { status: 'active' })
      .orderBy('p.created_at', 'DESC')
      .getMany();

    return { encounters, allergies, activePrescriptions };
  }

  private async validateEncounterOpen(encounterId: string): Promise<void> {
    const encounter = await this.findById(encounterId);
    if (encounter.status === EncounterStatus.CLOSED || encounter.status === EncounterStatus.CANCELLED) {
      throw new BadRequestException('Cannot add records to a closed or cancelled encounter');
    }
  }
}
