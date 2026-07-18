import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes, createHash } from 'crypto';
import { OAuthClient } from './entities/oauth-client.entity';
import { RegisterClientDto } from './dto/register-client.dto';

@Injectable()
export class OAuthClientService {
  constructor(
    @InjectRepository(OAuthClient)
    private clientRepo: Repository<OAuthClient>,
  ) {}

  async register(dto: RegisterClientDto, registeredBy: string): Promise<{ client: OAuthClient; clientSecret: string }> {
    const existing = await this.clientRepo.findOne({ where: { clientName: dto.clientName } });
    if (existing) {
      throw new ConflictException(`Client "${dto.clientName}" already registered`);
    }

    const clientSecret = randomBytes(32).toString('hex');
    const clientSecretHash = createHash('sha256').update(clientSecret).digest('hex');

    const client = this.clientRepo.create({
      clientName: dto.clientName,
      clientSecretHash,
      organizationName: dto.organizationName,
      contactEmail: dto.contactEmail,
      scopes: dto.scopes,
      redirectUris: dto.redirectUris ?? [],
      grantTypes: dto.grantTypes ?? ['client_credentials'],
      rateLimit: dto.rateLimit ?? 1000,
      registeredBy,
    });

    const saved = await this.clientRepo.save(client);
    return { client: saved, clientSecret };
  }

  async findById(clientId: string): Promise<OAuthClient> {
    const client = await this.clientRepo.findOne({ where: { clientId } });
    if (!client) throw new NotFoundException(`Client ${clientId} not found`);
    return client;
  }

  async findAll(): Promise<OAuthClient[]> {
    return this.clientRepo.find({ order: { createdAt: 'DESC' } });
  }

  async validateCredentials(clientId: string, clientSecret: string): Promise<OAuthClient | null> {
    const client = await this.clientRepo.findOne({ where: { clientId, status: 'active' } });
    if (!client) return null;

    const hash = createHash('sha256').update(clientSecret).digest('hex');
    if (hash !== client.clientSecretHash) return null;

    return client;
  }

  async rotateSecret(clientId: string): Promise<{ client: OAuthClient; clientSecret: string }> {
    const client = await this.findById(clientId);
    const clientSecret = randomBytes(32).toString('hex');
    client.clientSecretHash = createHash('sha256').update(clientSecret).digest('hex');
    const saved = await this.clientRepo.save(client);
    return { client: saved, clientSecret };
  }

  async updateScopes(clientId: string, scopes: string[]): Promise<OAuthClient> {
    const client = await this.findById(clientId);
    client.scopes = scopes;
    return this.clientRepo.save(client);
  }

  async deactivate(clientId: string): Promise<OAuthClient> {
    const client = await this.findById(clientId);
    client.status = 'revoked';
    return this.clientRepo.save(client);
  }
}
