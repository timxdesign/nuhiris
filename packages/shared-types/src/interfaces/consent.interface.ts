import { ConsentPurpose } from '../enums';

export interface IConsent {
  consentId: string;
  nuhi: string;
  grantorId: string;
  granteeType: 'provider' | 'facility' | 'role';
  granteeId: string;
  purpose: ConsentPurpose;
  scope: string[];
  validFrom: string;
  validTo: string | null;
  revokedAt: string | null;
  revocationReason: string | null;
  createdAt: string;
}
