import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';
import { ConsentPurpose } from '@nuhiris/shared-types';

@Entity('consents')
export class Consent {
  @PrimaryGeneratedColumn('uuid', { name: 'consent_id' })
  consentId!: string;

  /** FK -> patients.nuhi */
  @Column({ name: 'nuhi', type: 'uuid' })
  nuhi!: string;

  /** FK -> user_accounts.account_id */
  @Column({ name: 'grantor_id', type: 'uuid' })
  grantorId!: string;

  @Column({
    name: 'grantee_type',
    type: 'varchar',
  })
  granteeType!: 'provider' | 'facility' | 'role';

  @Column({ name: 'grantee_id', type: 'uuid' })
  granteeId!: string;

  @Column({
    name: 'purpose',
    type: 'enum',
    enum: ConsentPurpose,
  })
  purpose!: ConsentPurpose;

  @Column('text', { name: 'scope', array: true })
  scope!: string[];

  @Column({
    name: 'valid_from',
    type: 'timestamptz',
    default: () => 'NOW()',
  })
  validFrom!: Date;

  @Column({ name: 'valid_to', type: 'timestamptz', nullable: true })
  validTo!: Date | null;

  @Column({ name: 'revoked_at', type: 'timestamptz', nullable: true })
  revokedAt!: Date | null;

  @Column({ name: 'revocation_reason', type: 'varchar', nullable: true })
  revocationReason!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
