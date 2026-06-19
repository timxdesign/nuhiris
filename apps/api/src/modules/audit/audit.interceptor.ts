import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, tap, catchError } from 'rxjs';
import { AuditService } from './audit.service';
import { AuditAction } from '@nuhiris/shared-types';
import { SKIP_AUDIT_KEY } from './decorators/skip-audit.decorator';
import { IJwtPayload } from '@nuhiris/shared-types';

const METHOD_ACTION_MAP: Record<string, AuditAction> = {
  GET: AuditAction.READ,
  POST: AuditAction.CREATE,
  PUT: AuditAction.UPDATE,
  PATCH: AuditAction.UPDATE,
  DELETE: AuditAction.DELETE,
};

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private auditService: AuditService,
    private reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const skip = this.reflector.getAllAndOverride<boolean>(SKIP_AUDIT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skip) return next.handle();

    const request = context.switchToHttp().getRequest<{
      method: string;
      url: string;
      ip: string;
      headers: Record<string, string | undefined>;
      user?: IJwtPayload;
      params?: Record<string, string>;
    }>();

    const user = request.user;
    const action = METHOD_ACTION_MAP[request.method] ?? AuditAction.READ;

    const auditBase = {
      actorId: user?.sub ?? null,
      actorRole: user?.roles?.[0] ?? null,
      actorFacilityId: user?.facilityId ?? null,
      action,
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'] ?? null,
      pathway: request.url,
      resourceType: this.extractResourceType(request.url),
      resourceId: request.params?.['id'] ?? request.params?.['nuhi'] ?? null,
      patientNuhi: request.params?.['nuhi'] ?? null,
    };

    return next.handle().pipe(
      tap(() => {
        void this.auditService.create({
          ...auditBase,
          outcome: 'success',
        });
      }),
      catchError((error: Error) => {
        void this.auditService.create({
          ...auditBase,
          outcome: 'failure',
          failureReason: error.message,
        });
        throw error;
      }),
    );
  }

  private extractResourceType(url: string): string | null {
    const segments = url.replace(/^\/api\/v1\//, '').split('/');
    return segments[0] ?? null;
  }
}
