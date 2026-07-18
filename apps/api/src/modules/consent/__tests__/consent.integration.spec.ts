import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConsentController } from '../consent.controller';
import { ConsentService } from '../consent.service';
import { Consent } from '../entities/consent.entity';
import { AuditService } from '../../audit/audit.service';
import { ConsentPurpose } from '@nuhiris/shared-types';

const NUHI = 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33';

const mockConsent = {
  consentId: 'a1eebc99-9c0b-4ef8-bb6d-6bb9bd380a01',
  nuhi: NUHI,
  grantorId: 'user-1',
  granteeType: 'provider',
  granteeId: 'prov-1',
  purpose: ConsentPurpose.TREATMENT,
  scope: ['Encounter', 'Observation'],
  validFrom: new Date(),
  validTo: null,
  revokedAt: null,
  revocationReason: null,
  createdAt: new Date(),
};

const mockConsentRepo = {
  findOne: jest.fn(),
  find: jest.fn().mockResolvedValue([mockConsent]),
  create: jest.fn().mockReturnValue(mockConsent),
  save: jest.fn().mockResolvedValue(mockConsent),
  manager: { query: jest.fn().mockResolvedValue([]) },
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

describe('Consent Integration', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [ConsentController],
      providers: [
        ConsentService,
        { provide: getRepositoryToken(Consent), useValue: mockConsentRepo },
        { provide: AuditService, useValue: { create: jest.fn().mockResolvedValue({}) } },
        { provide: EventEmitter2, useValue: { emit: jest.fn() } },
      ],
    }).compile();

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

  describe('POST /patients/:nuhi/consents', () => {
    it('grants consent', async () => {
      const { status, body } = await request(app.getHttpServer())
        .post(`/patients/${NUHI}/consents`)
        .send({
          granteeType: 'provider',
          granteeId: 'prov-1',
          purpose: 'TREATMENT',
          scope: ['Encounter', 'Observation'],
        });

      expect(status).toBe(201);
      expect(body.purpose).toBe('TREATMENT');
    });

    it('rejects invalid purpose', async () => {
      const { status } = await request(app.getHttpServer())
        .post(`/patients/${NUHI}/consents`)
        .send({
          granteeType: 'provider',
          granteeId: 'prov-1',
          purpose: 'INVALID',
          scope: ['Encounter'],
        });

      expect(status).toBe(400);
    });
  });

  describe('GET /patients/:nuhi/consents', () => {
    it('lists patient consents', async () => {
      const { status, body } = await request(app.getHttpServer())
        .get(`/patients/${NUHI}/consents`);

      expect(status).toBe(200);
      expect(Array.isArray(body)).toBe(true);
    });
  });

  describe('POST /access/break-glass', () => {
    it('grants break-glass access', async () => {
      const { status, body } = await request(app.getHttpServer())
        .post('/access/break-glass')
        .send({
          patientNuhi: NUHI,
          reason: 'Patient in cardiac arrest, immediate access to records required',
        });

      expect(status).toBe(201);
      expect(body.actorId).toBe('user-1');
      expect(body.expiresAt).toBeDefined();
    });
  });
});
