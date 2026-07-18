export { buildFhirPatient } from './builders/patient-builder';
export type { InternalPatient } from './builders/patient-builder';

export { buildFhirPractitioner } from './builders/practitioner-builder';
export type { InternalProvider } from './builders/practitioner-builder';

export { buildFhirOrganization } from './builders/organization-builder';
export type { InternalFacility } from './builders/organization-builder';

export { buildFhirEncounter } from './builders/encounter-builder';
export type { InternalEncounter } from './builders/encounter-builder';

export { buildFhirCondition } from './builders/condition-builder';
export type { InternalDiagnosis } from './builders/condition-builder';

export { buildFhirObservation } from './builders/observation-builder';
export type { InternalObservation } from './builders/observation-builder';

export { buildFhirMedicationRequest } from './builders/medication-request-builder';
export type { InternalPrescription } from './builders/medication-request-builder';

export { buildFhirMedicationDispense } from './builders/medication-dispense-builder';
export type { InternalDispense } from './builders/medication-dispense-builder';

export { buildFhirAllergyIntolerance } from './builders/allergy-intolerance-builder';
export type { InternalAllergy } from './builders/allergy-intolerance-builder';

export { buildFhirImmunization } from './builders/immunization-builder';
export type { InternalImmunisation } from './builders/immunization-builder';

export { buildFhirDiagnosticReport } from './builders/diagnostic-report-builder';
export type { InternalLabResult } from './builders/diagnostic-report-builder';

export { buildFhirServiceRequestFromLabOrder, buildFhirServiceRequestFromReferral } from './builders/service-request-builder';
export type { InternalLabOrder, InternalReferral } from './builders/service-request-builder';

export { buildFhirDocumentReference } from './builders/document-reference-builder';
export type { InternalDocumentRef } from './builders/document-reference-builder';

export { buildFhirConsent } from './builders/consent-builder';
export type { InternalConsent } from './builders/consent-builder';

export { validateFhirResource } from './validators/resource-validator';
export type { ValidationResult } from './validators/resource-validator';

export {
  NUHI_IDENTIFIER_SYSTEM,
  PROVIDER_IDENTIFIER_SYSTEM,
  FACILITY_IDENTIFIER_SYSTEM,
} from './constants/identifier-systems';

export { ICD11_SYSTEM, SNOMED_SYSTEM, LOINC_SYSTEM, DICOM_SYSTEM } from './constants/coding-systems';
