import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { PatientController } from '../patient.controller';
import { PatientService } from '../patient.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { RegistrationType, PatientStatus, UserRole } from '@nuhiris/shared-types';

const mockGuard = {
  canActivate: (context: { switchToHttp: () => { getRequest: () => Record<string, unknown> } }) => {
    const req = context.switchToHttp().getRequest();
    req['user'] = { sub: 'actor-1', roles: [UserRole.NATIONAL_ADMIN], facilityId: null };
    return true;
  },
};

describe('PatientController (integration)', () => {
  let app: INestApplication;

  const mockPatient = {
    nuhi: '11111111-1111-4111-8111-111111111111',
    fullName: 'Test Patient',
    dateOfBirth: '1990-01-01',
    sex: 'male',
    state: 'Lagos',
    lga: null,
    phone: null,
    email: null,
    nin: null,
    ninHash: null,
    ninVerified: false,
    registrationType: RegistrationType.BIOMETRIC_VERIFIED,
    status: PatientStatus.ACTIVE,
    provisionalDeadline: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPatientService = {
    register: jest.fn().mockResolvedValue(mockPatient),
    findByNuhi: jest.fn().mockResolvedValue(mockPatient),
    findByAccountId: jest.fn().mockResolvedValue(mockPatient),
    search: jest.fn().mockResolvedValue([[mockPatient], 1]),
    update: jest.fn().mockResolvedValue(mockPatient),
    upgradeProvisional: jest.fn().mockResolvedValue(mockPatient),
    getHistory: jest.fn().mockResolvedValue([]),
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PatientController],
      providers: [
        { provide: PatientService, useValue: mockPatientService },
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

  describe('POST /patients', () => {
    it('creates a patient and returns the record', async () => {
      const res = await request(app.getHttpServer())
        .post('/patients')
        .send({
          fullName: 'Test Patient',
          dateOfBirth: '1990-01-01',
          sex: 'male',
          state: 'Lagos',
          registrationType: 'biometric_verified',
        })
        .expect(201);

      expect(res.body).toHaveProperty('nuhi');
      expect(res.body.fullName).toBe('Test Patient');
    });
  });

  describe('GET /patients/search', () => {
    it('searches by name', async () => {
      await request(app.getHttpServer())
        .get('/patients/search?fullName=Test')
        .expect(200);

      expect(mockPatientService.search).toHaveBeenCalled();
    });
  });

  describe('GET /patients/me', () => {
    it('returns the patient linked to the authenticated account', async () => {
      const res = await request(app.getHttpServer())
        .get('/patients/me')
        .expect(200);

      expect(res.body.nuhi).toBe(mockPatient.nuhi);
      expect(mockPatientService.findByAccountId).toHaveBeenCalledWith('actor-1');
    });
  });

  describe('GET /patients/:nuhi', () => {
    it('returns a patient by NUHI', async () => {
      const res = await request(app.getHttpServer())
        .get(`/patients/${mockPatient.nuhi}`)
        .expect(200);

      expect(res.body.nuhi).toBe(mockPatient.nuhi);
    });
  });

  describe('PATCH /patients/:nuhi', () => {
    it('updates a patient record', async () => {
      await request(app.getHttpServer())
        .patch(`/patients/${mockPatient.nuhi}`)
        .send({ fullName: 'Updated Name' })
        .expect(200);

      expect(mockPatientService.update).toHaveBeenCalled();
    });
  });

  describe('GET /patients/:nuhi/history', () => {
    it('returns patient change history', async () => {
      const res = await request(app.getHttpServer())
        .get(`/patients/${mockPatient.nuhi}/history`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });
  });
});
