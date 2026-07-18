import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ProviderModule } from '../provider.module';
import { Provider } from '../entities/provider.entity';
import { ProviderAffiliation } from '../entities/provider-affiliation.entity';
import { ProviderCategory, VerificationStatus, EmploymentType } from '@nuhiris/shared-types';

const mockProviderRepo = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  createQueryBuilder: jest.fn().mockReturnValue({
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
  }),
};

const mockAffiliationRepo = {
  findOne: jest.fn(),
  find: jest.fn().mockResolvedValue([]),
  create: jest.fn().mockImplementation((d) => d),
  save: jest.fn().mockImplementation((d) => Promise.resolve({ affiliationId: 'aff-1', ...d })),
  count: jest.fn().mockResolvedValue(0),
};

const PROV_ID = 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55';

const mockProvider = {
  providerId: PROV_ID,
  fullName: 'Dr. Emeka Obi',
  category: ProviderCategory.DOCTOR,
  specialty: 'Internal Medicine',
  licenceNumber: 'MDCN-12345',
  regulatoryBody: 'MDCN',
  verificationStatus: VerificationStatus.PENDING,
  verifiedAt: null,
  verificationSource: null,
  status: 'active',
  accountId: null,
  createdAt: new Date(),
};

jest.mock('../../auth/guards/jwt-auth.guard', () => ({
  JwtAuthGuard: jest.fn().mockImplementation(() => ({
    canActivate: () => true,
  })),
}));

jest.mock('../../auth/guards/roles.guard', () => ({
  RolesGuard: jest.fn().mockImplementation(() => ({
    canActivate: () => true,
  })),
}));

describe('Provider Integration', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [ProviderModule],
    })
      .overrideProvider(getRepositoryToken(Provider))
      .useValue(mockProviderRepo)
      .overrideProvider(getRepositoryToken(ProviderAffiliation))
      .useValue(mockAffiliationRepo)
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
  });

  describe('POST /providers', () => {
    it('creates a provider', async () => {
      mockProviderRepo.findOne.mockResolvedValue(null);
      mockProviderRepo.create.mockReturnValue(mockProvider);
      mockProviderRepo.save.mockResolvedValue(mockProvider);

      const { status, body } = await request(app.getHttpServer())
        .post('/providers')
        .send({
          fullName: 'Dr. Emeka Obi',
          category: 'doctor',
          licenceNumber: 'MDCN-12345',
          regulatoryBody: 'MDCN',
        });

      expect(status).toBe(201);
      expect(body.fullName).toBe('Dr. Emeka Obi');
    });

    it('rejects invalid category', async () => {
      const { status } = await request(app.getHttpServer())
        .post('/providers')
        .send({ fullName: 'Test', category: 'invalid' });

      expect(status).toBe(400);
    });
  });

  describe('GET /providers/:providerId', () => {
    it('returns provider by ID', async () => {
      mockProviderRepo.findOne.mockResolvedValue(mockProvider);

      const { status, body } = await request(app.getHttpServer())
        .get(`/providers/${PROV_ID}`);

      expect(status).toBe(200);
      expect(body.providerId).toBe(PROV_ID);
    });

    it('returns 404 for missing provider', async () => {
      mockProviderRepo.findOne.mockResolvedValue(null);

      const { status } = await request(app.getHttpServer())
        .get('/providers/f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a66');

      expect(status).toBe(404);
    });
  });

  describe('POST /providers/:providerId/verify', () => {
    it('verifies a provider', async () => {
      mockProviderRepo.findOne.mockResolvedValue({ ...mockProvider });
      mockProviderRepo.save.mockImplementation((p) => Promise.resolve(p));

      const { status, body } = await request(app.getHttpServer())
        .post(`/providers/${PROV_ID}/verify`)
        .send({ source: 'MDCN API' });

      expect(status).toBe(201);
      expect(body.verificationStatus).toBe('verified');
    });
  });

  describe('POST /providers/:providerId/affiliations', () => {
    it('creates affiliation', async () => {
      mockProviderRepo.findOne.mockResolvedValue(mockProvider);
      mockAffiliationRepo.findOne.mockResolvedValue(null);

      const { status, body } = await request(app.getHttpServer())
        .post(`/providers/${PROV_ID}/affiliations`)
        .send({
          facilityId: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44',
          employmentType: 'full_time',
          startDate: '2025-01-01',
        });

      expect(status).toBe(201);
      expect(body.facilityId).toBe('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44');
    });
  });
});
