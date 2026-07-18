import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { EncounterService } from './encounter.service';
import { CreateEncounterDto } from './dto/create-encounter.dto';
import { CreateDiagnosisDto } from './dto/create-diagnosis.dto';
import { CreateObservationDto } from './dto/create-observation.dto';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { CreateDispenseDto } from './dto/create-dispense.dto';
import { CreateLabOrderDto } from './dto/create-lab-order.dto';
import { CreateLabResultDto } from './dto/create-lab-result.dto';
import { CreateAllergyDto } from './dto/create-allergy.dto';
import { CreateReferralDto } from './dto/create-referral.dto';
import { CreateImmunisationDto } from './dto/create-immunisation.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { IJwtPayload, UserRole, EncounterStatus } from '@nuhiris/shared-types';

@Controller('encounters')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EncounterController {
  constructor(private encounterService: EncounterService) {}

  @Post()
  @Roles(UserRole.MEDICAL_OFFICER, UserRole.NURSE)
  create(@Body() dto: CreateEncounterDto, @CurrentUser() user: IJwtPayload) {
    return this.encounterService.createEncounter(dto, user);
  }

  @Get(':encounterId')
  findById(@Param('encounterId', ParseUUIDPipe) encounterId: string) {
    return this.encounterService.findById(encounterId);
  }

  @Put(':encounterId/status')
  @Roles(UserRole.MEDICAL_OFFICER, UserRole.NURSE)
  updateStatus(
    @Param('encounterId', ParseUUIDPipe) encounterId: string,
    @Body('status') status: EncounterStatus,
  ) {
    return this.encounterService.updateStatus(encounterId, status);
  }

  @Get('patient/:nuhi')
  findByPatient(
    @Param('nuhi', ParseUUIDPipe) nuhi: string,
    @Query() pagination: PaginationQueryDto,
  ) {
    return this.encounterService.findByPatient(nuhi, pagination.page, pagination.limit);
  }

  @Post(':encounterId/diagnoses')
  @Roles(UserRole.MEDICAL_OFFICER)
  addDiagnosis(
    @Param('encounterId', ParseUUIDPipe) encounterId: string,
    @Body() dto: CreateDiagnosisDto,
    @CurrentUser() user: IJwtPayload,
  ) {
    return this.encounterService.addDiagnosis(encounterId, dto, user.providerId!);
  }

  @Get(':encounterId/diagnoses')
  getDiagnoses(@Param('encounterId', ParseUUIDPipe) encounterId: string) {
    return this.encounterService.getDiagnoses(encounterId);
  }

  @Post(':encounterId/observations')
  @Roles(UserRole.MEDICAL_OFFICER, UserRole.NURSE, UserRole.LAB_SCIENTIST)
  addObservation(
    @Param('encounterId', ParseUUIDPipe) encounterId: string,
    @Body() dto: CreateObservationDto,
    @CurrentUser() user: IJwtPayload,
  ) {
    return this.encounterService.addObservation(encounterId, dto, user.providerId!);
  }

  @Get(':encounterId/observations')
  getObservations(@Param('encounterId', ParseUUIDPipe) encounterId: string) {
    return this.encounterService.getObservations(encounterId);
  }

  @Post(':encounterId/prescriptions')
  @Roles(UserRole.MEDICAL_OFFICER)
  addPrescription(
    @Param('encounterId', ParseUUIDPipe) encounterId: string,
    @Body() dto: CreatePrescriptionDto,
    @CurrentUser() user: IJwtPayload,
  ) {
    return this.encounterService.addPrescription(encounterId, dto, user.providerId!);
  }

  @Get(':encounterId/prescriptions')
  getPrescriptions(@Param('encounterId', ParseUUIDPipe) encounterId: string) {
    return this.encounterService.getPrescriptions(encounterId);
  }

  @Post(':encounterId/dispenses')
  @Roles(UserRole.PHARMACIST)
  addDispense(
    @Param('encounterId', ParseUUIDPipe) encounterId: string,
    @Body() dto: CreateDispenseDto,
    @CurrentUser() user: IJwtPayload,
  ) {
    return this.encounterService.addDispense(encounterId, dto, user);
  }

  @Post(':encounterId/lab-orders')
  @Roles(UserRole.MEDICAL_OFFICER, UserRole.NURSE)
  addLabOrder(
    @Param('encounterId', ParseUUIDPipe) encounterId: string,
    @Body() dto: CreateLabOrderDto,
    @CurrentUser() user: IJwtPayload,
  ) {
    return this.encounterService.addLabOrder(encounterId, dto, user.providerId!);
  }

  @Get(':encounterId/lab-orders')
  getLabOrders(@Param('encounterId', ParseUUIDPipe) encounterId: string) {
    return this.encounterService.getLabOrders(encounterId);
  }

  @Post(':encounterId/lab-results')
  @Roles(UserRole.LAB_SCIENTIST)
  addLabResult(
    @Param('encounterId', ParseUUIDPipe) encounterId: string,
    @Body() dto: CreateLabResultDto,
    @CurrentUser() user: IJwtPayload,
  ) {
    return this.encounterService.addLabResult(encounterId, dto, user);
  }

  @Post(':encounterId/allergies')
  @Roles(UserRole.MEDICAL_OFFICER, UserRole.NURSE)
  addAllergy(
    @Param('encounterId', ParseUUIDPipe) encounterId: string,
    @Body() dto: CreateAllergyDto,
    @CurrentUser() user: IJwtPayload,
  ) {
    return this.encounterService.addAllergy(encounterId, dto, user.providerId!);
  }

  @Get('patient/:nuhi/allergies')
  getAllergies(@Param('nuhi', ParseUUIDPipe) nuhi: string) {
    return this.encounterService.getAllergies(nuhi);
  }

  @Post(':encounterId/referrals')
  @Roles(UserRole.MEDICAL_OFFICER)
  addReferral(
    @Param('encounterId', ParseUUIDPipe) encounterId: string,
    @Body() dto: CreateReferralDto,
    @CurrentUser() user: IJwtPayload,
  ) {
    return this.encounterService.addReferral(encounterId, dto, user.providerId!);
  }

  @Get(':encounterId/referrals')
  getReferrals(@Param('encounterId', ParseUUIDPipe) encounterId: string) {
    return this.encounterService.getReferrals(encounterId);
  }

  @Put('referrals/:referralId/status')
  @Roles(UserRole.MEDICAL_OFFICER, UserRole.FACILITY_ADMIN)
  updateReferralStatus(
    @Param('referralId', ParseUUIDPipe) referralId: string,
    @Body('status') status: 'accepted' | 'completed' | 'rejected',
  ) {
    return this.encounterService.updateReferralStatus(referralId, status);
  }

  @Post(':encounterId/immunisations')
  @Roles(UserRole.MEDICAL_OFFICER, UserRole.NURSE)
  addImmunisation(
    @Param('encounterId', ParseUUIDPipe) encounterId: string,
    @Body() dto: CreateImmunisationDto,
    @CurrentUser() user: IJwtPayload,
  ) {
    return this.encounterService.addImmunisation(encounterId, dto, user);
  }

  @Get('patient/:nuhi/immunisations')
  getImmunisations(@Param('nuhi', ParseUUIDPipe) nuhi: string) {
    return this.encounterService.getImmunisations(nuhi);
  }

  @Get('patient/:nuhi/clinical-summary')
  getClinicalSummary(@Param('nuhi', ParseUUIDPipe) nuhi: string) {
    return this.encounterService.getClinicalSummary(nuhi);
  }
}
