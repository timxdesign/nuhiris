import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
} from 'typeorm';
import { AuditAction } from '@nuhiris/shared-types';

/**
 * Maps to the `audit_events` parent table.
 * In production this table is partitioned by range on `timestamp`.
 * No UpdateDateColumn -- audit rows are immutable.
 */
@Entity('audit_events')
export class AuditEvent {
  @PrimaryGeneratedColumn('uuid', { name: 'event_id' })
  eventId!: string;

  @Column({ name: 'actor_id', type: 'uuid', nullable: true })
  actorId!: string | null;

  @Column({ name: 'actor_role', type: 'varchar', nullable: true })
  actorRole!: string | null;

  @Column({ name: 'actor_facility_id', type: 'uuid', nullable: true })
  actorFacilityId!: string | null;

  @Column({ name: 'resource_type', type: 'varchar', nullable: true })
  resourceType!: string | null;

  @Column({ name: 'resource_id', type: 'uuid', nullable: true })
  resourceId!: string | null;

  @Column({
    name: 'action',
    type: 'enum',
    enum: AuditAction,
  })
  action!: AuditAction;

  @Column({ name: 'outcome', type: 'varchar' })
  outcome!: string;

  @Column({ name: 'failure_reason', type: 'varchar', nullable: true })
  failureReason!: string | null;

  @Column({ name: 'patient_nuhi', type: 'uuid', nullable: true })
  patientNuhi!: string | null;

  @Column({ name: 'pathway', type: 'varchar', nullable: true })
  pathway!: string | null;

  @Column({ name: 'ip_address', type: 'varchar', nullable: true })
  ipAddress!: string | null;

  @Column({ name: 'user_agent', type: 'varchar', nullable: true })
  userAgent!: string | null;

  @Column({ name: 'session_id', type: 'varchar', nullable: true })
  sessionId!: string | null;

  @Column({
    name: 'timestamp',
    type: 'timestamptz',
    default: () => 'NOW()',
  })
  timestamp!: Date;

  @Column({ name: 'metadata', type: 'jsonb', nullable: true })
  metadata!: Record<string, unknown> | null;
}
