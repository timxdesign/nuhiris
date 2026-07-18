import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { ProviderService } from './provider.service';
import { CreateProviderDto } from './dto/create-provider.dto';
import { UpdateProviderDto } from './dto/update-provider.dto';
import { CreateAffiliationDto } from './dto/create-affiliation.dto';
import { SearchProviderDto } from './dto/search-provider.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@nuhiris/shared-types';

@Controller('providers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProviderController {
  constructor(private providerService: ProviderService) {}

  @Post()
  @Roles(UserRole.NATIONAL_ADMIN, UserRole.FACILITY_ADMIN)
  create(@Body() dto: CreateProviderDto) {
    return this.providerService.create(dto);
  }

  @Get('search')
  search(@Query() searchDto: SearchProviderDto, @Query() pagination: PaginationQueryDto) {
    return this.providerService.search(searchDto, pagination.page, pagination.limit);
  }

  @Get(':providerId')
  findById(@Param('providerId', ParseUUIDPipe) providerId: string) {
    return this.providerService.findById(providerId);
  }

  @Put(':providerId')
  @Roles(UserRole.NATIONAL_ADMIN, UserRole.FACILITY_ADMIN)
  update(
    @Param('providerId', ParseUUIDPipe) providerId: string,
    @Body() dto: UpdateProviderDto,
  ) {
    return this.providerService.update(providerId, dto);
  }

  @Post(':providerId/verify')
  @Roles(UserRole.NATIONAL_ADMIN, UserRole.FACILITY_ADMIN)
  verify(
    @Param('providerId', ParseUUIDPipe) providerId: string,
    @Body('source') source: string,
  ) {
    return this.providerService.verify(providerId, source);
  }

  @Get(':providerId/affiliations')
  getAffiliations(@Param('providerId', ParseUUIDPipe) providerId: string) {
    return this.providerService.getAffiliations(providerId);
  }

  @Post(':providerId/affiliations')
  @Roles(UserRole.NATIONAL_ADMIN, UserRole.FACILITY_ADMIN)
  addAffiliation(
    @Param('providerId', ParseUUIDPipe) providerId: string,
    @Body() dto: CreateAffiliationDto,
  ) {
    return this.providerService.addAffiliation(providerId, dto);
  }

  @Delete(':providerId/affiliations/:affiliationId')
  @Roles(UserRole.NATIONAL_ADMIN, UserRole.FACILITY_ADMIN)
  closeAffiliation(
    @Param('providerId', ParseUUIDPipe) providerId: string,
    @Param('affiliationId', ParseUUIDPipe) affiliationId: string,
  ) {
    return this.providerService.closeAffiliation(providerId, affiliationId);
  }
}
