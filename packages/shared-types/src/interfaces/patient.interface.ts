import { PatientStatus, RegistrationType } from '../enums';

export interface IPatient {
  nuhi: string;
  fullName: string;
  dateOfBirth: string;
  sex: 'male' | 'female' | 'intersex' | 'not_stated';
  state: string;
  lga: string | null;
  phone: string | null;
  email: string | null;
  ninVerified: boolean;
  registrationType: RegistrationType;
  status: PatientStatus;
  provisionalDeadline: string | null;
  deceasedAt: string | null;
  mergedInto: string | null;
  registrationFacilityId: string | null;
  registeredBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IPatientHistory {
  historyId: string;
  nuhi: string;
  changedBy: string;
  changedAt: string;
  fieldName: string;
  oldValue: string | null;
  newValue: string | null;
  changeReason: string | null;
}
