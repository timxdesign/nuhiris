import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from './jwt-auth.guard';

export const SKIP_MFA_KEY = 'skipMfa';

@Injectable()
export class MfaRequiredGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const skipMfa = this.reflector.getAllAndOverride<boolean>(SKIP_MFA_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skipMfa) return true;

    const request = context.switchToHttp().getRequest<{ user?: { mfaVerified?: boolean; mfaRequired?: boolean } }>();
    const user = request.user;

    if (!user) return true;
    if (!user.mfaRequired) return true;
    if (user.mfaVerified) return true;

    throw new ForbiddenException('MFA verification required');
  }
}
