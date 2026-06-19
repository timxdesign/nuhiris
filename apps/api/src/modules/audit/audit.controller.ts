import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { UserRole } from '@nuhiris/shared-types';

@Controller('audit')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.NATIONAL_ADMIN, UserRole.AUDIT_INSPECTOR)
export class AuditController {
  constructor(private auditService: AuditService) {}

  @Get('events')
  async findAll(@Query() query: PaginationQueryDto) {
    const [data, total] = await this.auditService.findAll(query.page, query.limit);
    return {
      data,
      meta: {
        total,
        page: query.page,
        limit: query.limit,
        pages: Math.ceil(total / query.limit),
      },
    };
  }

  @Get('actor/:actorId')
  async findByActor(
    @Param('actorId', ParseUUIDPipe) actorId: string,
    @Query() query: PaginationQueryDto,
  ) {
    const [data, total] = await this.auditService.findByActor(actorId, query.page, query.limit);
    return {
      data,
      meta: {
        total,
        page: query.page,
        limit: query.limit,
        pages: Math.ceil(total / query.limit),
      },
    };
  }

  @Get('patient/:nuhi')
  async findByPatient(
    @Param('nuhi', ParseUUIDPipe) nuhi: string,
    @Query() query: PaginationQueryDto,
  ) {
    const [data, total] = await this.auditService.findByPatient(nuhi, query.page, query.limit);
    return {
      data,
      meta: {
        total,
        page: query.page,
        limit: query.limit,
        pages: Math.ceil(total / query.limit),
      },
    };
  }

  @Get('resource/:resourceType/:resourceId')
  async findByResource(
    @Param('resourceType') resourceType: string,
    @Param('resourceId', ParseUUIDPipe) resourceId: string,
  ) {
    const data = await this.auditService.findByResource(resourceType, resourceId);
    return { data };
  }
}
