import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { UserAccount } from './entities/user-account.entity';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { SessionService } from './services/session.service';
import { MfaService } from './services/mfa.service';
import { KeycloakAdminService } from './services/keycloak-admin.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserAccount]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    SessionService,
    MfaService,
    KeycloakAdminService,
  ],
  exports: [AuthService, SessionService],
})
export class AuthModule {}
