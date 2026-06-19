import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('diagnoses')
export class Diagnosis {
  @PrimaryGeneratedColumn('uuid', { name: 'diagnosis_id' })
  diagnosisId!: string;

  /** FK -> encounters.encounter_id */
  @Column({ name: 'encounter_id', type: 'uuid' })
  encounterId!: string;

  @Column({ name: 'icd11_code', type: 'varchar' })
  icd11Code!: string;

  @Column({ name: 'description', type: 'varchar', nullable: true })
  description!: string | null;

  @Column({ name: 'onset_date', type: 'date', nullable: true })
  onsetDate!: string | null;

  @Column({ name: 'status', type: 'varchar', nullable: true })
  status!: string | null;

  @Column({ name: 'severity', type: 'varchar', nullable: true })
  severity!: string | null;

  @Column({ name: 'version', type: 'integer', default: 1 })
  version!: number;

  @Column({ name: 'is_current', type: 'boolean', default: true })
  isCurrent!: boolean;

  /** FK -> providers.provider_id */
  @Column({ name: 'created_by', type: 'uuid' })
  createdBy!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
