import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { Server } from 'http';
import { PatientController } from '../patient.controller';
import { PatientService } from '../patient.service';
import { APP_GUARD } from '@nestjs/core';
import { RegistrationType, PatientStatus } from '@nuhiris/shared-types';

describe('PatientController (integration)', () => {
  let app: INestApplication;
  let patientService: Partial<PatientService>;

  const mockPatient = {
    nuhi: '11111111-1111-4111-8111-111111111111',
    fullName: 'Test Patient',
    dateOfBirth: '1990-01-01',
    sex: 'male' as const,
    state: 'Lagos',
    lga: null,
    phone: null,
    email: null,
    nin: null,
    ninHash: null,
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
    registeredBy: 'actor-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeAll(async () => {
    patientService = {
      register: jest.fn().mockResolvedValue(mockPatient),
      findByNuhi: jest.fn().mockResolvedValue(mockPatient),
      search: jest.fn().mockResolvedValue([[mockPatient], 1]),
      update: jest.fn().mockResolvedValue(mockPatient),
      upgradeProvisional: jest.fn().mockResolvedValue(mockPatient),
      getHistory: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PatientController],
      providers: [
        { provide: PatientService, useValue: patientService },
        { provide: APP_GUARD, useValue: { canActivate: () => true } },
      ],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /patients', () => {
    it('creates a patient and returns the record', async () => {
      const res = await request(app.getHttpServer() as Server)
        .post('/patients')
        .set('Authorization', 'Bearer fake-token')
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
      const res = await request(app.getHttpServer() as Server)
        .get('/patients/search?fullName=Test')
        .set('Authorization', 'Bearer fake-token')
        .expect(200);

      expect(patientService.search).toHaveBeenCalled();
    });
  });

  describe('GET /patients/:nuhi', () => {
    it('returns a patient by NUHI', async () => {
      const res = await request(app.getHttpServer() as Server)
        .get(`/patients/${mockPatient.nuhi}`)
        .set('Authorization', 'Bearer fake-token')
        .expect(200);

      expect(res.body.nuhi).toBe(mockPatient.nuhi);
    });
  });

  describe('PATCH /patients/:nuhi', () => {
    it('updates a patient record', async () => {
      await request(app.getHttpServer() as Server)
        .patch(`/patients/${mockPatient.nuhi}`)
        .set('Authorization', 'Bearer fake-token')
        .send({ fullName: 'Updated Name' })
        .expect(200);

      expect(patientService.update).toHaveBeenCalled();
    });
  });

  describe('GET /patients/:nuhi/history', () => {
    it('returns patient change history', async () => {
      const res = await request(app.getHttpServer() as Server)
        .get(`/patients/${mockPatient.nuhi}/history`)
        .set('Authorization', 'Bearer fake-token')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });
  });
});
