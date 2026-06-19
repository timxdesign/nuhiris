export interface INinAuthLookupResult {
  found: boolean;
  nin: string;
  firstName: string;
  lastName: string;
  middleName: string | null;
  dateOfBirth: string;
  gender: string;
  state: string;
  lga: string | null;
  photoBase64: string | null;
  nimcReferenceId: string;
}

export interface IBiometricMatchResult {
  matched: boolean;
  confidenceScore: number;
  nimcReferenceId: string;
}

export interface ILivenessResult {
  passed: boolean;
  confidenceScore: number;
  nimcReferenceId: string;
}

export interface IFaceMatchResult {
  matched: boolean;
  confidenceScore: number;
  nimcReferenceId: string;
}

export interface ILicenceVerificationResult {
  valid: boolean;
  licenceNumber: string;
  regulatoryBody: string;
  holderName: string | null;
  status: 'active' | 'expired' | 'suspended' | 'not_found';
  expiryDate: string | null;
}
