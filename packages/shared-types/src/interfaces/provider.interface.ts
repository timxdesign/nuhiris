import { ProviderCategory, VerificationStatus } from '../enums';

export interface IProvider {
  providerId: string;
  fullName: string;
  category: ProviderCategory;
  specialty: string | null;
  licenceNumber: string | null;
  regulatoryBody: string | null;
  verificationStatus: VerificationStatus;
  verifiedAt: string | null;
  verificationSource: string | null;
  status: 'active' | 'inactive' | 'deactivated';
  accountId: string | null;
  createdAt: string;
}

export interface IProviderAffiliation {
  affiliationId: string;
  providerId: string;
  facilityId: string;
  employmentType: string;
  startDate: string;
  endDate: string | null;
  status: 'active' | 'inactive';
  createdAt: string;
}
