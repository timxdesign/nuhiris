import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { MfaRequiredGuard } from '../guards/mfa-required.guard';

function createContext(user?: Record<string, unknown>): ExecutionContext {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  } as unknown as ExecutionContext;
}

describe('MfaRequiredGuard', () => {
  let guard: MfaRequiredGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new MfaRequiredGuard(reflector);
  });

  it('allows access on public routes', () => {
    jest.spyOn(reflector, 'getAllAndOverride')
      .mockReturnValueOnce(true); // isPublic
    expect(guard.canActivate(createContext())).toBe(true);
  });

  it('allows access when skipMfa is set', () => {
    jest.spyOn(reflector, 'getAllAndOverride')
      .mockReturnValueOnce(false)  // isPublic
      .mockReturnValueOnce(true);  // skipMfa
    expect(guard.canActivate(createContext())).toBe(true);
  });

  it('allows access when no user context', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    expect(guard.canActivate(createContext(undefined))).toBe(true);
  });

  it('allows access when MFA not required for user', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    expect(guard.canActivate(createContext({ mfaRequired: false }))).toBe(true);
  });

  it('allows access when MFA is verified', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    expect(guard.canActivate(createContext({ mfaRequired: true, mfaVerified: true }))).toBe(true);
  });

  it('throws ForbiddenException when MFA required but not verified', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    expect(() => guard.canActivate(createContext({ mfaRequired: true, mfaVerified: false }))).toThrow(
      ForbiddenException,
    );
  });
});
