export type {
  IApiMeta,
  IApiSuccess,
  IApiError,
  IPagination,
  IApiPaginated,
  IApiResponse,
} from './api-response.interface';

export type { IAuditEvent } from './audit-event.interface';

export type { IPatient, IPatientHistory } from './patient.interface';

export type { IProvider, IProviderAffiliation } from './provider.interface';

export type { IFacility } from './facility.interface';

export type { IEncounter } from './encounter.interface';

export type { IConsent } from './consent.interface';

export type { IRegisteredDevice } from './device.interface';

export type { IBiometricEvent } from './biometric-event.interface';

export type {
  INinAuthLookupResult,
  IBiometricMatchResult,
  ILivenessResult,
  IFaceMatchResult,
  ILicenceVerificationResult,
} from './nin-auth.interface';

export type { IUserAccount, IJwtPayload } from './user-account.interface';
