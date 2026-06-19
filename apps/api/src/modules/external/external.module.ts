import { Module, Global } from '@nestjs/common';
import { NIN_AUTH_SERVICE, LICENCE_VERIFICATION_SERVICE } from './tokens';
import { MockNinAuthService } from './mocks/mock-nin-auth.service';
import { MockLicenceVerificationService } from './mocks/mock-licence-verification.service';

@Global()
@Module({
  providers: [
    {
      provide: NIN_AUTH_SERVICE,
      useClass: MockNinAuthService,
    },
    {
      provide: LICENCE_VERIFICATION_SERVICE,
      useClass: MockLicenceVerificationService,
    },
  ],
  exports: [NIN_AUTH_SERVICE, LICENCE_VERIFICATION_SERVICE],
})
export class ExternalModule {}
