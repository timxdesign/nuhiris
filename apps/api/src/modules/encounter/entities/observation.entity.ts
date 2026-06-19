import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('observations')
export class Observation {
  @PrimaryGeneratedColumn('uuid', { name: 'observation_id' })
  observationId!: string;

  /** FK -> encounters.encounter_id */
  @Column({ name: 'encounter_id', type: 'uuid' })
  encounterId!: string;

  @Column({ name: 'loinc_code', type: 'varchar' })
  loincCode!: string;

  @Column({ name: 'display', type: 'varchar', nullable: true })
  display!: string | null;

  @Column({
    name: 'value_quantity',
    type: 'decimal',
    nullable: true,
  })
  valueQuantity!: string | null;

  @Column({ name: 'value_unit', type: 'varchar', nullable: true })
  valueUnit!: string | null;

  @Column({ name: 'value_string', type: 'varchar', nullable: true })
  valueString!: string | null;

  @Column({ name: 'value_codeable', type: 'varchar', nullable: true })
  valueCodeable!: string | null;

  @Column({ name: 'reference_range', type: 'varchar', nullable: true })
  referenceRange!: string | null;

  @Column({ name: 'interpretation', type: 'varchar', nullable: true })
  interpretation!: string | null;

  @Column({ name: 'status', type: 'varchar', nullable: true })
  status!: string | null;

  @Column({ name: 'effective_dt', type: 'timestamptz', nullable: true })
  effectiveDt!: Date | null;

  /** FK -> providers.provider_id */
  @Column({ name: 'created_by', type: 'uuid' })
  createdBy!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
