import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';
import { UserRole } from '@nuhiris/shared-types';

@Entity('user_accounts')
export class UserAccount {
  @PrimaryGeneratedColumn('uuid', { name: 'account_id' })
  accountId!: string;

  @Column({ name: 'username', type: 'varchar', unique: true })
  username!: string;

  @Column({ name: 'email', type: 'varchar', unique: true })
  email!: string;

  @Column({ name: 'password_hash', type: 'varchar' })
  passwordHash!: string;

  @Column({
    name: 'role',
    type: 'enum',
    enum: UserRole,
  })
  role!: UserRole;

  @Column({ name: 'mfa_enabled', type: 'boolean', default: false })
  mfaEnabled!: boolean;

  @Column({ name: 'mfa_secret', type: 'varchar', nullable: true })
  mfaSecret!: string | null;

  @Column({
    name: 'mfa_type',
    type: 'varchar',
    nullable: true,
  })
  mfaType!: 'totp' | 'fido2' | 'sms' | null;

  /** FK -> providers.provider_id */
  @Column({ name: 'provider_id', type: 'uuid', nullable: true })
  providerId!: string | null;

  /** FK -> facilities.facility_id */
  @Column({ name: 'facility_id', type: 'uuid', nullable: true })
  facilityId!: string | null;

  @Column({
    name: 'status',
    type: 'varchar',
    default: 'active',
  })
  status!: 'active' | 'locked' | 'deactivated';

  @Column({ name: 'last_login_at', type: 'timestamptz', nullable: true })
  lastLoginAt!: Date | null;

  @Column({ name: 'failed_attempts', type: 'integer', default: 0 })
  failedAttempts!: number;

  @Column({ name: 'locked_until', type: 'timestamptz', nullable: true })
  lockedUntil!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
