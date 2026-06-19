import { ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { of, throwError } from 'rxjs';
import { AuditInterceptor } from '../audit.interceptor';
import { AuditService } from '../audit.service';

describe('AuditInterceptor', () => {
  let interceptor: AuditInterceptor;
  let auditService: { create: jest.Mock };
  let reflector: Reflector;

  beforeEach(() => {
    auditService = {
      create: jest.fn().mockResolvedValue({ eventId: 'evt-1' }),
    };
    reflector = new Reflector();
    interceptor = new AuditInterceptor(
      auditService as unknown as AuditService,
      reflector,
    );
  });

  function createContext(method = 'GET', url = '/api/v1/patients', user?: Record<string, unknown>): ExecutionContext {
    return {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({
          method,
          url,
          ip: '127.0.0.1',
          headers: { 'user-agent': 'jest-test' },
          user,
          params: {},
        }),
      }),
    } as unknown as ExecutionContext;
  }

  function createHandler(response: unknown = { data: 'ok' }): CallHandler {
    return { handle: () => of(response) };
  }

  it('skips audit when @SkipAudit is applied', (done) => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
    const context = createContext();
    const handler = createHandler();

    interceptor.intercept(context, handler).subscribe({
      complete: () => {
        expect(auditService.create).not.toHaveBeenCalled();
        done();
      },
    });
  });

  it('writes success audit event on successful request', (done) => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    const context = createContext('POST', '/api/v1/patients', {
      sub: 'user-1',
      roles: ['medical_officer'],
      facilityId: 'fac-1',
    });
    const handler = createHandler();

    interceptor.intercept(context, handler).subscribe({
      complete: () => {
        expect(auditService.create).toHaveBeenCalledWith(
          expect.objectContaining({
            actorId: 'user-1',
            outcome: 'success',
          }),
        );
        done();
      },
    });
  });

  it('writes failure audit event on error', (done) => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    const context = createContext('GET', '/api/v1/patients');
    const handler: CallHandler = {
      handle: () => throwError(() => new Error('Something broke')),
    };

    interceptor.intercept(context, handler).subscribe({
      error: () => {
        expect(auditService.create).toHaveBeenCalledWith(
          expect.objectContaining({
            outcome: 'failure',
            failureReason: 'Something broke',
          }),
        );
        done();
      },
    });
  });

  it('extracts resource type from URL', (done) => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    const context = createContext('GET', '/api/v1/encounters/123');
    const handler = createHandler();

    interceptor.intercept(context, handler).subscribe({
      complete: () => {
        expect(auditService.create).toHaveBeenCalledWith(
          expect.objectContaining({
            resourceType: 'encounters',
          }),
        );
        done();
      },
    });
  });
});
