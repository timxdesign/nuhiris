import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { DocumentRef } from './entities/document-ref.entity';
import { createHash } from 'crypto';
import * as Minio from 'minio';

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/dicom',
  'application/dicom',
  'text/plain',
];

@Injectable()
export class DocumentService {
  private minioClient: Minio.Client;
  private bucket: string;

  constructor(
    @InjectRepository(DocumentRef)
    private documentRepo: Repository<DocumentRef>,
    private configService: ConfigService,
  ) {
    this.minioClient = new Minio.Client({
      endPoint: this.configService.get<string>('minio.endpoint')!,
      port: this.configService.get<number>('minio.port')!,
      useSSL: this.configService.get<boolean>('minio.useSSL')!,
      accessKey: this.configService.get<string>('minio.accessKey')!,
      secretKey: this.configService.get<string>('minio.secretKey')!,
    });
    this.bucket = this.configService.get<string>('minio.bucket')!;
  }

  async upload(
    file: { buffer: Buffer; mimetype: string; originalname: string; size: number },
    nuhi: string,
    encounterId: string | null,
    docType: string,
    uploadedBy: string,
  ): Promise<DocumentRef> {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(`Unsupported file type: ${file.mimetype}`);
    }

    const contentHash = createHash('sha256').update(file.buffer).digest('hex');
    const storageKey = `${nuhi}/${docType}/${Date.now()}-${file.originalname}`;

    await this.minioClient.putObject(this.bucket, storageKey, file.buffer, file.size, {
      'Content-Type': file.mimetype,
    });

    const doc = this.documentRepo.create({
      nuhi,
      encounterId,
      docType,
      storageUrl: storageKey,
      contentHash,
      mimeType: file.mimetype,
      fileSizeBytes: file.size,
      uploadedBy,
    });

    return this.documentRepo.save(doc);
  }

  async findById(docId: string): Promise<DocumentRef> {
    const doc = await this.documentRepo.findOne({ where: { docId } });
    if (!doc) {
      throw new NotFoundException('Document not found');
    }
    return doc;
  }

  async findByPatient(nuhi: string): Promise<DocumentRef[]> {
    return this.documentRepo.find({
      where: { nuhi },
      order: { uploadedAt: 'DESC' },
    });
  }

  async findByEncounter(encounterId: string): Promise<DocumentRef[]> {
    return this.documentRepo.find({
      where: { encounterId },
      order: { uploadedAt: 'DESC' },
    });
  }

  async getDownloadStream(docId: string): Promise<{ stream: NodeJS.ReadableStream; doc: DocumentRef }> {
    const doc = await this.findById(docId);
    const stream = await this.minioClient.getObject(this.bucket, doc.storageUrl);
    return { stream, doc };
  }
}
