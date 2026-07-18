import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  RegistrationType,
  PatientStatus,
} from '@nuhiris/shared-types';
import { encryptedTransformer } from '../../../common/transformers/encrypted-column.transformer';

@Entity('patients')
export class Patient {
  @PrimaryGeneratedColumn('uuid', { name: 'nuhi' })
  nuhi!: string;

  @Column({ name: 'full_name', type: 'varchar' })
  fullName!: string;

  @Column({ name: 'date_of_birth', type: 'date' })
  dateOfBirth!: string;

  @Column({
    name: 'sex',
    type: 'varchar',
  })
  sex!: 'male' | 'female' | 'intersex' | 'not_stated';

  @Column({ name: 'state', type: 'varchar' })
  state!: string;

  @Column({ name: 'lga', type: 'varchar', nullable: true })
  lga!: string | null;

  @Column({ name: 'phone', type: 'varchar', nullable: true })
  phone!: string | null;

  @Column({ name: 'email', type: 'varchar', nullable: true })
  email!: string | null;

  /** Encrypted NIN value */
  @Column({ name: 'nin', type: 'varchar', unique: true, nullable: true })
  nin!: string | null;

  /** HMAC hash of NIN for lookup */
  @Column({ name: 'nin_hash', type: 'varchar', unique: true, nullable: true })
  ninHash!: string | null;

  @Column({ name: 'nin_verified', type: 'boolean', default: false })
  ninVerified!: boolean;

  @Column({
    name: 'nin_verification_date',
    type: 'timestamptz',
    nullable: true,
  })
  ninVerificationDate!: Date | null;

  @Column({
    name: 'nin_verification_method',
    type: 'varchar',
    nullable: true,
  })
  ninVerificationMethod!: 'biometric' | 'documentary' | 'manual_review' | null;

  @Column({ name: 'nimc_photo_ref', type: 'varchar', nullable: true, transformer: encryptedTransformer })
  nimcPhotoRef!: string | null;

  @Column({
    name: 'registration_type',
    type: 'enum',
    enum: RegistrationType,
    default: RegistrationType.BIOMETRIC_VERIFIED,
  })
  registrationType!: RegistrationType;

  @Column({
    name: 'status',
    type: 'enum',
    enum: PatientStatus,
    default: PatientStatus.ACTIVE,
  })
  status!: PatientStatus;

  @Column({ name: 'provisional_deadline', type: 'date', nullable: true })
  provisionalDeadline!: string | null;

  @Column({ name: 'deceased_at', type: 'timestamptz', nullable: true })
  deceasedAt!: Date | null;

  /** Self-referencing FK -> patients.nuhi (for merged records) */
  @Column({ name: 'merged_into', type: 'uuid', nullable: true })
  mergedInto!: string | null;

  /** FK -> facilities.facility_id */
  @Column({ name: 'registration_facility_id', type: 'uuid', nullable: true })
  registrationFacilityId!: string | null;

  /** FK -> user_accounts.account_id */
  @Column({ name: 'registered_by', type: 'uuid', nullable: true })
  registeredBy!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
