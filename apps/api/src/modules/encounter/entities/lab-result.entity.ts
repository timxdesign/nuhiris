import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
} from 'typeorm';

@Entity('lab_results')
export class LabResult {
  @PrimaryGeneratedColumn('uuid', { name: 'result_id' })
  resultId!: string;

  /** FK -> lab_orders.order_id */
  @Column({ name: 'order_id', type: 'uuid' })
  orderId!: string;

  /** FK -> providers.provider_id */
  @Column({ name: 'performed_by', type: 'uuid' })
  performedBy!: string;

  /** FK -> facilities.facility_id */
  @Column({ name: 'facility_id', type: 'uuid' })
  facilityId!: string;

  @Column({ name: 'result_value', type: 'varchar', nullable: true })
  resultValue!: string | null;

  @Column({ name: 'result_unit', type: 'varchar', nullable: true })
  resultUnit!: string | null;

  @Column({ name: 'reference_range', type: 'varchar', nullable: true })
  referenceRange!: string | null;

  @Column({ name: 'interpretation', type: 'varchar', nullable: true })
  interpretation!: string | null;

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes!: string | null;

  @Column({
    name: 'resulted_at',
    type: 'timestamptz',
    default: () => 'NOW()',
  })
  resultedAt!: Date;

  /** FK -> document_refs.doc_id */
  @Column({ name: 'report_doc_id', type: 'uuid', nullable: true })
  reportDocId!: string | null;
}
