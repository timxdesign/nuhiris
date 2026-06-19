import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';
import { EncounterType, EncounterStatus } from '@nuhiris/shared-types';

/**
 * Maps to the `encounters` parent table.
 * In production this table is partitioned by range on `date_time`.
 */
@Entity('encounters')
export class Encounter {
  @PrimaryGeneratedColumn('uuid', { name: 'encounter_id' })
  encounterId!: string;

  /** FK -> patients.nuhi */
  @Column({ name: 'nuhi', type: 'uuid' })
  nuhi!: string;

  /** FK -> providers.provider_id */
  @Column({ name: 'provider_id', type: 'uuid' })
  providerId!: string;

  /** FK -> facilities.facility_id */
  @Column({ name: 'facility_id', type: 'uuid' })
  facilityId!: string;

  @Column({
    name: 'encounter_type',
    type: 'enum',
    enum: EncounterType,
  })
  encounterType!: EncounterType;

  @Column({
    name: 'status',
    type: 'enum',
    enum: EncounterStatus,
    default: EncounterStatus.OPEN,
  })
  status!: EncounterStatus;

  @Column({ name: 'reason', type: 'varchar', nullable: true })
  reason!: string | null;

  @Column({
    name: 'date_time',
    type: 'timestamptz',
    default: () => 'NOW()',
  })
  dateTime!: Date;

  @Column({ name: 'closed_at', type: 'timestamptz', nullable: true })
  closedAt!: Date | null;

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
