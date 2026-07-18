import {
  Controller,
  Post,
  Body,
  Inject,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { IJwtPayload, UserRole } from '@nuhiris/shared-types';
import { NIN_AUTH_SERVICE } from './tokens';
import { INinAuthService } from './interfaces/nin-auth-service.interface';
import { NinLookupDto } from './dto/nin-lookup.dto';
import { NinVerifyDto } from './dto/nin-verify.dto';
import { BiometricEventService } from './biometric-event.service';

@Controller('nin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NinVerificationController {
  constructor(
    @Inject(NIN_AUTH_SERVICE)
    private ninAuth: INinAuthService,
    private biometricEventService: BiometricEventService,
  ) {}

  @Post('lookup')
  @Roles(
    UserRole.HEALTH_RECORDS_OFFICER,
    UserRole.MEDICAL_OFFICER,
    UserRole.NURSE,
    UserRole.FACILITY_ADMIN,
    UserRole.NATIONAL_ADMIN,
  )
  async lookup(@Body() dto: NinLookupDto, @CurrentUser() user: IJwtPayload) {
    const result = await this.ninAuth.lookupNin(dto.nin);

    await this.biometricEventService.recordLookup({
      nin: dto.nin,
      found: result.found,
      nimcReferenceId: result.nimcReferenceId,
      performedBy: user.sub,
      facilityId: user.facilityId,
    });

    return result;
  }

  @Post('verify-liveness')
  @Roles(
    UserRole.HEALTH_RECORDS_OFFICER,
    UserRole.MEDICAL_OFFICER,
    UserRole.NURSE,
    UserRole.FACILITY_ADMIN,
    UserRole.NATIONAL_ADMIN,
  )
  async verifyLiveness(@Body() dto: NinVerifyDto, @CurrentUser() user: IJwtPayload) {
    const result = await this.ninAuth.verifyLiveness(dto.nin, {
      imageBase64: dto.imageBase64,
    });

    await this.biometricEventService.recordLiveness({
      nin: dto.nin,
      passed: result.passed,
      confidenceScore: result.confidenceScore,
      nimcReferenceId: result.nimcReferenceId,
      performedBy: user.sub,
      facilityId: user.facilityId,
    });

    return result;
  }

  @Post('verify-face')
  @Roles(
    UserRole.HEALTH_RECORDS_OFFICER,
    UserRole.MEDICAL_OFFICER,
    UserRole.NURSE,
    UserRole.FACILITY_ADMIN,
    UserRole.NATIONAL_ADMIN,
  )
  async verifyFace(@Body() dto: NinVerifyDto, @CurrentUser() user: IJwtPayload) {
    const result = await this.ninAuth.verifyFaceMatch(dto.nin, {
      imageBase64: dto.imageBase64,
    });

    await this.biometricEventService.recordFaceMatch({
      nin: dto.nin,
      matched: result.matched,
      confidenceScore: result.confidenceScore,
      nimcReferenceId: result.nimcReferenceId,
      performedBy: user.sub,
      facilityId: user.facilityId,
    });

    return result;
  }
}
