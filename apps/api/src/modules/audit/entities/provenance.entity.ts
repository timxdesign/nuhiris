import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
} from 'typeorm';

@Entity('provenance')
export class Provenance {
  @PrimaryGeneratedColumn('uuid', { name: 'prov_id' })
  provId!: string;

  @Column({ name: 'resource_type', type: 'varchar' })
  resourceType!: string;

  @Column({ name: 'resource_id', type: 'uuid' })
  resourceId!: string;

  /** FK -> providers.provider_id */
  @Column({ name: 'author_id', type: 'uuid' })
  authorId!: string;

  @Column({ name: 'source_system', type: 'varchar', nullable: true })
  sourceSystem!: string | null;

  @Column({
    name: 'recorded_at',
    type: 'timestamptz',
    default: () => 'NOW()',
  })
  recordedAt!: Date;

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes!: string | null;
}
