import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { ConsentService } from './consent.service';
import { GrantConsentDto } from './dto/grant-consent.dto';
import { BreakGlassDto } from './dto/break-glass.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { IJwtPayload, UserRole } from '@nuhiris/shared-types';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class ConsentController {
  constructor(private consentService: ConsentService) {}

  @Post('patients/:nuhi/consents')
  @Roles(
    UserRole.PATIENT,
    UserRole.HEALTH_RECORDS_OFFICER,
    UserRole.FACILITY_ADMIN,
    UserRole.NATIONAL_ADMIN,
  )
  grant(
    @Param('nuhi', ParseUUIDPipe) nuhi: string,
    @Body() dto: GrantConsentDto,
    @CurrentUser() user: IJwtPayload,
  ) {
    return this.consentService.grant(nuhi, dto, user.sub);
  }

  @Get('patients/:nuhi/consents')
  listByPatient(@Param('nuhi', ParseUUIDPipe) nuhi: string) {
    return this.consentService.listByPatient(nuhi);
  }

  @Get('patients/:nuhi/consents/:consentId')
  findById(@Param('consentId', ParseUUIDPipe) consentId: string) {
    return this.consentService.findById(consentId);
  }

  @Delete('patients/:nuhi/consents/:consentId')
  @Roles(
    UserRole.PATIENT,
    UserRole.FACILITY_ADMIN,
    UserRole.NATIONAL_ADMIN,
  )
  revoke(
    @Param('consentId', ParseUUIDPipe) consentId: string,
    @Body('reason') reason: string,
  ) {
    return this.consentService.revoke(consentId, reason);
  }

  @Post('consents/check')
  @Roles(UserRole.NATIONAL_ADMIN, UserRole.FACILITY_ADMIN)
  checkAccess(
    @Body() body: {
      actorId: string;
      actorRoles: string[];
      actorFacilityId: string | null;
      actorProviderId: string | null;
      patientNuhi: string;
      resourceType: string;
    },
  ) {
    return this.consentService.checkAccess(body);
  }

  @Post('access/break-glass')
  @Roles(UserRole.MEDICAL_OFFICER, UserRole.NATIONAL_ADMIN)
  breakGlass(@Body() dto: BreakGlassDto, @CurrentUser() user: IJwtPayload) {
    return this.consentService.breakGlass(
      user.sub,
      user.roles[0]!,
      dto.patientNuhi,
      dto.reason,
    );
  }
}
