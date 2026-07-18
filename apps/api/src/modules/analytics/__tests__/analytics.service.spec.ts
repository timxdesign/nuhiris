import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AnalyticsService } from '../analytics.service';
import { Patient } from '../../patient/entities/patient.entity';
import { Encounter } from '../../encounter/entities/encounter.entity';

describe('AnalyticsService', () => {
  let service: AnalyticsService;

  const mockQueryBuilder = {
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getRawMany: jest.fn().mockResolvedValue([]),
  };

  const patientRepo = {
    count: jest.fn().mockResolvedValue(100),
    createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
  };

  const encounterRepo = {
    count: jest.fn().mockResolvedValue(250),
    createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
  };

  beforeEach(async () => {
    patientRepo.count.mockResolvedValue(100);
    encounterRepo.count.mockResolvedValue(250);

    const module = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        { provide: getRepositoryToken(Patient), useValue: patientRepo },
        { provide: getRepositoryToken(Encounter), useValue: encounterRepo },
      ],
    }).compile();

    service = module.get(AnalyticsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getSummary', () => {
    it('returns registration and encounter stats', async () => {
      patientRepo.count
        .mockResolvedValueOnce(100)
        .mockResolvedValueOnce(30)
        .mockResolvedValueOnce(70);

      encounterRepo.count
        .mockResolvedValueOnce(250)
        .mockResolvedValueOnce(50)
        .mockResolvedValueOnce(200);

      const result = await service.getSummary(30);

      expect(result.registrations).toBeDefined();
      expect(result.encounters).toBeDefined();
      expect(result.generatedAt).toBeDefined();
      expect(result.registrations.total).toBe(100);
      expect(result.encounters.total).toBe(250);
    });

    it('handles zero patients gracefully', async () => {
      patientRepo.count.mockResolvedValue(0);
      encounterRepo.count.mockResolvedValue(0);

      const result = await service.getSummary(7);

      expect(result.registrations.upgradeRate).toBe(0);
    });
  });
});
