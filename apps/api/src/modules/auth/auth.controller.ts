import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { MfaVerifyDto } from './dto/mfa-verify.dto';
import { MfaSetupConfirmDto } from './dto/mfa-setup-confirm.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { IJwtPayload } from '@nuhiris/shared-types';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.username, dto.password);
  }

  @Public()
  @Post('mfa/verify')
  @HttpCode(HttpStatus.OK)
  verifyMfa(@Body() dto: MfaVerifyDto) {
    return this.authService.verifyMfa(dto.mfaSessionToken, dto.totpCode);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(@Body() dto: RefreshTokenDto) {
    return this.authService.logout(dto.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Post('mfa/setup')
  setupMfa(@CurrentUser() user: IJwtPayload) {
    return this.authService.setupMfa(user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Post('mfa/setup/confirm')
  @HttpCode(HttpStatus.NO_CONTENT)
  confirmMfaSetup(@CurrentUser() user: IJwtPayload, @Body() dto: MfaSetupConfirmDto) {
    return this.authService.confirmMfaSetup(user.sub, dto.tempSecret, dto.totpCode);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('mfa')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeMfa(@CurrentUser() user: IJwtPayload) {
    return this.authService.removeMfa(user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@CurrentUser() user: IJwtPayload) {
    return this.authService.getProfile(user.sub);
  }
}
