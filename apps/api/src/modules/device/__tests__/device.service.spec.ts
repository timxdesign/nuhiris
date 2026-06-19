import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { DeviceService } from '../device.service';
import { RegisteredDevice } from '../entities/registered-device.entity';
import { DeviceType, TrustLevel } from '@nuhiris/shared-types';

describe('DeviceService', () => {
  let service: DeviceService;
  let repo: {
    findOne: jest.Mock;
    find: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };

  const mockDevice: RegisteredDevice = {
    deviceId: 'dev-1',
    deviceFingerprint: 'fp-abc123',
    deviceName: 'Biometric Scanner A',
    deviceType: DeviceType.FACILITY_TABLET,
    facilityId: 'fac-1',
    trustLevel: TrustLevel.HIGH,
    enrolledBy: 'user-1',
    enrolledAt: new Date(),
    lastSeenAt: null,
    lastSeenLat: null,
    lastSeenLng: null,
    status: 'active',
    revokedAt: null,
    revocationReason: null,
  };

  beforeEach(async () => {
    repo = {
      findOne: jest.fn(),
      find: jest.fn().mockResolvedValue([mockDevice]),
      create: jest.fn().mockReturnValue(mockDevice),
      save: jest.fn().mockResolvedValue(mockDevice),
    };

    const module = await Test.createTestingModule({
      providers: [
        DeviceService,
        { provide: getRepositoryToken(RegisteredDevice), useValue: repo },
      ],
    }).compile();

    service = module.get(DeviceService);
  });

  describe('register', () => {
    it('registers a new device', async () => {
      repo.findOne.mockResolvedValue(null);
      const result = await service.register(
        {
          deviceFingerprint: 'fp-abc123',
          deviceType: DeviceType.FACILITY_TABLET,
          trustLevel: TrustLevel.HIGH,
        },
        'user-1',
      );
      expect(result.deviceId).toBe('dev-1');
      expect(repo.create).toHaveBeenCalled();
      expect(repo.save).toHaveBeenCalled();
    });

    it('throws ConflictException for duplicate fingerprint', async () => {
      repo.findOne.mockResolvedValue(mockDevice);
      await expect(
        service.register(
          {
            deviceFingerprint: 'fp-abc123',
            deviceType: DeviceType.FACILITY_TABLET,
            trustLevel: TrustLevel.HIGH,
          },
          'user-1',
        ),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findById', () => {
    it('returns a device by ID', async () => {
      repo.findOne.mockResolvedValue(mockDevice);
      const result = await service.findById('dev-1');
      expect(result.deviceId).toBe('dev-1');
    });

    it('throws NotFoundException for unknown device', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.findById('unknown')).rejects.toThrow(NotFoundException);
    });
  });

  describe('heartbeat', () => {
    it('updates last seen timestamp and location', async () => {
      repo.findOne.mockResolvedValue({ ...mockDevice });
      await service.heartbeat('dev-1', 9.0579, 7.4951);
      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          lastSeenLat: '9.0579',
          lastSeenLng: '7.4951',
        }),
      );
    });
  });

  describe('suspend', () => {
    it('sets device status to suspended', async () => {
      repo.findOne.mockResolvedValue({ ...mockDevice });
      await service.suspend('dev-1', 'Maintenance');
      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'suspended',
          revocationReason: 'Maintenance',
        }),
      );
    });
  });

  describe('revoke', () => {
    it('sets device status to revoked with timestamp', async () => {
      repo.findOne.mockResolvedValue({ ...mockDevice });
      await service.revoke('dev-1', 'Compromised');
      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'revoked',
          revocationReason: 'Compromised',
        }),
      );
    });
  });
});
