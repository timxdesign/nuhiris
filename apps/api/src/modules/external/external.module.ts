import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NIN_AUTH_SERVICE, LICENCE_VERIFICATION_SERVICE } from './tokens';
import { MockNinAuthService } from './mocks/mock-nin-auth.service';
import { MockLicenceVerificationService } from './mocks/mock-licence-verification.service';
import { NinVerificationController } from './nin-verification.controller';
import { BiometricEventService } from './biometric-event.service';
import { BiometricEvent } from '../device/entities/biometric-event.entity';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([BiometricEvent])],
  controllers: [NinVerificationController],
  providers: [
    {
      provide: NIN_AUTH_SERVICE,
      useClass: MockNinAuthService,
    },
    {
      provide: LICENCE_VERIFICATION_SERVICE,
      useClass: MockLicenceVerificationService,
    },
    BiometricEventService,
  ],
  exports: [NIN_AUTH_SERVICE, LICENCE_VERIFICATION_SERVICE, BiometricEventService],
})
export class ExternalModule {}
