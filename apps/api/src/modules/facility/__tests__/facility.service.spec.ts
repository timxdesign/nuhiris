import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { FacilityService } from '../facility.service';
import { Facility } from '../entities/facility.entity';
import { ProviderAffiliation } from '../../provider/entities/provider-affiliation.entity';
import { Encounter } from '../../encounter/entities/encounter.entity';
import { FacilityType, LevelOfCare, OwnershipType, AccreditationStatus } from '@nuhiris/shared-types';

const mockFacility: Facility = {
  facilityId: 'fac-1',
  name: 'Lagos General Hospital',
  shortName: 'LGH',
  type: FacilityType.HOSPITAL,
  levelOfCare: LevelOfCare.TERTIARY,
  ownership: OwnershipType.STATE,
  state: 'Lagos',
  lga: 'Ikeja',
  address: '1 Hospital Road',
  latitude: '6.5244',
  longitude: '3.3792',
  contactPhone: '+2341234567',
  contactEmail: 'info@lgh.ng',
  accreditationStatus: AccreditationStatus.ACCREDITED,
  accreditationExpiry: '2027-12-31',
  operationalStatus: 'operational',
  closureDate: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('FacilityService', () => {
  let service: FacilityService;
  let facilityRepo: { findOne: jest.Mock; create: jest.Mock; save: jest.Mock; createQueryBuilder: jest.Mock };
  let affiliationRepo: { find: jest.Mock; count: jest.Mock };
  let encounterRepo: { count: jest.Mock };

  beforeEach(async () => {
    facilityRepo = {
      findOne: jest.fn(),
      create: jest.fn().mockReturnValue(mockFacility),
      save: jest.fn().mockResolvedValue(mockFacility),
      createQueryBuilder: jest.fn().mockReturnValue({
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockFacility], 1]),
      }),
    };

    affiliationRepo = {
      find: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(5),
    };

    encounterRepo = {
      count: jest.fn().mockResolvedValue(100),
    };

    const module = await Test.createTestingModule({
      providers: [
        FacilityService,
        { provide: getRepositoryToken(Facility), useValue: facilityRepo },
        { provide: getRepositoryToken(ProviderAffiliation), useValue: affiliationRepo },
        { provide: getRepositoryToken(Encounter), useValue: encounterRepo },
      ],
    }).compile();

    service = module.get(FacilityService);
  });

  describe('create', () => {
    it('creates a facility', async () => {
      const result = await service.create({
        name: 'Lagos General Hospital',
        type: FacilityType.HOSPITAL,
        levelOfCare: LevelOfCare.TERTIARY,
        ownership: OwnershipType.STATE,
        state: 'Lagos',
      });
      expect(result).toEqual(mockFacility);
    });
  });

  describe('findById', () => {
    it('returns facility when found', async () => {
      facilityRepo.findOne.mockResolvedValue(mockFacility);
      expect(await service.findById('fac-1')).toEqual(mockFacility);
    });

    it('throws NotFoundException', async () => {
      facilityRepo.findOne.mockResolvedValue(null);
      await expect(service.findById('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getStats', () => {
    it('returns facility statistics', async () => {
      facilityRepo.findOne.mockResolvedValue(mockFacility);
      encounterRepo.count.mockResolvedValueOnce(100).mockResolvedValueOnce(10);
      affiliationRepo.count.mockResolvedValue(5);

      const stats = await service.getStats('fac-1');
      expect(stats.totalEncounters).toBe(100);
      expect(stats.activeProviders).toBe(5);
    });
  });

  describe('validateAccreditation', () => {
    it('returns true for valid accredited facility', async () => {
      facilityRepo.findOne.mockResolvedValue(mockFacility);
      expect(await service.validateAccreditation('fac-1')).toBe(true);
    });

    it('returns false for pending accreditation', async () => {
      facilityRepo.findOne.mockResolvedValue({
        ...mockFacility,
        accreditationStatus: AccreditationStatus.PENDING,
      });
      expect(await service.validateAccreditation('fac-1')).toBe(false);
    });
  });

  describe('search', () => {
    it('returns paginated results', async () => {
      const [items, total] = await service.search({ state: 'Lagos', page: 1, limit: 20 }, 1, 20);
      expect(items).toHaveLength(1);
      expect(total).toBe(1);
    });
  });
});
