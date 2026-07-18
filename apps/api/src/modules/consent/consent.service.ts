import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Consent } from './entities/consent.entity';
import { GrantConsentDto } from './dto/grant-consent.dto';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '@nuhiris/shared-types';
import { EventEmitter2 } from '@nestjs/event-emitter';

export interface BreakGlassRecord {
  actorId: string;
  patientNuhi: string;
  reason: string;
  grantedAt: Date;
  expiresAt: Date;
}

@Injectable()
export class ConsentService {
  private breakGlassOverrides: Map<string, BreakGlassRecord> = new Map();

  constructor(
    @InjectRepository(Consent)
    private consentRepo: Repository<Consent>,
    private auditService: AuditService,
    private eventEmitter: EventEmitter2,
  ) {}

  async grant(nuhi: string, dto: GrantConsentDto, grantorId: string): Promise<Consent> {
    const consent = this.consentRepo.create({
      nuhi,
      grantorId,
      granteeType: dto.granteeType,
      granteeId: dto.granteeId,
      purpose: dto.purpose,
      scope: dto.scope,
      validTo: dto.validTo ? new Date(dto.validTo) : null,
    });

    return this.consentRepo.save(consent);
  }

  async listByPatient(nuhi: string): Promise<Consent[]> {
    return this.consentRepo.find({
      where: { nuhi, revokedAt: IsNull() },
      order: { createdAt: 'DESC' },
    });
  }

  async findById(consentId: string): Promise<Consent> {
    const consent = await this.consentRepo.findOne({ where: { consentId } });
    if (!consent) {
      throw new NotFoundException('Consent not found');
    }
    return consent;
  }

  async revoke(consentId: string, reason: string): Promise<Consent> {
    const consent = await this.findById(consentId);
    if (consent.revokedAt) {
      throw new BadRequestException('Consent already revoked');
    }

    consent.revokedAt = new Date();
    consent.revocationReason = reason;

    const saved = await this.consentRepo.save(consent);

    this.eventEmitter.emit('consent.revoked', {
      consentId,
      granteeType: consent.granteeType,
      granteeId: consent.granteeId,
      nuhi: consent.nuhi,
    });

    return saved;
  }

  async checkAccess(params: {
    actorId: string;
    actorRoles: string[];
    actorFacilityId: string | null;
    actorProviderId: string | null;
    patientNuhi: string;
    resourceType: string;
  }): Promise<{ permitted: boolean; reason: string }> {
    const { actorId, actorRoles, actorFacilityId, actorProviderId, patientNuhi, resourceType } = params;

    if (actorRoles.includes('national_admin') || actorRoles.includes('audit_inspector')) {
      return { permitted: true, reason: 'admin_role' };
    }

    if (actorProviderId && actorFacilityId) {
      const hasActiveEncounter = await this.hasActiveEncounterLink(
        actorProviderId,
        actorFacilityId,
        patientNuhi,
      );
      if (hasActiveEncounter) {
        return { permitted: true, reason: 'active_encounter' };
      }
    }

    const consent = await this.consentRepo.findOne({
      where: [
        {
          nuhi: patientNuhi,
          granteeType: 'provider',
          granteeId: actorProviderId ?? '',
          revokedAt: IsNull(),
        },
        {
          nuhi: patientNuhi,
          granteeType: 'facility',
          granteeId: actorFacilityId ?? '',
          revokedAt: IsNull(),
        },
      ],
    });

    if (consent) {
      if (consent.validTo && new Date(consent.validTo) < new Date()) {
        return { permitted: false, reason: 'consent_expired' };
      }
      if (consent.scope.includes(resourceType) || consent.scope.includes('*')) {
        return { permitted: true, reason: 'consent_granted' };
      }
    }

    const breakGlassKey = `${actorId}:${patientNuhi}`;
    const override = this.breakGlassOverrides.get(breakGlassKey);
    if (override && override.expiresAt > new Date()) {
      return { permitted: true, reason: 'break_glass' };
    }

    return { permitted: false, reason: 'no_consent' };
  }

  async breakGlass(actorId: string, actorRole: string, patientNuhi: string, reason: string): Promise<BreakGlassRecord> {
    const allowedRoles = ['medical_officer', 'national_admin'];
    if (!allowedRoles.includes(actorRole)) {
      throw new ForbiddenException('Only Medical Officers and National Admins can trigger break-glass');
    }

    if (!reason || reason.trim().length < 10) {
      throw new BadRequestException('Break-glass reason must be at least 10 characters');
    }

    const record: BreakGlassRecord = {
      actorId,
      patientNuhi,
      reason,
      grantedAt: new Date(),
      expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours
    };

    const key = `${actorId}:${patientNuhi}`;
    this.breakGlassOverrides.set(key, record);

    await this.auditService.create({
      actorId,
      actorRole,
      actorFacilityId: null,
      action: AuditAction.EMERGENCY_OVERRIDE,
      outcome: 'success',
      resourceType: 'Patient',
      resourceId: patientNuhi,
      patientNuhi,
      metadata: { reason, expiresAt: record.expiresAt.toISOString() },
    });

    this.eventEmitter.emit('break-glass.triggered', {
      actorId,
      patientNuhi,
      reason,
      grantedAt: record.grantedAt,
    });

    return record;
  }

  private async hasActiveEncounterLink(
    providerId: string,
    facilityId: string,
    patientNuhi: string,
  ): Promise<boolean> {
    const result = await this.consentRepo.manager.query(
      `SELECT 1 FROM encounters
       WHERE nuhi = $1
         AND provider_id = $2
         AND facility_id = $3
         AND status IN ('open', 'in_progress')
       LIMIT 1`,
      [patientNuhi, providerId, facilityId],
    );
    return result.length > 0;
  }
}
