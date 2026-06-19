import { BiometricEventType, BiometricMethod, BiometricResult } from '../enums';

export interface IBiometricEvent {
  eventId: string;
  nuhi: string | null;
  nin: string | null;
  deviceId: string;
  eventType: BiometricEventType;
  method: BiometricMethod;
  result: BiometricResult;
  confidenceScore: number | null;
  nimcApiCalled: boolean;
  nimcReferenceId: string | null;
  livenessPassed: boolean | null;
  deviceAttested: boolean | null;
  geofencePassed: boolean | null;
  performedBy: string | null;
  facilityId: string | null;
  timestamp: string;
}
