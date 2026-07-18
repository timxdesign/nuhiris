import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { NinVerificationController } from '../nin-verification.controller';
import { NIN_AUTH_SERVICE } from '../tokens';
import { BiometricEventService } from '../biometric-event.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { UserRole } from '@nuhiris/shared-types';

const mockGuard = {
  canActivate: (context: { switchToHttp: () => { getRequest: () => Record<string, unknown> } }) => {
    const req = context.switchToHttp().getRequest();
    req['user'] = { sub: 'user-1', roles: [UserRole.HEALTH_RECORDS_OFFICER], facilityId: 'fac-1' };
    return true;
  },
};

const mockNinAuth = {
  lookupNin: jest.fn().mockResolvedValue({
    found: true,
    nin: '12345678901',
    firstName: 'Oluwaseun',
    lastName: 'Adeyemi',
    middleName: 'Tobi',
    dateOfBirth: '1990-03-15',
    gender: 'male',
    state: 'Lagos',
    lga: 'Ikeja',
    photoBase64: 'mock-photo',
    nimcReferenceId: 'NIMC-MOCK-123',
  }),
  verifyBiometric: jest.fn(),
  verifyLiveness: jest.fn().mockResolvedValue({
    passed: true,
    confidenceScore: 0.95,
    nimcReferenceId: 'NIMC-LIV-123',
  }),
  verifyFaceMatch: jest.fn().mockResolvedValue({
    matched: true,
    confidenceScore: 0.96,
    nimcReferenceId: 'NIMC-FACE-123',
  }),
};

const mockBiometricEventService = {
  recordLookup: jest.fn().mockResolvedValue({ eventId: 'evt-1' }),
  recordLiveness: jest.fn().mockResolvedValue({ eventId: 'evt-2' }),
  recordFaceMatch: jest.fn().mockResolvedValue({ eventId: 'evt-3' }),
  recordRegistration: jest.fn().mockResolvedValue({ eventId: 'evt-4' }),
};

describe('NinVerificationController (integration)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NinVerificationController],
      providers: [
        { provide: NIN_AUTH_SERVICE, useValue: mockNinAuth },
        { provide: BiometricEventService, useValue: mockBiometricEventService },
      ],
    })
      .overrideGuard(JwtAuthGuard).useValue(mockGuard)
      .overrideGuard(RolesGuard).useValue(mockGuard)
      .compile();

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /nin/lookup', () => {
    it('returns NIMC demographics for valid NIN', async () => {
      const res = await request(app.getHttpServer())
        .post('/nin/lookup')
        .send({ nin: '12345678901' })
        .expect(201);

      expect(res.body.found).toBe(true);
      expect(res.body.firstName).toBe('Oluwaseun');
      expect(res.body.lastName).toBe('Adeyemi');
    });

    it('rejects invalid NIN format', async () => {
      await request(app.getHttpServer())
        .post('/nin/lookup')
        .send({ nin: '123' })
        .expect(400);
    });
  });

  describe('POST /nin/verify-liveness', () => {
    it('returns liveness check result', async () => {
      const res = await request(app.getHttpServer())
        .post('/nin/verify-liveness')
        .send({ nin: '12345678901' })
        .expect(201);

      expect(res.body.passed).toBe(true);
      expect(res.body.confidenceScore).toBe(0.95);
    });
  });

  describe('POST /nin/verify-face', () => {
    it('returns face match result', async () => {
      const res = await request(app.getHttpServer())
        .post('/nin/verify-face')
        .send({ nin: '12345678901' })
        .expect(201);

      expect(res.body.matched).toBe(true);
      expect(res.body.confidenceScore).toBe(0.96);
    });
  });
});
