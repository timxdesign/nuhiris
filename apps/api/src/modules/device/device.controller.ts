import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { DeviceService } from './device.service';
import { RegisterDeviceDto } from './dto/register-device.dto';
import { DeviceHeartbeatDto } from './dto/device-heartbeat.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { IJwtPayload, UserRole } from '@nuhiris/shared-types';

@Controller('devices')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DeviceController {
  constructor(private deviceService: DeviceService) {}

  @Post()
  @Roles(UserRole.NATIONAL_ADMIN, UserRole.FACILITY_ADMIN)
  register(@Body() dto: RegisterDeviceDto, @CurrentUser() user: IJwtPayload) {
    return this.deviceService.register(dto, user.sub);
  }

  @Get(':id')
  findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.deviceService.findById(id);
  }

  @Post(':id/heartbeat')
  @HttpCode(HttpStatus.NO_CONTENT)
  heartbeat(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DeviceHeartbeatDto,
  ) {
    return this.deviceService.heartbeat(id, dto.latitude, dto.longitude);
  }

  @Patch(':id/suspend')
  @Roles(UserRole.NATIONAL_ADMIN, UserRole.FACILITY_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  suspend(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('reason') reason: string,
  ) {
    return this.deviceService.suspend(id, reason);
  }

  @Patch(':id/revoke')
  @Roles(UserRole.NATIONAL_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  revoke(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('reason') reason: string,
  ) {
    return this.deviceService.revoke(id, reason);
  }

  @Get('facility/:facilityId')
  @Roles(UserRole.NATIONAL_ADMIN, UserRole.FACILITY_ADMIN)
  findByFacility(@Param('facilityId', ParseUUIDPipe) facilityId: string) {
    return this.deviceService.findByFacility(facilityId);
  }
}
