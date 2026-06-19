import {
  INinAuthLookupResult,
  IBiometricMatchResult,
  ILivenessResult,
  IFaceMatchResult,
} from '@nuhiris/shared-types';

export interface INinAuthService {
  lookupNin(nin: string): Promise<INinAuthLookupResult>;
  verifyBiometric(nin: string, payload: unknown): Promise<IBiometricMatchResult>;
  verifyLiveness(nin: string, payload: unknown): Promise<ILivenessResult>;
  verifyFaceMatch(nin: string, payload: unknown): Promise<IFaceMatchResult>;
}
