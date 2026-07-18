import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EncounterModule } from '../encounter.module';
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
import { EncounterType, EncounterStatus } from '@nuhiris/shared-types';

function createMockRepo(defaultEntity: Record<string, unknown> = {}) {
  return {
    findOne: jest.fn(),
    find: jest.fn().mockResolvedValue([]),
    findAndCount: jest.fn().mockResolvedValue([[], 0]),
    create: jest.fn().mockImplementation((d) => ({ ...defaultEntity, ...d })),
    save: jest.fn().mockImplementation((d) => Promise.resolve({ ...defaultEntity, ...d, createdAt: new Date() })),
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

const ENC_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const NUHI = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';

const mockEncounter = {
  encounterId: ENC_ID,
  nuhi: NUHI,
  providerId: '00000000-0000-0000-0000-000000000002',
  facilityId: '00000000-0000-0000-0000-000000000003',
  encounterType: EncounterType.OUTPATIENT,
  status: EncounterStatus.OPEN,
  reason: 'Fever',
  dateTime: new Date(),
  closedAt: null,
  notes: null,
  createdAt: new Date(),
};

jest.mock('../../auth/guards/jwt-auth.guard', () => ({
  JwtAuthGuard: jest.fn().mockImplementation(() => ({
    canActivate: (ctx: { switchToHttp: () => { getRequest: () => { user: unknown } } }) => {
      const req = ctx.switchToHttp().getRequest();
      req.user = {
        sub: 'user-1',
        roles: ['medical_officer'],
        facilityId: 'fac-1',
        providerId: 'prov-1',
        iat: 0,
        exp: 0,
        jti: 'j-1',
      };
      return true;
    },
  })),
}));

jest.mock('../../auth/guards/roles.guard', () => ({
  RolesGuard: jest.fn().mockImplementation(() => ({
    canActivate: () => true,
  })),
}));

describe('Encounter Integration', () => {
  let app: INestApplication;
  let encounterRepo: ReturnType<typeof createMockRepo>;

  beforeAll(async () => {
    encounterRepo = createMockRepo(mockEncounter);

    const module = await Test.createTestingModule({
      imports: [EncounterModule],
    })
      .overrideProvider(getRepositoryToken(Encounter)).useValue(encounterRepo)
      .overrideProvider(getRepositoryToken(Diagnosis)).useValue(createMockRepo())
      .overrideProvider(getRepositoryToken(Observation)).useValue(createMockRepo())
      .overrideProvider(getRepositoryToken(Prescription)).useValue(createMockRepo())
      .overrideProvider(getRepositoryToken(Dispense)).useValue(createMockRepo())
      .overrideProvider(getRepositoryToken(LabOrder)).useValue(createMockRepo())
      .overrideProvider(getRepositoryToken(LabResult)).useValue(createMockRepo())
      .overrideProvider(getRepositoryToken(Allergy)).useValue(createMockRepo())
      .overrideProvider(getRepositoryToken(Referral)).useValue(createMockRepo())
      .overrideProvider(getRepositoryToken(Immunisation)).useValue(createMockRepo())
      .compile();

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    encounterRepo.findOne.mockResolvedValue(mockEncounter);
  });

  describe('POST /encounters', () => {
    it('creates an encounter', async () => {
      encounterRepo.save.mockResolvedValue(mockEncounter);

      const { status, body } = await request(app.getHttpServer())
        .post('/encounters')
        .send({
          nuhi: NUHI,
          encounterType: 'outpatient',
          reason: 'Fever',
        });

      expect(status).toBe(201);
      expect(body.encounterType).toBe('outpatient');
    });

    it('rejects invalid encounter type', async () => {
      const { status } = await request(app.getHttpServer())
        .post('/encounters')
        .send({
          nuhi: NUHI,
          encounterType: 'invalid',
        });

      expect(status).toBe(400);
    });
  });

  describe('GET /encounters/:encounterId', () => {
    it('returns encounter', async () => {
      const { status, body } = await request(app.getHttpServer())
        .get(`/encounters/${ENC_ID}`);

      expect(status).toBe(200);
      expect(body.encounterId).toBe(ENC_ID);
    });
  });

  describe('PUT /encounters/:encounterId/status', () => {
    it('closes an encounter', async () => {
      encounterRepo.findOne.mockResolvedValue({ ...mockEncounter });
      encounterRepo.save.mockImplementation((e) => Promise.resolve(e));

      const { status, body } = await request(app.getHttpServer())
        .put(`/encounters/${ENC_ID}/status`)
        .send({ status: 'closed' });

      expect(status).toBe(200);
      expect(body.status).toBe('closed');
    });
  });

  describe('POST /encounters/:encounterId/diagnoses', () => {
    it('adds a diagnosis', async () => {
      const { status, body } = await request(app.getHttpServer())
        .post(`/encounters/${ENC_ID}/diagnoses`)
        .send({
          icd11Code: '1A00',
          description: 'Cholera',
          status: 'active',
        });

      expect(status).toBe(201);
      expect(body.icd11Code).toBe('1A00');
    });
  });

  describe('POST /encounters/:encounterId/prescriptions', () => {
    it('adds a prescription', async () => {
      const { status, body } = await request(app.getHttpServer())
        .post(`/encounters/${ENC_ID}/prescriptions`)
        .send({
          drugCode: 'SNOMED-123',
          drugName: 'Amoxicillin',
          dosage: '500mg',
          frequency: 'TDS',
        });

      expect(status).toBe(201);
      expect(body.drugName).toBe('Amoxicillin');
    });
  });

  describe('POST /encounters/:encounterId/lab-orders', () => {
    it('creates a lab order', async () => {
      const { status, body } = await request(app.getHttpServer())
        .post(`/encounters/${ENC_ID}/lab-orders`)
        .send({
          loincCode: '2093-3',
          testName: 'Total Cholesterol',
          urgency: 'routine',
        });

      expect(status).toBe(201);
      expect(body.testName).toBe('Total Cholesterol');
    });
  });
});
