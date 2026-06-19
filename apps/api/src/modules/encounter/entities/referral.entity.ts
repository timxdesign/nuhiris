import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
} from 'typeorm';

@Entity('referrals')
export class Referral {
  @PrimaryGeneratedColumn('uuid', { name: 'referral_id' })
  referralId!: string;

  /** FK -> encounters.encounter_id */
  @Column({ name: 'encounter_id', type: 'uuid' })
  encounterId!: string;

  /** FK -> providers.provider_id */
  @Column({ name: 'referring_provider_id', type: 'uuid' })
  referringProviderId!: string;

  /** FK -> facilities.facility_id */
  @Column({ name: 'receiving_facility_id', type: 'uuid' })
  receivingFacilityId!: string;

  /** FK -> providers.provider_id */
  @Column({ name: 'receiving_provider_id', type: 'uuid', nullable: true })
  receivingProviderId!: string | null;

  @Column({
    name: 'urgency',
    type: 'varchar',
    default: 'routine',
  })
  urgency!: string;

  @Column({ name: 'reason', type: 'text' })
  reason!: string;

  @Column({ name: 'clinical_summary', type: 'text', nullable: true })
  clinicalSummary!: string | null;

  @Column({
    name: 'status',
    type: 'varchar',
    default: 'pending',
  })
  status!: string;

  @Column({
    name: 'referred_at',
    type: 'timestamptz',
    default: () => 'NOW()',
  })
  referredAt!: Date;

  @Column({ name: 'accepted_at', type: 'timestamptz', nullable: true })
  acceptedAt!: Date | null;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt!: Date | null;
}
