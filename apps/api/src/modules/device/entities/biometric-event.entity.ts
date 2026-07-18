import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
} from 'typeorm';
import {
  BiometricEventType,
  BiometricMethod,
  BiometricResult,
} from '@nuhiris/shared-types';
import { encryptedTransformer } from '../../../common/transformers/encrypted-column.transformer';

/**
 * Maps to the `biometric_events` parent table.
 * In production this table is partitioned by range on `timestamp`.
 */
@Entity('biometric_events')
export class BiometricEvent {
  @PrimaryGeneratedColumn('uuid', { name: 'event_id' })
  eventId!: string;

  /** FK -> patients.nuhi */
  @Column({ name: 'nuhi', type: 'uuid', nullable: true })
  nuhi!: string | null;

  @Column({ name: 'nin', type: 'varchar', nullable: true, transformer: encryptedTransformer })
  nin!: string | null;

  /** FK -> registered_devices.device_id */
  @Column({ name: 'device_id', type: 'uuid', nullable: true })
  deviceId!: string | null;

  @Column({
    name: 'event_type',
    type: 'enum',
    enum: BiometricEventType,
  })
  eventType!: BiometricEventType;

  @Column({
    name: 'method',
    type: 'enum',
    enum: BiometricMethod,
  })
  method!: BiometricMethod;

  @Column({
    name: 'result',
    type: 'enum',
    enum: BiometricResult,
  })
  result!: BiometricResult;

  @Column({
    name: 'confidence_score',
    type: 'decimal',
    precision: 5,
    scale: 4,
    nullable: true,
  })
  confidenceScore!: string | null;

  @Column({ name: 'nimc_api_called', type: 'boolean', default: false })
  nimcApiCalled!: boolean;

  @Column({ name: 'nimc_reference_id', type: 'varchar', nullable: true })
  nimcReferenceId!: string | null;

  @Column({ name: 'liveness_passed', type: 'boolean', nullable: true })
  livenessPassed!: boolean | null;

  @Column({ name: 'device_attested', type: 'boolean', nullable: true })
  deviceAttested!: boolean | null;

  @Column({ name: 'geofence_passed', type: 'boolean', nullable: true })
  geofencePassed!: boolean | null;

  /** FK -> user_accounts.account_id */
  @Column({ name: 'performed_by', type: 'uuid', nullable: true })
  performedBy!: string | null;

  /** FK -> facilities.facility_id */
  @Column({ name: 'facility_id', type: 'uuid', nullable: true })
  facilityId!: string | null;

  @Column({
    name: 'timestamp',
    type: 'timestamptz',
    default: () => 'NOW()',
  })
  timestamp!: Date;
}
