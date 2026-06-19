import { AuditAction } from '../enums';

export interface IAuditEvent {
  eventId: string;
  actorId: string | null;
  actorRole: string | null;
  actorFacilityId: string | null;
  resourceType: string | null;
  resourceId: string | null;
  action: AuditAction;
  outcome: 'success' | 'failure';
  failureReason: string | null;
  patientNuhi: string | null;
  pathway: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  sessionId: string | null;
  timestamp: string;
  metadata: Record<string, unknown> | null;
}
