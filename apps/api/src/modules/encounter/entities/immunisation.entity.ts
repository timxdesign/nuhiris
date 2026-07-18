import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('immunisations')
export class Immunisation {
  @PrimaryGeneratedColumn('uuid', { name: 'immunisation_id' })
  immunisationId!: string;

  @Column({ name: 'nuhi', type: 'uuid' })
  nuhi!: string;

  @Column({ name: 'encounter_id', type: 'uuid', nullable: true })
  encounterId!: string | null;

  @Column({ name: 'vaccine_code', type: 'varchar' })
  vaccineCode!: string;

  @Column({ name: 'vaccine_name', type: 'varchar' })
  vaccineName!: string;

  @Column({ name: 'dose_number', type: 'integer', nullable: true })
  doseNumber!: number | null;

  @Column({ name: 'lot_number', type: 'varchar', nullable: true })
  lotNumber!: string | null;

  @Column({ name: 'site', type: 'varchar', nullable: true })
  site!: string | null;

  @Column({ name: 'route', type: 'varchar', nullable: true })
  route!: string | null;

  @Column({
    name: 'administered_at',
    type: 'timestamptz',
    default: () => 'NOW()',
  })
  administeredAt!: Date;

  @Column({ name: 'administered_by', type: 'uuid' })
  administeredBy!: string;

  @Column({ name: 'facility_id', type: 'uuid' })
  facilityId!: string;

  @Column({
    name: 'status',
    type: 'varchar',
    default: 'completed',
  })
  status!: string;

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
