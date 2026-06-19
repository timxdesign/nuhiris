import { ForbiddenException } from '@nestjs/common';
import { BiometricResultGuard } from '../guards/biometric-result.guard';
import { BiometricResult, BiometricEventType, BiometricMethod } from '@nuhiris/shared-types';
import { BiometricEvent } from '../entities/biometric-event.entity';
import { Repository, SelectQueryBuilder } from 'typeorm';

describe('BiometricResultGuard', () => {
  let guard: BiometricResultGuard;
  let mockQb: Partial<SelectQueryBuilder<BiometricEvent>>;
  let repo: jest.Mocked<Repository<BiometricEvent>>;

  function createContext(
    headers: Record<string, string | undefined>,
    body?: Record<string, unknown>,
  ) {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ headers, body }),
      }),
    } as never;
  }

  beforeEach(() => {
    mockQb = {
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getOne: jest.fn(),
    };
    repo = {
      createQueryBuilder: jest.fn().mockReturnValue(mockQb),
    } as unknown as jest.Mocked<Repository<BiometricEvent>>;
    guard = new BiometricResultGuard(repo);
  });

  it('rejects when no session header and no NIN in body', async () => {
    const ctx = createContext({}, {});
    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });

  it('rejects when no biometric event found', async () => {
    (mockQb.getOne as jest.Mock).mockResolvedValue(null);
    const ctx = createContext({ 'x-biometric-session': 'sess-1' });
    await expect(guard.canActivate(ctx)).rejects.toThrow('No biometric verification');
  });

  it('rejects when result is not match', async () => {
    const event: Partial<BiometricEvent> = {
      eventId: 'ev-1',
      result: BiometricResult.NO_MATCH,
      eventType: BiometricEventType.REGISTRATION,
      method: BiometricMethod.FINGERPRINT,
    };
    (mockQb.getOne as jest.Mock).mockResolvedValue(event);
    const ctx = createContext({ 'x-biometric-session': 'sess-1' });
    await expect(guard.canActivate(ctx)).rejects.toThrow("expected 'match'");
  });

  it('allows when latest event is a match (by session)', async () => {
    const event: Partial<BiometricEvent> = {
      eventId: 'ev-1',
      result: BiometricResult.MATCH,
      eventType: BiometricEventType.REGISTRATION,
      method: BiometricMethod.FINGERPRINT,
    };
    (mockQb.getOne as jest.Mock).mockResolvedValue(event);
    const ctx = createContext({ 'x-biometric-session': 'sess-1' });
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });

  it('allows when latest event is a match (by NIN)', async () => {
    const event: Partial<BiometricEvent> = {
      eventId: 'ev-2',
      result: BiometricResult.MATCH,
    };
    (mockQb.getOne as jest.Mock).mockResolvedValue(event);
    const ctx = createContext({}, { nin: '12345678901' });
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });
});
