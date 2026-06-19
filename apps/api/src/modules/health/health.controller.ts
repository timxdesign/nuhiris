import { Controller, Get } from '@nestjs/common';
import { SkipAudit } from '../audit/decorators/skip-audit.decorator';
import { Public } from '../../common/decorators/public.decorator';

@Controller('health')
@SkipAudit()
@Public()
export class HealthController {
  @Get('live')
  live() {
    return { status: 'ok' };
  }

  @Get('ready')
  ready() {
    return { status: 'ok' };
  }

  @Get('startup')
  startup() {
    return { status: 'ok' };
  }
}
