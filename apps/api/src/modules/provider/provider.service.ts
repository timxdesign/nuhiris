import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Provider } from './entities/provider.entity';
import { ProviderAffiliation } from './entities/provider-affiliation.entity';
import { CreateProviderDto } from './dto/create-provider.dto';
import { UpdateProviderDto } from './dto/update-provider.dto';
import { CreateAffiliationDto } from './dto/create-affiliation.dto';
import { SearchProviderDto } from './dto/search-provider.dto';
import { VerificationStatus } from '@nuhiris/shared-types';

@Injectable()
export class ProviderService {
  constructor(
    @InjectRepository(Provider)
    private providerRepo: Repository<Provider>,
    @InjectRepository(ProviderAffiliation)
    private affiliationRepo: Repository<ProviderAffiliation>,
  ) {}

  async create(dto: CreateProviderDto): Promise<Provider> {
    if (dto.licenceNumber) {
      const existing = await this.providerRepo.findOne({
        where: { licenceNumber: dto.licenceNumber },
      });
      if (existing) {
        throw new ConflictException('Licence number already registered');
      }
    }

    const provider = this.providerRepo.create({
      fullName: dto.fullName,
      category: dto.category,
      specialty: dto.specialty ?? null,
      licenceNumber: dto.licenceNumber ?? null,
      regulatoryBody: dto.regulatoryBody ?? null,
      accountId: dto.accountId ?? null,
    });

    return this.providerRepo.save(provider);
  }

  async findById(providerId: string): Promise<Provider> {
    const provider = await this.providerRepo.findOne({ where: { providerId } });
    if (!provider) {
      throw new NotFoundException('Provider not found');
    }
    return provider;
  }

  async update(providerId: string, dto: UpdateProviderDto): Promise<Provider> {
    const provider = await this.findById(providerId);

    if (dto.fullName !== undefined) provider.fullName = dto.fullName;
    if (dto.specialty !== undefined) provider.specialty = dto.specialty;
    if (dto.licenceNumber !== undefined) {
      if (dto.licenceNumber && dto.licenceNumber !== provider.licenceNumber) {
        const existing = await this.providerRepo.findOne({
          where: { licenceNumber: dto.licenceNumber },
        });
        if (existing && existing.providerId !== providerId) {
          throw new ConflictException('Licence number already registered');
        }
      }
      provider.licenceNumber = dto.licenceNumber ?? null;
    }
    if (dto.regulatoryBody !== undefined) provider.regulatoryBody = dto.regulatoryBody ?? null;

    return this.providerRepo.save(provider);
  }

  async verify(providerId: string, source: string): Promise<Provider> {
    const provider = await this.findById(providerId);

    if (provider.verificationStatus === VerificationStatus.VERIFIED) {
      throw new BadRequestException('Provider already verified');
    }

    provider.verificationStatus = VerificationStatus.VERIFIED;
    provider.verifiedAt = new Date();
    provider.verificationSource = source;

    return this.providerRepo.save(provider);
  }

  async deactivate(providerId: string): Promise<Provider> {
    const provider = await this.findById(providerId);
    provider.status = 'deactivated';
    return this.providerRepo.save(provider);
  }

  async search(dto: SearchProviderDto, page: number, limit: number): Promise<[Provider[], number]> {
    const qb = this.providerRepo.createQueryBuilder('p');

    if (dto.fullName) {
      qb.andWhere('LOWER(p.full_name) LIKE LOWER(:name)', { name: `%${dto.fullName}%` });
    }
    if (dto.licenceNumber) {
      qb.andWhere('p.licence_number = :licence', { licence: dto.licenceNumber });
    }
    if (dto.category) {
      qb.andWhere('p.category = :category', { category: dto.category });
    }
    if (dto.specialty) {
      qb.andWhere('LOWER(p.specialty) LIKE LOWER(:spec)', { spec: `%${dto.specialty}%` });
    }

    qb.andWhere('p.status != :deactivated', { deactivated: 'deactivated' });
    qb.orderBy('p.created_at', 'DESC').skip((page - 1) * limit).take(limit);

    return qb.getManyAndCount();
  }

  async addAffiliation(providerId: string, dto: CreateAffiliationDto): Promise<ProviderAffiliation> {
    await this.findById(providerId);

    const existing = await this.affiliationRepo.findOne({
      where: {
        providerId,
        facilityId: dto.facilityId,
        status: 'active',
      },
    });
    if (existing) {
      throw new ConflictException('Active affiliation already exists for this facility');
    }

    const affiliation = this.affiliationRepo.create({
      providerId,
      facilityId: dto.facilityId,
      employmentType: dto.employmentType,
      startDate: dto.startDate,
      endDate: dto.endDate ?? null,
    });

    return this.affiliationRepo.save(affiliation);
  }

  async getAffiliations(providerId: string): Promise<ProviderAffiliation[]> {
    await this.findById(providerId);
    return this.affiliationRepo.find({
      where: { providerId },
      order: { createdAt: 'DESC' },
    });
  }

  async closeAffiliation(providerId: string, affiliationId: string): Promise<ProviderAffiliation> {
    const affiliation = await this.affiliationRepo.findOne({
      where: { affiliationId, providerId },
    });
    if (!affiliation) {
      throw new NotFoundException('Affiliation not found');
    }
    if (affiliation.status === 'inactive') {
      throw new BadRequestException('Affiliation already closed');
    }

    affiliation.status = 'inactive';
    affiliation.endDate = new Date().toISOString().split('T')[0]!;

    return this.affiliationRepo.save(affiliation);
  }
}
