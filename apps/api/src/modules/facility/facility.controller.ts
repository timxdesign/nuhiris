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
import { FacilityService } from './facility.service';
import { CreateFacilityDto } from './dto/create-facility.dto';
import { UpdateFacilityDto } from './dto/update-facility.dto';
import { SearchFacilityDto } from './dto/search-facility.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@nuhiris/shared-types';

@Controller('facilities')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FacilityController {
  constructor(private facilityService: FacilityService) {}

  @Post()
  @Roles(UserRole.NATIONAL_ADMIN)
  create(@Body() dto: CreateFacilityDto) {
    return this.facilityService.create(dto);
  }

  @Get()
  search(@Query() searchDto: SearchFacilityDto) {
    return this.facilityService.search(searchDto, searchDto.page, searchDto.limit);
  }

  @Get(':facilityId')
  findById(@Param('facilityId', ParseUUIDPipe) facilityId: string) {
    return this.facilityService.findById(facilityId);
  }

  @Put(':facilityId')
  @Roles(UserRole.NATIONAL_ADMIN, UserRole.FACILITY_ADMIN)
  update(
    @Param('facilityId', ParseUUIDPipe) facilityId: string,
    @Body() dto: UpdateFacilityDto,
  ) {
    return this.facilityService.update(facilityId, dto);
  }

  @Get(':facilityId/providers')
  getProviders(@Param('facilityId', ParseUUIDPipe) facilityId: string) {
    return this.facilityService.getProviders(facilityId);
  }

  @Get(':facilityId/stats')
  getStats(@Param('facilityId', ParseUUIDPipe) facilityId: string) {
    return this.facilityService.getStats(facilityId);
  }
}
