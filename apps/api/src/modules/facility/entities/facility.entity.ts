import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  FacilityType,
  LevelOfCare,
  OwnershipType,
  AccreditationStatus,
} from '@nuhiris/shared-types';

@Entity('facilities')
export class Facility {
  @PrimaryGeneratedColumn('uuid', { name: 'facility_id' })
  facilityId!: string;

  @Column({ name: 'name', type: 'varchar' })
  name!: string;

  @Column({ name: 'short_name', type: 'varchar', nullable: true })
  shortName!: string | null;

  @Column({
    name: 'type',
    type: 'enum',
    enum: FacilityType,
  })
  type!: FacilityType;

  @Column({
    name: 'level_of_care',
    type: 'enum',
    enum: LevelOfCare,
  })
  levelOfCare!: LevelOfCare;

  @Column({
    name: 'ownership',
    type: 'enum',
    enum: OwnershipType,
  })
  ownership!: OwnershipType;

  @Column({ name: 'state', type: 'varchar' })
  state!: string;

  @Column({ name: 'lga', type: 'varchar', nullable: true })
  lga!: string | null;

  @Column({ name: 'address', type: 'varchar', nullable: true })
  address!: string | null;

  @Column({
    name: 'latitude',
    type: 'decimal',
    precision: 10,
    scale: 7,
    nullable: true,
  })
  latitude!: string | null;

  @Column({
    name: 'longitude',
    type: 'decimal',
    precision: 10,
    scale: 7,
    nullable: true,
  })
  longitude!: string | null;

  @Column({ name: 'contact_phone', type: 'varchar', nullable: true })
  contactPhone!: string | null;

  @Column({ name: 'contact_email', type: 'varchar', nullable: true })
  contactEmail!: string | null;

  @Column({
    name: 'accreditation_status',
    type: 'enum',
    enum: AccreditationStatus,
    default: AccreditationStatus.PENDING,
  })
  accreditationStatus!: AccreditationStatus;

  @Column({ name: 'accreditation_expiry', type: 'date', nullable: true })
  accreditationExpiry!: string | null;

  @Column({
    name: 'operational_status',
    type: 'varchar',
    default: 'operational',
  })
  operationalStatus!: 'operational' | 'closed' | 'suspended';

  @Column({ name: 'closure_date', type: 'date', nullable: true })
  closureDate!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
