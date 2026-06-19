import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DeviceService } from '../device.service';
import { TrustLevel } from '@nuhiris/shared-types';

export const REQUIRED_TRUST_LEVEL = 'requiredTrustLevel';

export const RequireTrustLevel = (level: TrustLevel) =>
  SetMetadata(REQUIRED_TRUST_LEVEL, level);

const TRUST_RANK: Record<TrustLevel, number> = {
  [TrustLevel.HIGH]: 3,
  [TrustLevel.MEDIUM]: 2,
  [TrustLevel.LOW]: 1,
};

@Injectable()
export class DeviceAttestationGuard implements CanActivate {
  constructor(
    private deviceService: DeviceService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | undefined>;
    }>();

    const deviceFingerprint = request.headers['x-device-fingerprint'];
    if (!deviceFingerprint) {
      throw new ForbiddenException('Missing X-Device-Fingerprint header');
    }

    const device = await this.deviceService.findByFingerprint(deviceFingerprint);
    if (!device) {
      throw new ForbiddenException('Device not registered');
    }

    if (device.status !== 'active') {
      throw new ForbiddenException(`Device is ${device.status}`);
    }

    const requiredLevel = this.reflector.getAllAndOverride<TrustLevel>(
      REQUIRED_TRUST_LEVEL,
      [context.getHandler(), context.getClass()],
    ) ?? TrustLevel.LOW;

    if (TRUST_RANK[device.trustLevel] < TRUST_RANK[requiredLevel]) {
      throw new ForbiddenException(
        `Device trust level '${device.trustLevel}' does not meet required '${requiredLevel}'`,
      );
    }

    (request as Record<string, unknown>)['device'] = device;
    return true;
  }
}
