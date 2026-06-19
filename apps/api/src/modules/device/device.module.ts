import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RegisteredDevice } from './entities/registered-device.entity';
import { BiometricEvent } from './entities/biometric-event.entity';
import { DeviceService } from './device.service';
import { DeviceController } from './device.controller';
import { GeofenceService } from './services/geofence.service';

@Module({
  imports: [TypeOrmModule.forFeature([RegisteredDevice, BiometricEvent])],
  controllers: [DeviceController],
  providers: [DeviceService, GeofenceService],
  exports: [DeviceService, GeofenceService],
})
export class DeviceModule {}
