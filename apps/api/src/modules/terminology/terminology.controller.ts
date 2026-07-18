import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TerminologyService } from './terminology.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SkipConsent } from '../consent/guards/consent.guard';

@Controller('terminology')
@UseGuards(JwtAuthGuard)
@SkipConsent()
export class TerminologyController {
  constructor(private terminologyService: TerminologyService) {}

  @Get('systems')
  listSystems() {
    return this.terminologyService.listSystems();
  }

  @Get(':system/search')
  search(
    @Param('system') system: string,
    @Query('q') query: string,
    @Query('limit') limit?: string,
  ) {
    return this.terminologyService.search(system, query ?? '', limit ? parseInt(limit, 10) : 20);
  }

  @Get(':system/lookup/:code')
  lookup(@Param('system') system: string, @Param('code') code: string) {
    return this.terminologyService.lookup(system, code);
  }

  @Get(':system/validate/:code')
  validate(@Param('system') system: string, @Param('code') code: string) {
    return this.terminologyService.validate(system, code);
  }
}
