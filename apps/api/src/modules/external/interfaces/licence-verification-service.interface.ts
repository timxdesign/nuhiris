import { ILicenceVerificationResult } from '@nuhiris/shared-types';

export interface ILicenceVerificationService {
  verifyLicence(
    licenceNumber: string,
    regulatoryBody: string,
  ): Promise<ILicenceVerificationResult>;
}
