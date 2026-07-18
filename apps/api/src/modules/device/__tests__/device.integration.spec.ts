import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { DeviceController } from '../device.controller';
import { DeviceService } from '../device.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { DeviceType, TrustLevel, UserRole } from '@nuhiris/shared-types';

const mockGuard = {
  canActivate: (context: { switchToHttp: () => { getRequest: () => Record<string, unknown> } }) => {
    const req = context.switchToHttp().getRequest();
    req['user'] = { sub: 'user-1', roles: [UserRole.NATIONAL_ADMIN], facilityId: null };
    return true;
  },
};

describe('DeviceController (integration)', () => {
  let app: INestApplication;

  const mockDevice = {
    deviceId: 'e0000000-0000-4000-8000-000000000001',
    deviceFingerprint: 'fp-test-001',
    deviceName: 'Test Tablet',
    deviceType: DeviceType.FACILITY_TABLET,
    facilityId: 'fac-1',
    trustLevel: TrustLevel.HIGH,
    enrolledBy: 'user-1',
    enrolledAt: new Date(),
    lastSeenAt: null,
    lastSeenLat: null,
    lastSeenLng: null,
    status: 'active' as const,
    revokedAt: null,
    revocationReason: null,
  };

  const mockDeviceService = {
    register: jest.fn().mockResolvedValue(mockDevice),
    findById: jest.fn().mockResolvedValue(mockDevice),
    findByFingerprint: jest.fn().mockResolvedValue(mockDevice),
    heartbeat: jest.fn().mockResolvedValue(undefined),
    suspend: jest.fn().mockResolvedValue(undefined),
    revoke: jest.fn().mockResolvedValue(undefined),
    findByFacility: jest.fn().mockResolvedValue([mockDevice]),
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DeviceController],
      providers: [
        { provide: DeviceService, useValue: mockDeviceService },
      ],
    })
      .overrideGuard(JwtAuthGuard).useValue(mockGuard)
      .overrideGuard(RolesGuard).useValue(mockGuard)
      .compile();

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /devices', () => {
    it('registers a new device', async () => {
      const res = await request(app.getHttpServer())
        .post('/devices')
        .send({
          deviceFingerprint: 'fp-test-001',
          deviceType: 'facility_tablet',
          trustLevel: 'high',
        })
        .expect(201);

      expect(res.body).toHaveProperty('deviceId');
    });
  });

  describe('GET /devices/:id', () => {
    it('returns a device by id', async () => {
      const res = await request(app.getHttpServer())
        .get(`/devices/${mockDevice.deviceId}`)
        .expect(200);

      expect(res.body.deviceFingerprint).toBe('fp-test-001');
    });
  });

  describe('POST /devices/:id/heartbeat', () => {
    it('records heartbeat', async () => {
      await request(app.getHttpServer())
        .post(`/devices/${mockDevice.deviceId}/heartbeat`)
        .send({ latitude: 6.5, longitude: 3.4 })
        .expect(204);
    });
  });

  describe('GET /devices/facility/:facilityId', () => {
    it('lists devices for a facility', async () => {
      const res = await request(app.getHttpServer())
        .get('/devices/facility/00000000-0000-4000-8000-000000000001')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });
  });
});
