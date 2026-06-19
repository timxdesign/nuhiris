import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DeviceAttestationGuard } from '../guards/device-attestation.guard';
import { DeviceService } from '../device.service';
import { TrustLevel, DeviceType } from '@nuhiris/shared-types';
import { RegisteredDevice } from '../entities/registered-device.entity';

describe('DeviceAttestationGuard', () => {
  let guard: DeviceAttestationGuard;
  let deviceService: jest.Mocked<DeviceService>;
  let reflector: jest.Mocked<Reflector>;

  const mockDevice: RegisteredDevice = {
    deviceId: 'dev-1',
    deviceFingerprint: 'fp-123',
    deviceName: 'Test Tablet',
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

  function createContext(headers: Record<string, string | undefined>): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ headers }),
      }),
      getHandler: () => jest.fn(),
      getClass: () => jest.fn(),
    } as unknown as ExecutionContext;
  }

  beforeEach(() => {
    deviceService = {
      findByFingerprint: jest.fn(),
    } as unknown as jest.Mocked<DeviceService>;
    reflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as jest.Mocked<Reflector>;
    guard = new DeviceAttestationGuard(deviceService, reflector);
  });

  it('rejects when X-Device-Fingerprint header is missing', async () => {
    const ctx = createContext({});
    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });

  it('rejects when device is not registered', async () => {
    deviceService.findByFingerprint.mockResolvedValue(null);
    const ctx = createContext({ 'x-device-fingerprint': 'unknown' });
    await expect(guard.canActivate(ctx)).rejects.toThrow('Device not registered');
  });

  it('rejects when device is suspended', async () => {
    deviceService.findByFingerprint.mockResolvedValue({ ...mockDevice, status: 'suspended' });
    const ctx = createContext({ 'x-device-fingerprint': 'fp-123' });
    await expect(guard.canActivate(ctx)).rejects.toThrow('Device is suspended');
  });

  it('rejects when trust level is insufficient', async () => {
    deviceService.findByFingerprint.mockResolvedValue({ ...mockDevice, trustLevel: TrustLevel.LOW });
    reflector.getAllAndOverride.mockReturnValue(TrustLevel.HIGH);
    const ctx = createContext({ 'x-device-fingerprint': 'fp-123' });
    await expect(guard.canActivate(ctx)).rejects.toThrow(/does not meet required/);
  });

  it('allows when device is active and trust level is sufficient', async () => {
    deviceService.findByFingerprint.mockResolvedValue(mockDevice);
    reflector.getAllAndOverride.mockReturnValue(TrustLevel.MEDIUM);
    const ctx = createContext({ 'x-device-fingerprint': 'fp-123' });
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });

  it('defaults to LOW trust level when none specified', async () => {
    deviceService.findByFingerprint.mockResolvedValue({ ...mockDevice, trustLevel: TrustLevel.LOW });
    reflector.getAllAndOverride.mockReturnValue(undefined);
    const ctx = createContext({ 'x-device-fingerprint': 'fp-123' });
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });
});
