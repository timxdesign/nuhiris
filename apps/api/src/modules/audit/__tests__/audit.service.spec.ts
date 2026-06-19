import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { InternalServerErrorException } from '@nestjs/common';
import { AuditService } from '../audit.service';
import { AuditEvent } from '../entities/audit-event.entity';
import { AuditAction } from '@nuhiris/shared-types';

describe('AuditService', () => {
  let service: AuditService;
  let repo: {
    create: jest.Mock;
    save: jest.Mock;
    findAndCount: jest.Mock;
    find: jest.Mock;
  };

  const mockEvent = {
    eventId: 'evt-1',
    actorId: 'user-1',
    actorRole: 'medical_officer',
    actorFacilityId: 'fac-1',
    action: AuditAction.READ,
    outcome: 'success',
    timestamp: new Date(),
  } as AuditEvent;

  beforeEach(async () => {
    repo = {
      create: jest.fn().mockReturnValue(mockEvent),
      save: jest.fn().mockResolvedValue(mockEvent),
      findAndCount: jest.fn().mockResolvedValue([[mockEvent], 1]),
      find: jest.fn().mockResolvedValue([mockEvent]),
    };

    const module = await Test.createTestingModule({
      providers: [
        AuditService,
        { provide: getRepositoryToken(AuditEvent), useValue: repo },
      ],
    }).compile();

    service = module.get(AuditService);
  });

  describe('create', () => {
    it('inserts an audit event', async () => {
      const result = await service.create({
        actorId: 'user-1',
        actorRole: 'medical_officer',
        actorFacilityId: 'fac-1',
        action: AuditAction.READ,
        outcome: 'success',
      });

      expect(repo.create).toHaveBeenCalled();
      expect(repo.save).toHaveBeenCalledWith(mockEvent);
      expect(result.eventId).toBe('evt-1');
    });

    it('throws AUDIT_WRITE_FAILED on database error', async () => {
      repo.save.mockRejectedValueOnce(new Error('DB down'));

      await expect(
        service.create({
          actorId: 'user-1',
          actorRole: 'medical_officer',
          actorFacilityId: null,
          action: AuditAction.LOGIN,
          outcome: 'success',
        }),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('findByActor', () => {
    it('returns paginated events for an actor', async () => {
      const [events, total] = await service.findByActor('user-1', 1, 20);
      expect(events).toHaveLength(1);
      expect(total).toBe(1);
      expect(repo.findAndCount).toHaveBeenCalledWith({
        where: { actorId: 'user-1' },
        order: { timestamp: 'DESC' },
        skip: 0,
        take: 20,
      });
    });
  });

  describe('findByPatient', () => {
    it('returns paginated events for a patient NUHI', async () => {
      const [events, total] = await service.findByPatient('nuhi-1', 1, 10);
      expect(events).toHaveLength(1);
      expect(total).toBe(1);
      expect(repo.findAndCount).toHaveBeenCalledWith({
        where: { patientNuhi: 'nuhi-1' },
        order: { timestamp: 'DESC' },
        skip: 0,
        take: 10,
      });
    });
  });

  describe('findAll', () => {
    it('returns all events paginated', async () => {
      const [events, total] = await service.findAll(2, 10);
      expect(events).toHaveLength(1);
      expect(total).toBe(1);
      expect(repo.findAndCount).toHaveBeenCalledWith({
        order: { timestamp: 'DESC' },
        skip: 10,
        take: 10,
      });
    });
  });

  describe('findByResource', () => {
    it('returns events for a specific resource', async () => {
      const events = await service.findByResource('patient', 'res-1');
      expect(events).toHaveLength(1);
      expect(repo.find).toHaveBeenCalledWith({
        where: { resourceType: 'patient', resourceId: 'res-1' },
        order: { timestamp: 'DESC' },
      });
    });
  });
});
