import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';
import {
  ProviderCategory,
  VerificationStatus,
} from '@nuhiris/shared-types';

@Entity('providers')
export class Provider {
  @PrimaryGeneratedColumn('uuid', { name: 'provider_id' })
  providerId!: string;

  @Column({ name: 'full_name', type: 'varchar' })
  fullName!: string;

  @Column({
    name: 'category',
    type: 'enum',
    enum: ProviderCategory,
  })
  category!: ProviderCategory;

  @Column({ name: 'specialty', type: 'varchar', nullable: true })
  specialty!: string | null;

  @Column({
    name: 'licence_number',
    type: 'varchar',
    unique: true,
    nullable: true,
  })
  licenceNumber!: string | null;

  @Column({ name: 'regulatory_body', type: 'varchar', nullable: true })
  regulatoryBody!: string | null;

  @Column({
    name: 'verification_status',
    type: 'enum',
    enum: VerificationStatus,
    default: VerificationStatus.PENDING,
  })
  verificationStatus!: VerificationStatus;

  @Column({ name: 'verified_at', type: 'timestamptz', nullable: true })
  verifiedAt!: Date | null;

  @Column({ name: 'verification_source', type: 'varchar', nullable: true })
  verificationSource!: string | null;

  @Column({
    name: 'status',
    type: 'varchar',
    default: 'active',
  })
  status!: 'active' | 'inactive' | 'deactivated';

  /** FK -> user_accounts.account_id */
  @Column({ name: 'account_id', type: 'uuid', nullable: true })
  accountId!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
