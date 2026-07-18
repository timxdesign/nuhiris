import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ForbiddenException, BadRequestException, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConsentService } from '../consent.service';
import { Consent } from '../entities/consent.entity';
import { AuditService } from '../../audit/audit.service';
import { ConsentPurpose } from '@nuhiris/shared-types';

const mockConsent: Consent = {
  consentId: 'consent-1',
  nuhi: 'nuhi-1',
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

describe('ConsentService', () => {
  let service: ConsentService;
  let consentRepo: { findOne: jest.Mock; find: jest.Mock; create: jest.Mock; save: jest.Mock; manager: { query: jest.Mock } };
  let auditService: { create: jest.Mock };
  let eventEmitter: { emit: jest.Mock };

  beforeEach(async () => {
    consentRepo = {
      findOne: jest.fn(),
      find: jest.fn().mockResolvedValue([mockConsent]),
      create: jest.fn().mockReturnValue(mockConsent),
      save: jest.fn().mockResolvedValue(mockConsent),
      manager: { query: jest.fn().mockResolvedValue([]) },
    };

    auditService = { create: jest.fn().mockResolvedValue({}) };
    eventEmitter = { emit: jest.fn() };

    const module = await Test.createTestingModule({
      providers: [
        ConsentService,
        { provide: getRepositoryToken(Consent), useValue: consentRepo },
        { provide: AuditService, useValue: auditService },
        { provide: EventEmitter2, useValue: eventEmitter },
      ],
    }).compile();

    service = module.get(ConsentService);
  });

  describe('grant', () => {
    it('creates a consent record', async () => {
      const result = await service.grant('nuhi-1', {
        granteeType: 'provider',
        granteeId: 'prov-1',
        purpose: ConsentPurpose.TREATMENT,
        scope: ['Encounter'],
      }, 'user-1');
      expect(result).toEqual(mockConsent);
      expect(consentRepo.save).toHaveBeenCalled();
    });
  });

  describe('revoke', () => {
    it('revokes an active consent', async () => {
      consentRepo.findOne.mockResolvedValue({ ...mockConsent });
      consentRepo.save.mockImplementation((c) => Promise.resolve(c));
      const result = await service.revoke('consent-1', 'No longer needed');
      expect(result.revokedAt).toBeDefined();
      expect(result.revocationReason).toBe('No longer needed');
      expect(eventEmitter.emit).toHaveBeenCalledWith('consent.revoked', expect.any(Object));
    });

    it('throws BadRequestException if already revoked', async () => {
      consentRepo.findOne.mockResolvedValue({ ...mockConsent, revokedAt: new Date() });
      await expect(service.revoke('consent-1', 'test')).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException for missing consent', async () => {
      consentRepo.findOne.mockResolvedValue(null);
      await expect(service.revoke('missing', 'test')).rejects.toThrow(NotFoundException);
    });
  });

  describe('checkAccess', () => {
    it('permits national_admin unconditionally', async () => {
      const result = await service.checkAccess({
        actorId: 'admin-1',
        actorRoles: ['national_admin'],
        actorFacilityId: null,
        actorProviderId: null,
        patientNuhi: 'nuhi-1',
        resourceType: 'encounters',
      });
      expect(result.permitted).toBe(true);
      expect(result.reason).toBe('admin_role');
    });

    it('permits with active encounter link', async () => {
      consentRepo.manager.query.mockResolvedValue([{ '1': 1 }]);
      const result = await service.checkAccess({
        actorId: 'user-1',
        actorRoles: ['medical_officer'],
        actorFacilityId: 'fac-1',
        actorProviderId: 'prov-1',
        patientNuhi: 'nuhi-1',
        resourceType: 'encounters',
      });
      expect(result.permitted).toBe(true);
      expect(result.reason).toBe('active_encounter');
    });

    it('denies when no consent exists', async () => {
      consentRepo.manager.query.mockResolvedValue([]);
      consentRepo.findOne.mockResolvedValue(null);
      const result = await service.checkAccess({
        actorId: 'user-1',
        actorRoles: ['medical_officer'],
        actorFacilityId: 'fac-1',
        actorProviderId: 'prov-1',
        patientNuhi: 'nuhi-1',
        resourceType: 'encounters',
      });
      expect(result.permitted).toBe(false);
      expect(result.reason).toBe('no_consent');
    });
  });

  describe('breakGlass', () => {
    it('grants break-glass access for medical_officer', async () => {
      const result = await service.breakGlass('user-1', 'medical_officer', 'nuhi-1', 'Patient in cardiac arrest, immediate access required');
      expect(result.actorId).toBe('user-1');
      expect(result.patientNuhi).toBe('nuhi-1');
      expect(result.expiresAt.getTime()).toBeGreaterThan(Date.now());
      expect(auditService.create).toHaveBeenCalled();
      expect(eventEmitter.emit).toHaveBeenCalledWith('break-glass.triggered', expect.any(Object));
    });

    it('rejects break-glass for unauthorized roles', async () => {
      await expect(
        service.breakGlass('user-1', 'nurse', 'nuhi-1', 'Emergency access needed for patient'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rejects break-glass with insufficient reason', async () => {
      await expect(
        service.breakGlass('user-1', 'medical_officer', 'nuhi-1', 'short'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
