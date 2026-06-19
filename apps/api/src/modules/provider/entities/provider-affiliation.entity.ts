import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';
import { EmploymentType } from '@nuhiris/shared-types';

@Entity('provider_affiliations')
export class ProviderAffiliation {
  @PrimaryGeneratedColumn('uuid', { name: 'affiliation_id' })
  affiliationId!: string;

  /** FK -> providers.provider_id */
  @Column({ name: 'provider_id', type: 'uuid' })
  providerId!: string;

  /** FK -> facilities.facility_id */
  @Column({ name: 'facility_id', type: 'uuid' })
  facilityId!: string;

  @Column({
    name: 'employment_type',
    type: 'enum',
    enum: EmploymentType,
  })
  employmentType!: EmploymentType;

  @Column({ name: 'start_date', type: 'date' })
  startDate!: string;

  @Column({ name: 'end_date', type: 'date', nullable: true })
  endDate!: string | null;

  @Column({
    name: 'status',
    type: 'varchar',
    default: 'active',
  })
  status!: 'active' | 'inactive';

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
