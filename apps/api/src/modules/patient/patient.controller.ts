import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { PatientService } from './patient.service';
import { RegisterPatientDto } from './dto/register-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { SearchPatientDto } from './dto/search-patient.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { IJwtPayload, UserRole } from '@nuhiris/shared-types';

@Controller('patients')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PatientController {
  constructor(private patientService: PatientService) {}

  @Post()
  @Roles(
    UserRole.HEALTH_RECORDS_OFFICER,
    UserRole.MEDICAL_OFFICER,
    UserRole.NURSE,
    UserRole.FACILITY_ADMIN,
    UserRole.NATIONAL_ADMIN,
  )
  register(@Body() dto: RegisterPatientDto, @CurrentUser() user: IJwtPayload) {
    return this.patientService.register(dto, user.sub);
  }

  @Get('search')
  search(@Query() searchDto: SearchPatientDto, @Query() pagination: PaginationQueryDto) {
    return this.patientService.search(searchDto, pagination.page, pagination.limit);
  }

  @Get(':nuhi')
  findByNuhi(@Param('nuhi', ParseUUIDPipe) nuhi: string) {
    return this.patientService.findByNuhi(nuhi);
  }

  @Patch(':nuhi')
  @Roles(
    UserRole.HEALTH_RECORDS_OFFICER,
    UserRole.MEDICAL_OFFICER,
    UserRole.FACILITY_ADMIN,
    UserRole.NATIONAL_ADMIN,
  )
  update(
    @Param('nuhi', ParseUUIDPipe) nuhi: string,
    @Body() dto: UpdatePatientDto,
    @CurrentUser() user: IJwtPayload,
  ) {
    return this.patientService.update(nuhi, dto, user.sub);
  }

  @Post(':nuhi/upgrade')
  @Roles(
    UserRole.HEALTH_RECORDS_OFFICER,
    UserRole.FACILITY_ADMIN,
    UserRole.NATIONAL_ADMIN,
  )
  upgradeProvisional(
    @Param('nuhi', ParseUUIDPipe) nuhi: string,
    @Body('nin') nin: string,
    @CurrentUser() user: IJwtPayload,
  ) {
    return this.patientService.upgradeProvisional(nuhi, nin, user.sub);
  }

  @Get(':nuhi/history')
  getHistory(@Param('nuhi', ParseUUIDPipe) nuhi: string) {
    return this.patientService.getHistory(nuhi);
  }
}
