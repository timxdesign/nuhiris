import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { EncounterService } from '../encounter.service';
import { Encounter } from '../entities/encounter.entity';
import { Diagnosis } from '../entities/diagnosis.entity';
import { Observation } from '../entities/observation.entity';
import { Prescription } from '../entities/prescription.entity';
import { Dispense } from '../entities/dispense.entity';
import { LabOrder } from '../entities/lab-order.entity';
import { LabResult } from '../entities/lab-result.entity';
import { Allergy } from '../entities/allergy.entity';
import { Referral } from '../entities/referral.entity';
import { Immunisation } from '../entities/immunisation.entity';
import { EncounterType, EncounterStatus, IJwtPayload } from '@nuhiris/shared-types';

const mockUser: IJwtPayload = {
  sub: 'user-1',
  roles: ['medical_officer'],
  facilityId: 'fac-1',
  providerId: 'prov-1',
  iat: 0,
  exp: 0,
  jti: 'jwt-1',
};

const mockEncounter: Encounter = {
  encounterId: 'enc-1',
  nuhi: 'nuhi-1',
  providerId: 'prov-1',
  facilityId: 'fac-1',
  encounterType: EncounterType.OUTPATIENT,
  status: EncounterStatus.OPEN,
  reason: 'Fever',
  dateTime: new Date(),
  closedAt: null,
  notes: null,
  createdAt: new Date(),
};

function createMockRepo() {
  return {
    findOne: jest.fn(),
    find: jest.fn().mockResolvedValue([]),
    findAndCount: jest.fn().mockResolvedValue([[], 0]),
    create: jest.fn().mockImplementation((d) => d),
    save: jest.fn().mockImplementation((d) => Promise.resolve({ ...d, createdAt: new Date() })),
    createQueryBuilder: jest.fn().mockReturnValue({
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    }),
    count: jest.fn().mockResolvedValue(0),
  };
}

describe('EncounterService', () => {
  let service: EncounterService;
  let encounterRepo: ReturnType<typeof createMockRepo>;
  let diagnosisRepo: ReturnType<typeof createMockRepo>;
  let prescriptionRepo: ReturnType<typeof createMockRepo>;
  let labOrderRepo: ReturnType<typeof createMockRepo>;

  beforeEach(async () => {
    encounterRepo = createMockRepo();
    diagnosisRepo = createMockRepo();
    prescriptionRepo = createMockRepo();
    labOrderRepo = createMockRepo();

    const module = await Test.createTestingModule({
      providers: [
        EncounterService,
        { provide: getRepositoryToken(Encounter), useValue: encounterRepo },
        { provide: getRepositoryToken(Diagnosis), useValue: diagnosisRepo },
        { provide: getRepositoryToken(Observation), useValue: createMockRepo() },
        { provide: getRepositoryToken(Prescription), useValue: prescriptionRepo },
        { provide: getRepositoryToken(Dispense), useValue: createMockRepo() },
        { provide: getRepositoryToken(LabOrder), useValue: labOrderRepo },
        { provide: getRepositoryToken(LabResult), useValue: createMockRepo() },
        { provide: getRepositoryToken(Allergy), useValue: createMockRepo() },
        { provide: getRepositoryToken(Referral), useValue: createMockRepo() },
        { provide: getRepositoryToken(Immunisation), useValue: createMockRepo() },
      ],
    }).compile();

    service = module.get(EncounterService);
  });

  describe('createEncounter', () => {
    it('creates an encounter for a provider', async () => {
      encounterRepo.save.mockResolvedValue(mockEncounter);
      const result = await service.createEncounter(
        { nuhi: 'nuhi-1', encounterType: EncounterType.OUTPATIENT },
        mockUser,
      );
      expect(result.nuhi).toBe('nuhi-1');
      expect(encounterRepo.create).toHaveBeenCalled();
    });

    it('throws ForbiddenException without providerId', async () => {
      await expect(
        service.createEncounter(
          { nuhi: 'nuhi-1', encounterType: EncounterType.OUTPATIENT },
          { ...mockUser, providerId: null },
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws ForbiddenException without facilityId', async () => {
      await expect(
        service.createEncounter(
          { nuhi: 'nuhi-1', encounterType: EncounterType.OUTPATIENT },
          { ...mockUser, facilityId: null },
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('updateStatus', () => {
    it('closes an open encounter', async () => {
      encounterRepo.findOne.mockResolvedValue({ ...mockEncounter });
      encounterRepo.save.mockImplementation((e) => Promise.resolve(e));
      const result = await service.updateStatus('enc-1', EncounterStatus.CLOSED);
      expect(result.status).toBe(EncounterStatus.CLOSED);
      expect(result.closedAt).toBeDefined();
    });

    it('throws BadRequestException on closed encounter', async () => {
      encounterRepo.findOne.mockResolvedValue({
        ...mockEncounter,
        status: EncounterStatus.CLOSED,
      });
      await expect(
        service.updateStatus('enc-1', EncounterStatus.IN_PROGRESS),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('addDiagnosis', () => {
    it('adds diagnosis to open encounter', async () => {
      encounterRepo.findOne.mockResolvedValue(mockEncounter);
      const result = await service.addDiagnosis('enc-1', {
        icd11Code: '1A00',
        description: 'Cholera',
      }, 'prov-1');
      expect(result.icd11Code).toBe('1A00');
    });

    it('throws on closed encounter', async () => {
      encounterRepo.findOne.mockResolvedValue({
        ...mockEncounter,
        status: EncounterStatus.CLOSED,
      });
      await expect(
        service.addDiagnosis('enc-1', { icd11Code: '1A00' }, 'prov-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('addPrescription', () => {
    it('adds prescription to open encounter', async () => {
      encounterRepo.findOne.mockResolvedValue(mockEncounter);
      const result = await service.addPrescription('enc-1', {
        drugCode: 'SNOMED-123',
        drugName: 'Amoxicillin',
        dosage: '500mg',
        frequency: 'TDS',
      }, 'prov-1');
      expect(result.drugName).toBe('Amoxicillin');
    });
  });

  describe('addLabOrder', () => {
    it('creates lab order', async () => {
      encounterRepo.findOne.mockResolvedValue(mockEncounter);
      const result = await service.addLabOrder('enc-1', {
        loincCode: '2093-3',
        testName: 'Total Cholesterol',
      }, 'prov-1');
      expect(result.testName).toBe('Total Cholesterol');
    });
  });

  describe('findById', () => {
    it('returns encounter when found', async () => {
      encounterRepo.findOne.mockResolvedValue(mockEncounter);
      expect(await service.findById('enc-1')).toEqual(mockEncounter);
    });

    it('throws NotFoundException', async () => {
      encounterRepo.findOne.mockResolvedValue(null);
      await expect(service.findById('missing')).rejects.toThrow(NotFoundException);
    });
  });
});
