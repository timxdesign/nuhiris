import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('oauth_clients')
export class OAuthClient {
  @PrimaryGeneratedColumn('uuid', { name: 'client_id' })
  clientId!: string;

  @Column({ name: 'client_name', type: 'varchar' })
  clientName!: string;

  @Column({ name: 'client_secret_hash', type: 'varchar' })
  clientSecretHash!: string;

  @Column({ name: 'organization_name', type: 'varchar' })
  organizationName!: string;

  @Column({ name: 'contact_email', type: 'varchar' })
  contactEmail!: string;

  @Column('text', { name: 'scopes', array: true, default: '{}' })
  scopes!: string[];

  @Column('text', { name: 'redirect_uris', array: true, default: '{}' })
  redirectUris!: string[];

  @Column({
    name: 'grant_types',
    type: 'text',
    array: true,
    default: "'{client_credentials}'",
  })
  grantTypes!: string[];

  @Column({ name: 'status', type: 'varchar', default: 'active' })
  status!: string;

  @Column({ name: 'rate_limit', type: 'integer', default: 1000 })
  rateLimit!: number;

  @Column({ name: 'registered_by', type: 'uuid' })
  registeredBy!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
