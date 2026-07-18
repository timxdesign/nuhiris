import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BiometricEventService } from '../biometric-event.service';
import { BiometricEvent } from '../../device/entities/biometric-event.entity';
import {
  BiometricEventType,
  BiometricMethod,
  BiometricResult,
} from '@nuhiris/shared-types';

describe('BiometricEventService', () => {
  let service: BiometricEventService;
  let repo: { create: jest.Mock; save: jest.Mock };

  beforeEach(async () => {
    repo = {
      create: jest.fn().mockImplementation((data) => ({ eventId: 'evt-new', ...data })),
      save: jest.fn().mockImplementation((data) => Promise.resolve(data)),
    };

    const module = await Test.createTestingModule({
      providers: [
        BiometricEventService,
        { provide: getRepositoryToken(BiometricEvent), useValue: repo },
      ],
    }).compile();

    service = module.get(BiometricEventService);
  });

  describe('recordLookup', () => {
    it('creates a NIN_LOOKUP biometric event', async () => {
      await service.recordLookup({
        nin: '12345678901',
        found: true,
        nimcReferenceId: 'NIMC-REF-1',
        performedBy: 'user-1',
        facilityId: 'fac-1',
      });

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: BiometricEventType.NIN_LOOKUP,
          method: BiometricMethod.DOCUMENTARY,
          result: BiometricResult.MATCH,
          nimcApiCalled: true,
        }),
      );
      expect(repo.save).toHaveBeenCalled();
    });

    it('records NO_MATCH for unfound NIN', async () => {
      await service.recordLookup({
        nin: '00000000000',
        found: false,
        nimcReferenceId: 'NIMC-REF-2',
        performedBy: 'user-1',
        facilityId: null,
      });

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          result: BiometricResult.NO_MATCH,
        }),
      );
    });
  });

  describe('recordLiveness', () => {
    it('creates a LIVENESS_CHECK event with confidence score', async () => {
      await service.recordLiveness({
        nin: '12345678901',
        passed: true,
        confidenceScore: 0.95,
        nimcReferenceId: 'NIMC-LIV-1',
        performedBy: 'user-1',
        facilityId: 'fac-1',
      });

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: BiometricEventType.LIVENESS_CHECK,
          method: BiometricMethod.FACE_LIVENESS,
          result: BiometricResult.MATCH,
          confidenceScore: '0.9500',
          livenessPassed: true,
        }),
      );
    });

    it('records LIVENESS_FAIL on failure', async () => {
      await service.recordLiveness({
        nin: '12345678901',
        passed: false,
        confidenceScore: 0.3,
        nimcReferenceId: 'NIMC-LIV-2',
        performedBy: 'user-1',
        facilityId: null,
      });

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          result: BiometricResult.LIVENESS_FAIL,
          livenessPassed: false,
        }),
      );
    });
  });

  describe('recordFaceMatch', () => {
    it('creates an IDENTITY_CHECK event', async () => {
      await service.recordFaceMatch({
        nin: '12345678901',
        matched: true,
        confidenceScore: 0.96,
        nimcReferenceId: 'NIMC-FACE-1',
        performedBy: 'user-1',
        facilityId: 'fac-1',
      });

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: BiometricEventType.IDENTITY_CHECK,
          method: BiometricMethod.FACE,
          result: BiometricResult.MATCH,
          confidenceScore: '0.9600',
        }),
      );
    });
  });

  describe('recordRegistration', () => {
    it('creates a REGISTRATION event with NUHI', async () => {
      await service.recordRegistration({
        nuhi: 'nuhi-123',
        nin: '12345678901',
        matched: true,
        confidenceScore: 0.96,
        nimcReferenceId: 'NIMC-REG-1',
        performedBy: 'user-1',
        facilityId: 'fac-1',
      });

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          nuhi: 'nuhi-123',
          eventType: BiometricEventType.REGISTRATION,
          method: BiometricMethod.FACE,
        }),
      );
    });
  });
});
