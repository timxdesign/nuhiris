import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
} from 'typeorm';

@Entity('lab_orders')
export class LabOrder {
  @PrimaryGeneratedColumn('uuid', { name: 'order_id' })
  orderId!: string;

  /** FK -> encounters.encounter_id */
  @Column({ name: 'encounter_id', type: 'uuid' })
  encounterId!: string;

  /** FK -> providers.provider_id */
  @Column({ name: 'ordered_by', type: 'uuid' })
  orderedBy!: string;

  @Column({ name: 'loinc_code', type: 'varchar' })
  loincCode!: string;

  @Column({ name: 'test_name', type: 'varchar' })
  testName!: string;

  @Column({
    name: 'urgency',
    type: 'varchar',
    default: 'routine',
  })
  urgency!: string;

  @Column({
    name: 'status',
    type: 'varchar',
    default: 'pending',
  })
  status!: string;

  @Column({
    name: 'ordered_at',
    type: 'timestamptz',
    default: () => 'NOW()',
  })
  orderedAt!: Date;
}
