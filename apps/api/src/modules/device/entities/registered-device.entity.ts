import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
} from 'typeorm';
import { DeviceType, TrustLevel } from '@nuhiris/shared-types';

@Entity('registered_devices')
export class RegisteredDevice {
  @PrimaryGeneratedColumn('uuid', { name: 'device_id' })
  deviceId!: string;

  @Column({ name: 'device_fingerprint', type: 'varchar', unique: true })
  deviceFingerprint!: string;

  @Column({ name: 'device_name', type: 'varchar', nullable: true })
  deviceName!: string | null;

  @Column({
    name: 'device_type',
    type: 'enum',
    enum: DeviceType,
  })
  deviceType!: DeviceType;

  /** FK -> facilities.facility_id */
  @Column({ name: 'facility_id', type: 'uuid', nullable: true })
  facilityId!: string | null;

  @Column({
    name: 'trust_level',
    type: 'enum',
    enum: TrustLevel,
  })
  trustLevel!: TrustLevel;

  /** FK -> user_accounts.account_id */
  @Column({ name: 'enrolled_by', type: 'uuid', nullable: true })
  enrolledBy!: string | null;

  @Column({
    name: 'enrolled_at',
    type: 'timestamptz',
    default: () => 'NOW()',
  })
  enrolledAt!: Date;

  @Column({ name: 'last_seen_at', type: 'timestamptz', nullable: true })
  lastSeenAt!: Date | null;

  @Column({
    name: 'last_seen_lat',
    type: 'decimal',
    precision: 10,
    scale: 7,
    nullable: true,
  })
  lastSeenLat!: string | null;

  @Column({
    name: 'last_seen_lng',
    type: 'decimal',
    precision: 10,
    scale: 7,
    nullable: true,
  })
  lastSeenLng!: string | null;

  @Column({
    name: 'status',
    type: 'varchar',
    default: 'active',
  })
  status!: 'active' | 'suspended' | 'revoked';

  @Column({ name: 'revoked_at', type: 'timestamptz', nullable: true })
  revokedAt!: Date | null;

  @Column({ name: 'revocation_reason', type: 'varchar', nullable: true })
  revocationReason!: string | null;
}
