import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Patient } from './entities/patient.entity';
import { PatientHistory } from './entities/patient-history.entity';
import { RegisterPatientDto } from './dto/register-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { SearchPatientDto } from './dto/search-patient.dto';
import { NinEncryptionService } from './services/nin-encryption.service';
import { DuplicateDetectionService } from './services/duplicate-detection.service';
import { PatientStatus, RegistrationType } from '@nuhiris/shared-types';
import { PROVISIONAL_DEADLINE_DAYS } from '@nuhiris/shared-types';

@Injectable()
export class PatientService {
  constructor(
    @InjectRepository(Patient)
    private patientRepo: Repository<Patient>,
    @InjectRepository(PatientHistory)
    private historyRepo: Repository<PatientHistory>,
    private ninEncryption: NinEncryptionService,
    private duplicateDetection: DuplicateDetectionService,
  ) {}

  async register(dto: RegisterPatientDto, actorId: string): Promise<Patient> {
    if (dto.nin) {
      const existing = await this.duplicateDetection.checkByNin(dto.nin);
      if (existing) {
        throw new ConflictException(`Patient already registered with NUHI: ${existing.nuhi}`);
      }
    }

    const duplicates = await this.duplicateDetection.checkByDemographics(
      dto.fullName,
      dto.dateOfBirth,
      dto.state,
    );
    if (duplicates.probableMatches.length > 0) {
      throw new ConflictException({
        message: 'Probable duplicate patient found',
        matches: duplicates.probableMatches.map((p) => ({
          nuhi: p.nuhi,
          fullName: p.fullName,
          dateOfBirth: p.dateOfBirth,
          state: p.state,
        })),
      });
    }

    const isProvisional =
      dto.registrationType === RegistrationType.PROVISIONAL ||
      dto.registrationType === RegistrationType.EMERGENCY;

    const patient = this.patientRepo.create({
      fullName: dto.fullName,
      dateOfBirth: dto.dateOfBirth,
      sex: dto.sex,
      state: dto.state,
      lga: dto.lga ?? null,
      phone: dto.phone ?? null,
      email: dto.email ?? null,
      nin: dto.nin ? this.ninEncryption.encrypt(dto.nin) : null,
      ninHash: dto.nin ? this.ninEncryption.hash(dto.nin) : null,
      ninVerified: false,
      registrationType: dto.registrationType,
      status: isProvisional ? PatientStatus.PROVISIONAL : PatientStatus.ACTIVE,
      provisionalDeadline: isProvisional ? this.computeDeadline() : null,
      registrationFacilityId: dto.facilityId ?? null,
      registeredBy: actorId,
    });

    return this.patientRepo.save(patient);
  }

  async findByNuhi(nuhi: string): Promise<Patient> {
    const patient = await this.patientRepo.findOne({ where: { nuhi } });
    if (!patient) {
      throw new NotFoundException('Patient not found');
    }
    return patient;
  }

  async search(dto: SearchPatientDto, page: number, limit: number): Promise<[Patient[], number]> {
    if (dto.nin) {
      const patient = await this.duplicateDetection.checkByNin(dto.nin);
      if (patient) return [[patient], 1];
      return [[], 0];
    }

    const qb = this.patientRepo.createQueryBuilder('p');

    if (dto.fullName) {
      qb.andWhere('LOWER(p.full_name) LIKE LOWER(:name)', { name: `%${dto.fullName}%` });
    }
    if (dto.dateOfBirth) {
      qb.andWhere('p.date_of_birth = :dob', { dob: dto.dateOfBirth });
    }
    if (dto.phone) {
      qb.andWhere('p.phone = :phone', { phone: dto.phone });
    }
    if (dto.state) {
      qb.andWhere('p.state = :state', { state: dto.state });
    }

    qb.orderBy('p.created_at', 'DESC').skip((page - 1) * limit).take(limit);

    return qb.getManyAndCount();
  }

  async update(
    nuhi: string,
    dto: UpdatePatientDto,
    actorId: string,
  ): Promise<Patient> {
    const patient = await this.findByNuhi(nuhi);

    const changes: Array<{ field: string; oldValue: string | null; newValue: string | null }> = [];

    if (dto.fullName !== undefined && dto.fullName !== patient.fullName) {
      changes.push({ field: 'fullName', oldValue: patient.fullName, newValue: dto.fullName });
      patient.fullName = dto.fullName;
    }
    if (dto.phone !== undefined && dto.phone !== patient.phone) {
      changes.push({ field: 'phone', oldValue: patient.phone, newValue: dto.phone });
      patient.phone = dto.phone;
    }
    if (dto.email !== undefined && dto.email !== patient.email) {
      changes.push({ field: 'email', oldValue: patient.email, newValue: dto.email });
      patient.email = dto.email;
    }
    if (dto.state !== undefined && dto.state !== patient.state) {
      changes.push({ field: 'state', oldValue: patient.state, newValue: dto.state });
      patient.state = dto.state;
    }
    if (dto.lga !== undefined && dto.lga !== patient.lga) {
      changes.push({ field: 'lga', oldValue: patient.lga, newValue: dto.lga });
      patient.lga = dto.lga;
    }

    if (changes.length === 0) {
      throw new BadRequestException('No changes detected');
    }

    const saved = await this.patientRepo.save(patient);

    const historyEntries = changes.map((c) =>
      this.historyRepo.create({
        nuhi,
        changedBy: actorId,
        fieldName: c.field,
        oldValue: c.oldValue,
        newValue: c.newValue,
        changeReason: dto.changeReason ?? null,
      }),
    );
    await this.historyRepo.save(historyEntries);

    return saved;
  }

  async upgradeProvisional(
    nuhi: string,
    nin: string,
    actorId: string,
  ): Promise<Patient> {
    const patient = await this.findByNuhi(nuhi);
    if (patient.status !== PatientStatus.PROVISIONAL) {
      throw new BadRequestException('Patient is not provisional');
    }

    const existing = await this.duplicateDetection.checkByNin(nin);
    if (existing) {
      throw new ConflictException(`NIN already linked to NUHI: ${existing.nuhi}`);
    }

    patient.nin = this.ninEncryption.encrypt(nin);
    patient.ninHash = this.ninEncryption.hash(nin);
    patient.status = PatientStatus.ACTIVE;
    patient.provisionalDeadline = null;

    const saved = await this.patientRepo.save(patient);

    await this.historyRepo.save(
      this.historyRepo.create({
        nuhi,
        changedBy: actorId,
        fieldName: 'status',
        oldValue: PatientStatus.PROVISIONAL,
        newValue: PatientStatus.ACTIVE,
        changeReason: 'NIN verification upgrade',
      }),
    );

    return saved;
  }

  async getHistory(nuhi: string): Promise<PatientHistory[]> {
    return this.historyRepo.find({
      where: { nuhi },
      order: { changedAt: 'DESC' },
    });
  }

  private computeDeadline(): string {
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + PROVISIONAL_DEADLINE_DAYS);
    return deadline.toISOString().split('T')[0]!;
  }
}
