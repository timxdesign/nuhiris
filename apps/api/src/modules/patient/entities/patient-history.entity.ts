import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
} from 'typeorm';

@Entity('patient_history')
export class PatientHistory {
  @PrimaryGeneratedColumn('uuid', { name: 'history_id' })
  historyId!: string;

  /** FK -> patients.nuhi */
  @Column({ name: 'nuhi', type: 'uuid' })
  nuhi!: string;

  /** FK -> user_accounts.account_id */
  @Column({ name: 'changed_by', type: 'uuid' })
  changedBy!: string;

  @Column({
    name: 'changed_at',
    type: 'timestamptz',
    default: () => 'NOW()',
  })
  changedAt!: Date;

  @Column({ name: 'field_name', type: 'varchar' })
  fieldName!: string;

  @Column({ name: 'old_value', type: 'varchar', nullable: true })
  oldValue!: string | null;

  @Column({ name: 'new_value', type: 'varchar', nullable: true })
  newValue!: string | null;

  @Column({ name: 'change_reason', type: 'varchar', nullable: true })
  changeReason!: string | null;
}
