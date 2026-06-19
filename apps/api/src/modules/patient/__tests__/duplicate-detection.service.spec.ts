import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DuplicateDetectionService } from '../services/duplicate-detection.service';
import { Patient } from '../entities/patient.entity';
import { NinEncryptionService } from '../services/nin-encryption.service';
import { PatientStatus, RegistrationType } from '@nuhiris/shared-types';

const makePatient = (overrides: Partial<Patient> = {}): Patient => ({
  nuhi: 'nuhi-1',
  fullName: 'Aisha Bello',
  dateOfBirth: '1990-05-15',
  sex: 'female',
  state: 'Lagos',
  lga: null,
  phone: null,
  email: null,
  nin: null,
  ninHash: 'hash-1',
  ninVerified: false,
  ninVerificationDate: null,
  ninVerificationMethod: null,
  nimcPhotoRef: null,
  registrationType: RegistrationType.BIOMETRIC_VERIFIED,
  status: PatientStatus.ACTIVE,
  provisionalDeadline: null,
  deceasedAt: null,
  mergedInto: null,
  registrationFacilityId: null,
  registeredBy: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe('DuplicateDetectionService', () => {
  let service: DuplicateDetectionService;
  let patientRepo: {
    findOne: jest.Mock;
    find: jest.Mock;
  };
  let ninEncryption: {
    hash: jest.Mock;
  };

  beforeEach(async () => {
    patientRepo = {
      findOne: jest.fn(),
      find: jest.fn().mockResolvedValue([]),
    };
    ninEncryption = {
      hash: jest.fn().mockReturnValue('hashed-nin'),
    };

    const module = await Test.createTestingModule({
      providers: [
        DuplicateDetectionService,
        { provide: getRepositoryToken(Patient), useValue: patientRepo },
        { provide: NinEncryptionService, useValue: ninEncryption },
      ],
    }).compile();

    service = module.get(DuplicateDetectionService);
  });

  describe('checkByNin', () => {
    it('returns patient when NIN hash matches', async () => {
      const patient = makePatient();
      patientRepo.findOne.mockResolvedValue(patient);

      const result = await service.checkByNin('12345678901');
      expect(result).toBe(patient);
      expect(ninEncryption.hash).toHaveBeenCalledWith('12345678901');
    });

    it('returns null when no match', async () => {
      patientRepo.findOne.mockResolvedValue(null);
      const result = await service.checkByNin('00000000000');
      expect(result).toBeNull();
    });
  });

  describe('checkByDemographics', () => {
    it('classifies exact name match as probable', async () => {
      patientRepo.find.mockResolvedValue([makePatient({ fullName: 'Aisha Bello' })]);
      const result = await service.checkByDemographics('Aisha Bello', '1990-05-15', 'Lagos');
      expect(result.probableMatches).toHaveLength(1);
    });

    it('classifies similar name as possible (Jaro-Winkler > 0.85)', async () => {
      patientRepo.find.mockResolvedValue([makePatient({ fullName: 'Aisha Bella' })]);
      const result = await service.checkByDemographics('Aisha Bello', '1990-05-15', 'Lagos');
      expect(result.possibleMatches.length + result.probableMatches.length).toBeGreaterThan(0);
    });

    it('returns empty for non-matching names', async () => {
      patientRepo.find.mockResolvedValue([makePatient({ fullName: 'John Smith' })]);
      const result = await service.checkByDemographics('Aisha Bello', '1990-05-15', 'Lagos');
      expect(result.probableMatches).toHaveLength(0);
      expect(result.possibleMatches).toHaveLength(0);
    });

    it('returns empty when no candidates found', async () => {
      patientRepo.find.mockResolvedValue([]);
      const result = await service.checkByDemographics('Aisha Bello', '1990-05-15', 'Lagos');
      expect(result.probableMatches).toHaveLength(0);
      expect(result.possibleMatches).toHaveLength(0);
    });
  });
});
