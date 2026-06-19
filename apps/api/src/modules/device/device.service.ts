import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RegisteredDevice } from './entities/registered-device.entity';
import { RegisterDeviceDto } from './dto/register-device.dto';

@Injectable()
export class DeviceService {
  constructor(
    @InjectRepository(RegisteredDevice)
    private deviceRepo: Repository<RegisteredDevice>,
  ) {}

  async register(dto: RegisterDeviceDto, enrolledBy: string): Promise<RegisteredDevice> {
    const existing = await this.deviceRepo.findOne({
      where: { deviceFingerprint: dto.deviceFingerprint },
    });
    if (existing) {
      throw new ConflictException('Device with this fingerprint is already registered');
    }

    const device = this.deviceRepo.create({
      deviceFingerprint: dto.deviceFingerprint,
      deviceName: dto.deviceName ?? null,
      deviceType: dto.deviceType,
      facilityId: dto.facilityId ?? null,
      trustLevel: dto.trustLevel,
      enrolledBy: enrolledBy,
    });

    return this.deviceRepo.save(device);
  }

  async findById(deviceId: string): Promise<RegisteredDevice> {
    const device = await this.deviceRepo.findOne({ where: { deviceId } });
    if (!device) {
      throw new NotFoundException('Device not found');
    }
    return device;
  }

  async findByFingerprint(fingerprint: string): Promise<RegisteredDevice | null> {
    return this.deviceRepo.findOne({ where: { deviceFingerprint: fingerprint } });
  }

  async heartbeat(deviceId: string, latitude?: number, longitude?: number): Promise<void> {
    const device = await this.findById(deviceId);
    device.lastSeenAt = new Date();
    if (latitude !== undefined && longitude !== undefined) {
      device.lastSeenLat = latitude.toString();
      device.lastSeenLng = longitude.toString();
    }
    await this.deviceRepo.save(device);
  }

  async suspend(deviceId: string, reason: string): Promise<void> {
    const device = await this.findById(deviceId);
    device.status = 'suspended';
    device.revocationReason = reason;
    await this.deviceRepo.save(device);
  }

  async revoke(deviceId: string, reason: string): Promise<void> {
    const device = await this.findById(deviceId);
    device.status = 'revoked';
    device.revokedAt = new Date();
    device.revocationReason = reason;
    await this.deviceRepo.save(device);
  }

  async findByFacility(facilityId: string): Promise<RegisteredDevice[]> {
    return this.deviceRepo.find({ where: { facilityId } });
  }
}
