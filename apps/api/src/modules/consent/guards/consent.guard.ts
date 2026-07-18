import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConsentService } from '../consent.service';
import { IJwtPayload } from '@nuhiris/shared-types';

export const SKIP_CONSENT_KEY = 'skipConsent';
export const SkipConsent = () => SetMetadata(SKIP_CONSENT_KEY, true);

@Injectable()
export class ConsentGuard implements CanActivate {
  constructor(
    private consentService: ConsentService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const skip = this.reflector.getAllAndOverride<boolean>(SKIP_CONSENT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skip) return true;

    const request = context.switchToHttp().getRequest<{
      user?: IJwtPayload;
      params?: Record<string, string>;
      url: string;
    }>();

    const user = request.user;
    if (!user) return true;

    const patientNuhi = request.params?.['nuhi'];
    if (!patientNuhi) return true;

    const resourceType = this.extractResourceType(request.url);
    if (!resourceType || resourceType === 'auth' || resourceType === 'health') {
      return true;
    }

    const result = await this.consentService.checkAccess({
      actorId: user.sub,
      actorRoles: user.roles,
      actorFacilityId: user.facilityId,
      actorProviderId: user.providerId,
      patientNuhi,
      resourceType,
    });

    if (!result.permitted) {
      throw new ForbiddenException({
        code: 'CONSENT_REQUIRED',
        message: 'No active consent for this access',
        reason: result.reason,
      });
    }

    return true;
  }

  private extractResourceType(url: string): string | null {
    const segments = url.replace(/^\/api\/v1\//, '').split('/');
    return segments[0] ?? null;
  }
}
