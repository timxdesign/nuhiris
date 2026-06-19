import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditEvent } from './entities/audit-event.entity';
import { AuditAction } from '@nuhiris/shared-types';

export interface CreateAuditEventParams {
  actorId: string | null;
  actorRole: string | null;
  actorFacilityId: string | null;
  action: AuditAction;
  outcome: 'success' | 'failure';
  failureReason?: string | null;
  resourceType?: string | null;
  resourceId?: string | null;
  patientNuhi?: string | null;
  pathway?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  sessionId?: string | null;
  metadata?: Record<string, unknown> | null;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectRepository(AuditEvent)
    private auditRepo: Repository<AuditEvent>,
  ) {}

  async create(params: CreateAuditEventParams): Promise<AuditEvent> {
    try {
      const event = this.auditRepo.create({
        actorId: params.actorId,
        actorRole: params.actorRole,
        actorFacilityId: params.actorFacilityId,
        action: params.action,
        outcome: params.outcome,
        failureReason: params.failureReason ?? null,
        resourceType: params.resourceType ?? null,
        resourceId: params.resourceId ?? null,
        patientNuhi: params.patientNuhi ?? null,
        pathway: params.pathway ?? null,
        ipAddress: params.ipAddress ?? null,
        userAgent: params.userAgent ?? null,
        sessionId: params.sessionId ?? null,
        metadata: params.metadata ?? null,
      });
      return await this.auditRepo.save(event);
    } catch (error) {
      this.logger.error('Audit write failed', error);
      throw new InternalServerErrorException('AUDIT_WRITE_FAILED');
    }
  }

  async findByActor(actorId: string, page: number, limit: number): Promise<[AuditEvent[], number]> {
    return this.auditRepo.findAndCount({
      where: { actorId },
      order: { timestamp: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  async findByPatient(patientNuhi: string, page: number, limit: number): Promise<[AuditEvent[], number]> {
    return this.auditRepo.findAndCount({
      where: { patientNuhi },
      order: { timestamp: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  async findAll(page: number, limit: number): Promise<[AuditEvent[], number]> {
    return this.auditRepo.findAndCount({
      order: { timestamp: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  async findByResource(resourceType: string, resourceId: string): Promise<AuditEvent[]> {
    return this.auditRepo.find({
      where: { resourceType, resourceId },
      order: { timestamp: 'DESC' },
    });
  }
}
