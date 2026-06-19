import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PatientService } from '../patient.service';
import { Patient } from '../entities/patient.entity';
import { PatientHistory } from '../entities/patient-history.entity';
import { NinEncryptionService } from '../services/nin-encryption.service';
import { DuplicateDetectionService } from '../services/duplicate-detection.service';
import { RegistrationType, PatientStatus } from '@nuhiris/shared-types';

const mockPatient: Patient = {
  nuhi: 'nuhi-1',
  fullName: 'Aisha Bello',
  dateOfBirth: '1990-05-15',
  sex: 'female',
  state: 'Lagos',
  lga: 'Ikeja',
  phone: '+2348012345678',
  email: 'aisha@example.com',
  nin: 'encrypted-nin',
  ninHash: 'hashed-nin',
  ninVerified: false,
  ninVerificationDate: null,
  ninVerificationMethod: null,
  nimcPhotoRef: null,
  registrationType: RegistrationType.BIOMETRIC_VERIFIED,
  status: PatientStatus.ACTIVE,
  provisionalDeadline: null,
  deceasedAt: null,
  mergedInto: null,
  registrationFacilityId: 'fac-1',
  registeredBy: 'user-1',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('PatientService', () => {
  let service: PatientService;
  let patientRepo: {
    findOne: jest.Mock;
    find: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let historyRepo: {
    find: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let ninEncryption: {
    encrypt: jest.Mock;
    decrypt: jest.Mock;
    hash: jest.Mock;
  };
  let duplicateDetection: {
    checkByNin: jest.Mock;
    checkByDemographics: jest.Mock;
  };

  beforeEach(async () => {
    patientRepo = {
      findOne: jest.fn(),
      find: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockReturnValue(mockPatient),
      save: jest.fn().mockResolvedValue(mockPatient),
      createQueryBuilder: jest.fn().mockReturnValue({
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockPatient], 1]),
      }),
    };

    historyRepo = {
      find: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockImplementation((data) => data),
      save: jest.fn().mockResolvedValue([]),
    };

    ninEncryption = {
      encrypt: jest.fn().mockReturnValue('encrypted-nin'),
      decrypt: jest.fn().mockReturnValue('12345678901'),
      hash: jest.fn().mockReturnValue('hashed-nin'),
    };

    duplicateDetection = {
      checkByNin: jest.fn().mockResolvedValue(null),
      checkByDemographics: jest.fn().mockResolvedValue({
        exactMatch: null,
        probableMatches: [],
        possibleMatches: [],
      }),
    };

    const module = await Test.createTestingModule({
      providers: [
        PatientService,
        { provide: getRepositoryToken(Patient), useValue: patientRepo },
        { provide: getRepositoryToken(PatientHistory), useValue: historyRepo },
        { provide: NinEncryptionService, useValue: ninEncryption },
        { provide: DuplicateDetectionService, useValue: duplicateDetection },
      ],
    }).compile();

    service = module.get(PatientService);
  });

  describe('register', () => {
    it('registers a new patient with NIN', async () => {
      const result = await service.register(
        {
          fullName: 'Aisha Bello',
          dateOfBirth: '1990-05-15',
          sex: 'female',
          state: 'Lagos',
          nin: '12345678901',
          registrationType: RegistrationType.BIOMETRIC_VERIFIED,
        },
        'user-1',
      );
      expect(result.nuhi).toBe('nuhi-1');
      expect(ninEncryption.encrypt).toHaveBeenCalledWith('12345678901');
      expect(ninEncryption.hash).toHaveBeenCalledWith('12345678901');
    });

    it('registers a provisional patient without NIN', async () => {
      const provisionalPatient = {
        ...mockPatient,
        status: PatientStatus.PROVISIONAL,
        nin: null,
        ninHash: null,
      };
      patientRepo.create.mockReturnValue(provisionalPatient);
      patientRepo.save.mockResolvedValue(provisionalPatient);

      const result = await service.register(
        {
          fullName: 'John Doe',
          dateOfBirth: '1985-01-01',
          sex: 'male',
          state: 'Abuja',
          registrationType: RegistrationType.PROVISIONAL,
        },
        'user-1',
      );
      expect(result.status).toBe(PatientStatus.PROVISIONAL);
      expect(ninEncryption.encrypt).not.toHaveBeenCalled();
    });

    it('throws ConflictException when NIN already exists', async () => {
      duplicateDetection.checkByNin.mockResolvedValue(mockPatient);

      await expect(
        service.register(
          {
            fullName: 'Duplicate',
            dateOfBirth: '1990-01-01',
            sex: 'male',
            state: 'Lagos',
            nin: '12345678901',
            registrationType: RegistrationType.BIOMETRIC_VERIFIED,
          },
          'user-1',
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('throws ConflictException on probable demographic match', async () => {
      duplicateDetection.checkByDemographics.mockResolvedValue({
        exactMatch: null,
        probableMatches: [mockPatient],
        possibleMatches: [],
      });

      await expect(
        service.register(
          {
            fullName: 'Aisha Bello',
            dateOfBirth: '1990-05-15',
            sex: 'female',
            state: 'Lagos',
            registrationType: RegistrationType.BIOMETRIC_VERIFIED,
          },
          'user-1',
        ),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findByNuhi', () => {
    it('returns the patient', async () => {
      patientRepo.findOne.mockResolvedValue(mockPatient);
      const result = await service.findByNuhi('nuhi-1');
      expect(result.nuhi).toBe('nuhi-1');
    });

    it('throws NotFoundException', async () => {
      patientRepo.findOne.mockResolvedValue(null);
      await expect(service.findByNuhi('unknown')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('updates demographics and creates history entries', async () => {
      patientRepo.findOne.mockResolvedValue({ ...mockPatient });
      patientRepo.save.mockImplementation(async (p) => p as Patient);

      const result = await service.update(
        'nuhi-1',
        { fullName: 'Aisha Bello-Okafor', changeReason: 'Marriage' },
        'user-1',
      );
      expect(result.fullName).toBe('Aisha Bello-Okafor');
      expect(historyRepo.save).toHaveBeenCalled();
    });

    it('throws BadRequestException when no changes', async () => {
      patientRepo.findOne.mockResolvedValue({ ...mockPatient });
      await expect(service.update('nuhi-1', {}, 'user-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('upgradeProvisional', () => {
    it('upgrades provisional patient to active with NIN', async () => {
      const provisionalPatient = { ...mockPatient, status: PatientStatus.PROVISIONAL, nin: null, ninHash: null };
      patientRepo.findOne.mockResolvedValue(provisionalPatient);
      patientRepo.save.mockImplementation(async (p) => p as Patient);

      const result = await service.upgradeProvisional('nuhi-1', '12345678901', 'user-1');
      expect(result.status).toBe(PatientStatus.ACTIVE);
      expect(ninEncryption.encrypt).toHaveBeenCalledWith('12345678901');
    });

    it('throws BadRequestException if not provisional', async () => {
      patientRepo.findOne.mockResolvedValue(mockPatient);
      await expect(service.upgradeProvisional('nuhi-1', '12345678901', 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws ConflictException if NIN already linked', async () => {
      patientRepo.findOne.mockResolvedValue({
        ...mockPatient,
        status: PatientStatus.PROVISIONAL,
      });
      duplicateDetection.checkByNin.mockResolvedValue(mockPatient);
      await expect(service.upgradeProvisional('nuhi-1', '12345678901', 'user-1')).rejects.toThrow(
        ConflictException,
      );
    });
  });
});
