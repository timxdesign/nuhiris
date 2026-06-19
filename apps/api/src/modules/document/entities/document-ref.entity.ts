import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
} from 'typeorm';

@Entity('document_refs')
export class DocumentRef {
  @PrimaryGeneratedColumn('uuid', { name: 'doc_id' })
  docId!: string;

  /** FK -> encounters.encounter_id */
  @Column({ name: 'encounter_id', type: 'uuid', nullable: true })
  encounterId!: string | null;

  /** FK -> patients.nuhi */
  @Column({ name: 'nuhi', type: 'uuid' })
  nuhi!: string;

  @Column({ name: 'doc_type', type: 'varchar' })
  docType!: string;

  @Column({ name: 'storage_url', type: 'varchar' })
  storageUrl!: string;

  @Column({ name: 'content_hash', type: 'varchar' })
  contentHash!: string;

  @Column({ name: 'mime_type', type: 'varchar' })
  mimeType!: string;

  @Column({ name: 'file_size_bytes', type: 'integer', nullable: true })
  fileSizeBytes!: number | null;

  /** FK -> user_accounts.account_id */
  @Column({ name: 'uploaded_by', type: 'uuid' })
  uploadedBy!: string;

  @Column({
    name: 'uploaded_at',
    type: 'timestamptz',
    default: () => 'NOW()',
  })
  uploadedAt!: Date;
}
