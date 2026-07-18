import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { ProviderService } from '../provider.service';
import { Provider } from '../entities/provider.entity';
import { ProviderAffiliation } from '../entities/provider-affiliation.entity';
import { ProviderCategory, VerificationStatus, EmploymentType } from '@nuhiris/shared-types';

const mockProvider: Provider = {
  providerId: 'prov-1',
  fullName: 'Dr. Emeka Obi',
  category: ProviderCategory.DOCTOR,
  specialty: 'Internal Medicine',
  licenceNumber: 'MDCN-12345',
  regulatoryBody: 'MDCN',
  verificationStatus: VerificationStatus.PENDING,
  verifiedAt: null,
  verificationSource: null,
  status: 'active',
  accountId: null,
  createdAt: new Date(),
};

describe('ProviderService', () => {
  let service: ProviderService;
  let providerRepo: { findOne: jest.Mock; create: jest.Mock; save: jest.Mock; createQueryBuilder: jest.Mock };
  let affiliationRepo: { findOne: jest.Mock; find: jest.Mock; create: jest.Mock; save: jest.Mock; count: jest.Mock };

  beforeEach(async () => {
    providerRepo = {
      findOne: jest.fn(),
      create: jest.fn().mockReturnValue(mockProvider),
      save: jest.fn().mockResolvedValue(mockProvider),
      createQueryBuilder: jest.fn().mockReturnValue({
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockProvider], 1]),
      }),
    };

    affiliationRepo = {
      findOne: jest.fn(),
      find: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockImplementation((d) => d),
      save: jest.fn().mockImplementation((d) => Promise.resolve({ affiliationId: 'aff-1', ...d })),
      count: jest.fn().mockResolvedValue(0),
    };

    const module = await Test.createTestingModule({
      providers: [
        ProviderService,
        { provide: getRepositoryToken(Provider), useValue: providerRepo },
        { provide: getRepositoryToken(ProviderAffiliation), useValue: affiliationRepo },
      ],
    }).compile();

    service = module.get(ProviderService);
  });

  describe('create', () => {
    it('creates a provider successfully', async () => {
      providerRepo.findOne.mockResolvedValue(null);
      const result = await service.create({
        fullName: 'Dr. Emeka Obi',
        category: ProviderCategory.DOCTOR,
        licenceNumber: 'MDCN-12345',
      });
      expect(result).toEqual(mockProvider);
      expect(providerRepo.save).toHaveBeenCalled();
    });

    it('throws ConflictException for duplicate licence', async () => {
      providerRepo.findOne.mockResolvedValue(mockProvider);
      await expect(
        service.create({ fullName: 'Test', category: ProviderCategory.DOCTOR, licenceNumber: 'MDCN-12345' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findById', () => {
    it('returns provider when found', async () => {
      providerRepo.findOne.mockResolvedValue(mockProvider);
      expect(await service.findById('prov-1')).toEqual(mockProvider);
    });

    it('throws NotFoundException when not found', async () => {
      providerRepo.findOne.mockResolvedValue(null);
      await expect(service.findById('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('verify', () => {
    it('verifies a pending provider', async () => {
      providerRepo.findOne.mockResolvedValue({ ...mockProvider });
      providerRepo.save.mockImplementation((p) => Promise.resolve(p));
      const result = await service.verify('prov-1', 'MDCN API');
      expect(result.verificationStatus).toBe(VerificationStatus.VERIFIED);
      expect(result.verificationSource).toBe('MDCN API');
    });

    it('throws if already verified', async () => {
      providerRepo.findOne.mockResolvedValue({
        ...mockProvider,
        verificationStatus: VerificationStatus.VERIFIED,
      });
      await expect(service.verify('prov-1', 'MDCN API')).rejects.toThrow(BadRequestException);
    });
  });

  describe('addAffiliation', () => {
    it('creates affiliation', async () => {
      providerRepo.findOne.mockResolvedValue(mockProvider);
      affiliationRepo.findOne.mockResolvedValue(null);
      const result = await service.addAffiliation('prov-1', {
        facilityId: 'fac-1',
        employmentType: EmploymentType.FULL_TIME,
        startDate: '2025-01-01',
      });
      expect(result.facilityId).toBe('fac-1');
    });

    it('throws ConflictException for duplicate active affiliation', async () => {
      providerRepo.findOne.mockResolvedValue(mockProvider);
      affiliationRepo.findOne.mockResolvedValue({ affiliationId: 'existing' });
      await expect(
        service.addAffiliation('prov-1', {
          facilityId: 'fac-1',
          employmentType: EmploymentType.FULL_TIME,
          startDate: '2025-01-01',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('search', () => {
    it('returns paginated results', async () => {
      const [items, total] = await service.search({ fullName: 'Emeka' }, 1, 20);
      expect(items).toHaveLength(1);
      expect(total).toBe(1);
    });
  });
});
