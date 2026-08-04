import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, FindOptionsWhere } from 'typeorm';
import { Consent } from './entities/consent.entity';
import { UserAccount } from '../auth/entities/user-account.entity';
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
    @InjectRepository(UserAccount)
    private userRepo: Repository<UserAccount>,
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

    // A patient always has access to their own record — no consent needed to
    // read what is already yours.
    if (actorRoles.includes('patient')) {
      const account = await this.userRepo.findOne({
        where: { accountId: actorId },
        select: { accountId: true, patientNuhi: true },
      });
      if (account?.patientNuhi === patientNuhi) {
        return { permitted: true, reason: 'self_access' };
      }
      return { permitted: false, reason: 'not_own_record' };
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

    // Only match on identifiers the actor actually has — grantee_id is a uuid
    // column, so coercing a missing id to '' makes Postgres reject the query.
    const granteeConditions: FindOptionsWhere<Consent>[] = [];
    if (actorProviderId) {
      granteeConditions.push({
        nuhi: patientNuhi,
        granteeType: 'provider',
        granteeId: actorProviderId,
        revokedAt: IsNull(),
      });
    }
    if (actorFacilityId) {
      granteeConditions.push({
        nuhi: patientNuhi,
        granteeType: 'facility',
        granteeId: actorFacilityId,
        revokedAt: IsNull(),
      });
    }

    const consent =
      granteeConditions.length > 0
        ? await this.consentRepo.findOne({ where: granteeConditions })
        : null;

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
