import { Test } from '@nestjs/testing';
import { NinVerificationController } from '../nin-verification.controller';
import { NIN_AUTH_SERVICE } from '../tokens';
import { BiometricEventService } from '../biometric-event.service';
import { IJwtPayload, UserRole } from '@nuhiris/shared-types';

const mockNinAuth = {
  lookupNin: jest.fn(),
  verifyBiometric: jest.fn(),
  verifyLiveness: jest.fn(),
  verifyFaceMatch: jest.fn(),
};

const mockBiometricEventService = {
  recordLookup: jest.fn().mockResolvedValue({ eventId: 'evt-1' }),
  recordLiveness: jest.fn().mockResolvedValue({ eventId: 'evt-2' }),
  recordFaceMatch: jest.fn().mockResolvedValue({ eventId: 'evt-3' }),
  recordRegistration: jest.fn().mockResolvedValue({ eventId: 'evt-4' }),
};

const mockUser: IJwtPayload = {
  sub: 'user-1',
  roles: [UserRole.HEALTH_RECORDS_OFFICER],
  facilityId: 'fac-1',
  providerId: null,
  iat: 0,
  exp: 0,
  jti: '',
};

describe('NinVerificationController', () => {
  let controller: NinVerificationController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module = await Test.createTestingModule({
      controllers: [NinVerificationController],
      providers: [
        { provide: NIN_AUTH_SERVICE, useValue: mockNinAuth },
        { provide: BiometricEventService, useValue: mockBiometricEventService },
      ],
    }).compile();

    controller = module.get(NinVerificationController);
  });

  describe('lookup', () => {
    it('returns NIMC data and records a biometric event', async () => {
      const nimcResult = {
        found: true,
        nin: '12345678901',
        firstName: 'Oluwaseun',
        lastName: 'Adeyemi',
        middleName: null,
        dateOfBirth: '1990-03-15',
        gender: 'male',
        state: 'Lagos',
        lga: 'Ikeja',
        photoBase64: 'base64-photo',
        nimcReferenceId: 'NIMC-REF-1',
      };
      mockNinAuth.lookupNin.mockResolvedValue(nimcResult);

      const result = await controller.lookup({ nin: '12345678901' }, mockUser);

      expect(result).toEqual(nimcResult);
      expect(mockBiometricEventService.recordLookup).toHaveBeenCalledWith({
        nin: '12345678901',
        found: true,
        nimcReferenceId: 'NIMC-REF-1',
        performedBy: 'user-1',
        facilityId: 'fac-1',
      });
    });

    it('records event for NIN not found', async () => {
      mockNinAuth.lookupNin.mockResolvedValue({
        found: false,
        nin: '00000000000',
        firstName: '',
        lastName: '',
        middleName: null,
        dateOfBirth: '',
        gender: '',
        state: '',
        lga: null,
        photoBase64: null,
        nimcReferenceId: 'NIMC-REF-2',
      });

      const result = await controller.lookup({ nin: '00000000000' }, mockUser);

      expect(result.found).toBe(false);
      expect(mockBiometricEventService.recordLookup).toHaveBeenCalledWith(
        expect.objectContaining({ found: false }),
      );
    });
  });

  describe('verifyLiveness', () => {
    it('returns liveness result and records event', async () => {
      mockNinAuth.verifyLiveness.mockResolvedValue({
        passed: true,
        confidenceScore: 0.95,
        nimcReferenceId: 'NIMC-LIV-1',
      });

      const result = await controller.verifyLiveness({ nin: '12345678901' }, mockUser);

      expect(result.passed).toBe(true);
      expect(result.confidenceScore).toBe(0.95);
      expect(mockBiometricEventService.recordLiveness).toHaveBeenCalledWith({
        nin: '12345678901',
        passed: true,
        confidenceScore: 0.95,
        nimcReferenceId: 'NIMC-LIV-1',
        performedBy: 'user-1',
        facilityId: 'fac-1',
      });
    });
  });

  describe('verifyFace', () => {
    it('returns face match result and records event', async () => {
      mockNinAuth.verifyFaceMatch.mockResolvedValue({
        matched: true,
        confidenceScore: 0.96,
        nimcReferenceId: 'NIMC-FACE-1',
      });

      const result = await controller.verifyFace({ nin: '12345678901' }, mockUser);

      expect(result.matched).toBe(true);
      expect(mockBiometricEventService.recordFaceMatch).toHaveBeenCalledWith({
        nin: '12345678901',
        matched: true,
        confidenceScore: 0.96,
        nimcReferenceId: 'NIMC-FACE-1',
        performedBy: 'user-1',
        facilityId: 'fac-1',
      });
    });

    it('records event on face match failure', async () => {
      mockNinAuth.verifyFaceMatch.mockResolvedValue({
        matched: false,
        confidenceScore: 0.25,
        nimcReferenceId: 'NIMC-FACE-2',
      });

      const result = await controller.verifyFace({ nin: '99999999999' }, mockUser);

      expect(result.matched).toBe(false);
      expect(mockBiometricEventService.recordFaceMatch).toHaveBeenCalledWith(
        expect.objectContaining({ matched: false }),
      );
    });
  });
});
