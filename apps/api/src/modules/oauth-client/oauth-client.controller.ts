import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { OAuthClientService } from './oauth-client.service';
import { RegisterClientDto } from './dto/register-client.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SkipConsent } from '../consent/guards/consent.guard';
import { IJwtPayload, UserRole } from '@nuhiris/shared-types';

@Controller('admin/oauth-clients')
@UseGuards(JwtAuthGuard, RolesGuard)
@SkipConsent()
@Roles(UserRole.NATIONAL_ADMIN)
export class OAuthClientController {
  constructor(private oauthClientService: OAuthClientService) {}

  @Post()
  async register(@Body() dto: RegisterClientDto, @CurrentUser() user: IJwtPayload) {
    const { client, clientSecret } = await this.oauthClientService.register(dto, user.sub);
    return {
      clientId: client.clientId,
      clientName: client.clientName,
      clientSecret,
      scopes: client.scopes,
      createdAt: client.createdAt,
    };
  }

  @Get()
  list() {
    return this.oauthClientService.findAll();
  }

  @Get(':clientId')
  findById(@Param('clientId', ParseUUIDPipe) clientId: string) {
    return this.oauthClientService.findById(clientId);
  }

  @Post(':clientId/rotate-secret')
  async rotateSecret(@Param('clientId', ParseUUIDPipe) clientId: string) {
    const { client, clientSecret } = await this.oauthClientService.rotateSecret(clientId);
    return { clientId: client.clientId, clientSecret };
  }

  @Put(':clientId/scopes')
  updateScopes(
    @Param('clientId', ParseUUIDPipe) clientId: string,
    @Body('scopes') scopes: string[],
  ) {
    return this.oauthClientService.updateScopes(clientId, scopes);
  }

  @Delete(':clientId')
  deactivate(@Param('clientId', ParseUUIDPipe) clientId: string) {
    return this.oauthClientService.deactivate(clientId);
  }
}
