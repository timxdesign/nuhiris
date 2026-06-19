import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from '../guards/roles.guard';

function createMockContext(user?: { roles: string[] }): ExecutionContext {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  it('allows access when no roles are required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const context = createMockContext({ roles: ['patient'] });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('allows access when user has a required role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['medical_officer', 'nurse']);
    const context = createMockContext({ roles: ['medical_officer'] });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('denies access when user lacks required role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['national_admin']);
    const context = createMockContext({ roles: ['patient'] });
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('denies access when no user context', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['national_admin']);
    const context = createMockContext(undefined);
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
