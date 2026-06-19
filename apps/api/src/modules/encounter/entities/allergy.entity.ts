import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
} from 'typeorm';

@Entity('allergies')
export class Allergy {
  @PrimaryGeneratedColumn('uuid', { name: 'allergy_id' })
  allergyId!: string;

  /** FK -> patients.nuhi */
  @Column({ name: 'nuhi', type: 'uuid' })
  nuhi!: string;

  /** FK -> encounters.encounter_id */
  @Column({ name: 'encounter_id', type: 'uuid', nullable: true })
  encounterId!: string | null;

  @Column({ name: 'substance_code', type: 'varchar', nullable: true })
  substanceCode!: string | null;

  @Column({ name: 'substance_name', type: 'varchar' })
  substanceName!: string;

  @Column({ name: 'reaction', type: 'varchar', nullable: true })
  reaction!: string | null;

  @Column({ name: 'severity', type: 'varchar', nullable: true })
  severity!: string | null;

  @Column({
    name: 'status',
    type: 'varchar',
    default: 'active',
  })
  status!: string;

  /** FK -> providers.provider_id */
  @Column({ name: 'recorded_by', type: 'uuid' })
  recordedBy!: string;

  @Column({
    name: 'recorded_at',
    type: 'timestamptz',
    default: () => 'NOW()',
  })
  recordedAt!: Date;
}
