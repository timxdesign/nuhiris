import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BiometricEvent } from '../entities/biometric-event.entity';
import { BiometricResult } from '@nuhiris/shared-types';

@Injectable()
export class BiometricResultGuard implements CanActivate {
  constructor(
    @InjectRepository(BiometricEvent)
    private biometricEventRepo: Repository<BiometricEvent>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | undefined>;
      body?: { nin?: string };
    }>();

    const sessionId = request.headers['x-biometric-session'];
    const nin = request.body?.nin;

    if (!sessionId && !nin) {
      throw new ForbiddenException(
        'Biometric verification required: provide X-Biometric-Session header or NIN in body',
      );
    }

    const qb = this.biometricEventRepo
      .createQueryBuilder('be')
      .orderBy('be.timestamp', 'DESC')
      .limit(1);

    if (sessionId) {
      qb.where('be.nimc_reference_id = :sessionId', { sessionId });
    } else {
      qb.where('be.nin = :nin', { nin });
    }

    const latestEvent = await qb.getOne();

    if (!latestEvent) {
      throw new ForbiddenException('No biometric verification on record for this session');
    }

    if (latestEvent.result !== BiometricResult.MATCH) {
      throw new ForbiddenException(
        `Biometric verification result is '${latestEvent.result}', expected 'match'`,
      );
    }

    (request as Record<string, unknown>)['biometricEvent'] = latestEvent;
    return true;
  }
}
