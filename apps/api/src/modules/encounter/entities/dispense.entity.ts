import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
} from 'typeorm';

@Entity('dispenses')
export class Dispense {
  @PrimaryGeneratedColumn('uuid', { name: 'dispense_id' })
  dispenseId!: string;

  /** FK -> prescriptions.prescription_id */
  @Column({ name: 'prescription_id', type: 'uuid' })
  prescriptionId!: string;

  /** FK -> providers.provider_id */
  @Column({ name: 'pharmacist_id', type: 'uuid' })
  pharmacistId!: string;

  /** FK -> facilities.facility_id */
  @Column({ name: 'facility_id', type: 'uuid' })
  facilityId!: string;

  @Column({ name: 'quantity', type: 'varchar' })
  quantity!: string;

  @Column({
    name: 'dispensed_at',
    type: 'timestamptz',
    default: () => 'NOW()',
  })
  dispensedAt!: Date;

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes!: string | null;
}
