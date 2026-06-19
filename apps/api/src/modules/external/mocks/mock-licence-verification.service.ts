import { Injectable, Logger } from '@nestjs/common';
import { ILicenceVerificationResult } from '@nuhiris/shared-types';
import { ILicenceVerificationService } from '../interfaces/licence-verification-service.interface';

const EXPIRED_PREFIX = 'EXPIRED/';

@Injectable()
export class MockLicenceVerificationService implements ILicenceVerificationService {
  private readonly logger = new Logger(MockLicenceVerificationService.name);

  async verifyLicence(
    licenceNumber: string,
    regulatoryBody: string,
  ): Promise<ILicenceVerificationResult> {
    this.logger.debug(`[MOCK] Licence verify: ${licenceNumber} (${regulatoryBody})`);

    await new Promise((resolve) => setTimeout(resolve, 50 + Math.random() * 100));

    if (licenceNumber.startsWith(EXPIRED_PREFIX)) {
      return {
        valid: false,
        licenceNumber,
        regulatoryBody,
        holderName: 'Expired Holder',
        status: 'expired',
        expiryDate: '2023-01-01',
      };
    }

    return {
      valid: true,
      licenceNumber,
      regulatoryBody,
      holderName: 'Dr. Mock Provider',
      status: 'active',
      expiryDate: '2028-12-31',
    };
  }
}
