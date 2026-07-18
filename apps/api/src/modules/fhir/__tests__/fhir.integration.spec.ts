import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { FhirController } from '../fhir.controller';
import { FhirService } from '../fhir.service';
import { Patient } from '../../patient/entities/patient.entity';
import { Provider } from '../../provider/entities/provider.entity';
import { Facility } from '../../facility/entities/facility.entity';
import { Encounter } from '../../encounter/entities/encounter.entity';
import { Diagnosis } from '../../encounter/entities/diagnosis.entity';
import { Observation } from '../../encounter/entities/observation.entity';
import { Prescription } from '../../encounter/entities/prescription.entity';
import { Dispense } from '../../encounter/entities/dispense.entity';
import { Allergy } from '../../encounter/entities/allergy.entity';
import { Immunisation } from '../../encounter/entities/immunisation.entity';
import { LabOrder } from '../../encounter/entities/lab-order.entity';
import { LabResult } from '../../encounter/entities/lab-result.entity';
import { Referral } from '../../encounter/entities/referral.entity';
import { DocumentRef } from '../../document/entities/document-ref.entity';
import { Consent } from '../../consent/entities/consent.entity';

const PATIENT_NUHI = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

const mockPatient = {
  nuhi: PATIENT_NUHI,
  fullName: 'Adaeze Okafor',
  dateOfBirth: '1990-05-15',
  sex: 'female',
  state: 'Lagos',
  lga: 'Ikeja',
  phone: '+2348012345678',
  email: null,
  status: 'active',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const mockEncounter = {
  encounterId: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
  nuhi: PATIENT_NUHI,
  providerId: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
  facilityId: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44',
  encounterType: 'outpatient',
  status: 'open',
  reason: 'Fever',
  dateTime: new Date('2026-06-01'),
  closedAt: null,
  notes: null,
  createdAt: new Date(),
};

function mockRepo(data?: unknown) {
  return {
    findOne: jest.fn().mockResolvedValue(data ?? null),
    find: jest.fn().mockResolvedValue(data ? [data] : []),
    createQueryBuilder: jest.fn().mockReturnValue({
      andWhere: jest.fn().mockReturnThis(),
      innerJoin: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue(data ? [data] : []),
      getRawAndEntities: jest.fn().mockResolvedValue({ entities: [], raw: [] }),
    }),
  };
}

jest.mock('../../auth/guards/jwt-auth.guard', () => ({
  JwtAuthGuard: jest.fn().mockImplementation(() => ({
    canActivate: (ctx: { switchToHttp: () => { getRequest: () => { user: unknown } } }) => {
      const req = ctx.switchToHttp().getRequest();
      req.user = { sub: 'user-1', roles: ['national_admin'], facilityId: 'fac-1', providerId: 'prov-1', iat: 0, exp: 0, jti: 'j-1' };
      return true;
    },
  })),
}));

jest.mock('../../auth/guards/roles.guard', () => ({
  RolesGuard: jest.fn().mockImplementation(() => ({ canActivate: () => true })),
}));

describe('FHIR Gateway Integration', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [FhirController],
      providers: [
        FhirService,
        { provide: getRepositoryToken(Patient), useValue: mockRepo(mockPatient) },
        { provide: getRepositoryToken(Provider), useValue: mockRepo() },
        { provide: getRepositoryToken(Facility), useValue: mockRepo() },
        { provide: getRepositoryToken(Encounter), useValue: mockRepo(mockEncounter) },
        { provide: getRepositoryToken(Diagnosis), useValue: mockRepo() },
        { provide: getRepositoryToken(Observation), useValue: mockRepo() },
        { provide: getRepositoryToken(Prescription), useValue: mockRepo() },
        { provide: getRepositoryToken(Dispense), useValue: mockRepo() },
        { provide: getRepositoryToken(Allergy), useValue: mockRepo() },
        { provide: getRepositoryToken(Immunisation), useValue: mockRepo() },
        { provide: getRepositoryToken(LabOrder), useValue: mockRepo() },
        { provide: getRepositoryToken(LabResult), useValue: mockRepo() },
        { provide: getRepositoryToken(Referral), useValue: mockRepo() },
        { provide: getRepositoryToken(DocumentRef), useValue: mockRepo() },
        { provide: getRepositoryToken(Consent), useValue: mockRepo() },
      ],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /fhir/r4/metadata', () => {
    it('returns CapabilityStatement', async () => {
      const { status, body } = await request(app.getHttpServer()).get('/fhir/r4/metadata');
      expect(status).toBe(200);
      expect(body.resourceType).toBe('CapabilityStatement');
      expect(body.fhirVersion).toBe('4.0.1');
    });
  });

  describe('GET /fhir/r4/Patient/:id', () => {
    it('returns FHIR Patient resource', async () => {
      const { status, body } = await request(app.getHttpServer())
        .get(`/fhir/r4/Patient/${PATIENT_NUHI}`);

      expect(status).toBe(200);
      expect(body.resourceType).toBe('Patient');
      expect(body.id).toBe(PATIENT_NUHI);
      expect(body.gender).toBe('female');
      expect(body.birthDate).toBe('1990-05-15');
      expect(body.identifier[0].system).toBe('https://nuhiris.health.gov.ng/identifier/nuhi');
    });
  });

  describe('GET /fhir/r4/Patient', () => {
    it('returns search bundle', async () => {
      const { status, body } = await request(app.getHttpServer())
        .get('/fhir/r4/Patient?name=Adaeze');

      expect(status).toBe(200);
      expect(body.resourceType).toBe('Bundle');
      expect(body.type).toBe('searchset');
    });
  });

  describe('GET /fhir/r4/Encounter/:id', () => {
    it('returns FHIR Encounter resource', async () => {
      const { status, body } = await request(app.getHttpServer())
        .get(`/fhir/r4/Encounter/${mockEncounter.encounterId}`);

      expect(status).toBe(200);
      expect(body.resourceType).toBe('Encounter');
      expect(body.status).toBe('in-progress');
      expect(body.class.code).toBe('AMB');
      expect(body.subject.reference).toBe(`Patient/${PATIENT_NUHI}`);
    });
  });

  describe('GET /fhir/r4/Encounter', () => {
    it('returns encounter search bundle', async () => {
      const { status, body } = await request(app.getHttpServer())
        .get(`/fhir/r4/Encounter?patient=${PATIENT_NUHI}`);

      expect(status).toBe(200);
      expect(body.resourceType).toBe('Bundle');
    });
  });
});
