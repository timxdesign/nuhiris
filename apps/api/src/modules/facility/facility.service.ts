import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Facility } from './entities/facility.entity';
import { CreateFacilityDto } from './dto/create-facility.dto';
import { UpdateFacilityDto } from './dto/update-facility.dto';
import { SearchFacilityDto } from './dto/search-facility.dto';
import { ProviderAffiliation } from '../provider/entities/provider-affiliation.entity';
import { Encounter } from '../encounter/entities/encounter.entity';

@Injectable()
export class FacilityService {
  constructor(
    @InjectRepository(Facility)
    private facilityRepo: Repository<Facility>,
    @InjectRepository(ProviderAffiliation)
    private affiliationRepo: Repository<ProviderAffiliation>,
    @InjectRepository(Encounter)
    private encounterRepo: Repository<Encounter>,
  ) {}

  async create(dto: CreateFacilityDto): Promise<Facility> {
    const facility = this.facilityRepo.create({
      name: dto.name,
      shortName: dto.shortName ?? null,
      type: dto.type,
      levelOfCare: dto.levelOfCare,
      ownership: dto.ownership,
      state: dto.state,
      lga: dto.lga ?? null,
      address: dto.address ?? null,
      latitude: dto.latitude?.toString() ?? null,
      longitude: dto.longitude?.toString() ?? null,
      contactPhone: dto.contactPhone ?? null,
      contactEmail: dto.contactEmail ?? null,
    });

    return this.facilityRepo.save(facility);
  }

  async findById(facilityId: string): Promise<Facility> {
    const facility = await this.facilityRepo.findOne({ where: { facilityId } });
    if (!facility) {
      throw new NotFoundException('Facility not found');
    }
    return facility;
  }

  async update(facilityId: string, dto: UpdateFacilityDto): Promise<Facility> {
    const facility = await this.findById(facilityId);

    if (dto.name !== undefined) facility.name = dto.name;
    if (dto.shortName !== undefined) facility.shortName = dto.shortName;
    if (dto.address !== undefined) facility.address = dto.address;
    if (dto.latitude !== undefined) facility.latitude = dto.latitude?.toString() ?? null;
    if (dto.longitude !== undefined) facility.longitude = dto.longitude?.toString() ?? null;
    if (dto.contactPhone !== undefined) facility.contactPhone = dto.contactPhone;
    if (dto.contactEmail !== undefined) facility.contactEmail = dto.contactEmail;
    if (dto.accreditationStatus !== undefined) facility.accreditationStatus = dto.accreditationStatus;
    if (dto.accreditationExpiry !== undefined) facility.accreditationExpiry = dto.accreditationExpiry;
    if (dto.operationalStatus !== undefined) {
      facility.operationalStatus = dto.operationalStatus;
      if (dto.operationalStatus === 'closed') {
        facility.closureDate = new Date().toISOString().split('T')[0]!;
      }
    }

    return this.facilityRepo.save(facility);
  }

  async search(dto: SearchFacilityDto, page: number, limit: number): Promise<[Facility[], number]> {
    const qb = this.facilityRepo.createQueryBuilder('f');

    if (dto.name) {
      qb.andWhere('LOWER(f.name) LIKE LOWER(:name)', { name: `%${dto.name}%` });
    }
    if (dto.state) {
      qb.andWhere('f.state = :state', { state: dto.state });
    }
    if (dto.lga) {
      qb.andWhere('f.lga = :lga', { lga: dto.lga });
    }
    if (dto.type) {
      qb.andWhere('f.type = :type', { type: dto.type });
    }
    if (dto.levelOfCare) {
      qb.andWhere('f.level_of_care = :level', { level: dto.levelOfCare });
    }

    qb.andWhere('f.operational_status != :closed', { closed: 'closed' });
    qb.orderBy('f.name', 'ASC').skip((page - 1) * limit).take(limit);

    return qb.getManyAndCount();
  }

  async getProviders(facilityId: string): Promise<ProviderAffiliation[]> {
    await this.findById(facilityId);
    return this.affiliationRepo.find({
      where: { facilityId, status: 'active' },
      order: { createdAt: 'DESC' },
    });
  }

  async getStats(facilityId: string): Promise<{
    totalEncounters: number;
    openEncounters: number;
    activeProviders: number;
  }> {
    await this.findById(facilityId);

    const [totalEncounters, openEncounters, activeProviders] = await Promise.all([
      this.encounterRepo.count({ where: { facilityId } }),
      this.encounterRepo.count({ where: { facilityId, status: 'open' as never } }),
      this.affiliationRepo.count({ where: { facilityId, status: 'active' } }),
    ]);

    return { totalEncounters, openEncounters, activeProviders };
  }

  async validateAccreditation(facilityId: string): Promise<boolean> {
    const facility = await this.findById(facilityId);
    if (facility.accreditationStatus !== 'accredited') return false;
    if (facility.accreditationExpiry) {
      return new Date(facility.accreditationExpiry) > new Date();
    }
    return true;
  }
}
