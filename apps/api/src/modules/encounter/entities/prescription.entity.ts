import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('prescriptions')
export class Prescription {
  @PrimaryGeneratedColumn('uuid', { name: 'prescription_id' })
  prescriptionId!: string;

  /** FK -> encounters.encounter_id */
  @Column({ name: 'encounter_id', type: 'uuid' })
  encounterId!: string;

  /** FK -> providers.provider_id */
  @Column({ name: 'prescriber_id', type: 'uuid' })
  prescriberId!: string;

  @Column({ name: 'drug_code', type: 'varchar' })
  drugCode!: string;

  @Column({ name: 'drug_name', type: 'varchar' })
  drugName!: string;

  @Column({ name: 'dosage', type: 'varchar' })
  dosage!: string;

  @Column({ name: 'frequency', type: 'varchar' })
  frequency!: string;

  @Column({ name: 'duration', type: 'varchar', nullable: true })
  duration!: string | null;

  @Column({ name: 'route', type: 'varchar', nullable: true })
  route!: string | null;

  @Column({ name: 'quantity', type: 'varchar', nullable: true })
  quantity!: string | null;

  @Column({ name: 'instructions', type: 'text', nullable: true })
  instructions!: string | null;

  @Column({
    name: 'status',
    type: 'varchar',
    default: 'active',
  })
  status!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
