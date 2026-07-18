import { Controller, Get, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@nuhiris/shared-types';
import { SkipConsent } from '../consent/guards/consent.guard';

@Controller('analytics')
@Roles(UserRole.NATIONAL_ADMIN, UserRole.FACILITY_ADMIN)
@SkipConsent()
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get('summary')
  async getSummary(@Query('days') days?: string) {
    const d = days ? parseInt(days, 10) : 30;
    return this.analyticsService.getSummary(d);
  }
}
