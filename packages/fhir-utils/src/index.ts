export { buildFhirPatient } from './builders/patient-builder';
export type { InternalPatient } from './builders/patient-builder';

export { buildFhirPractitioner } from './builders/practitioner-builder';
export type { InternalProvider } from './builders/practitioner-builder';

export { buildFhirOrganization } from './builders/organization-builder';
export type { InternalFacility } from './builders/organization-builder';

export { validateFhirResource } from './validators/resource-validator';
export type { ValidationResult } from './validators/resource-validator';

export {
  NUHI_IDENTIFIER_SYSTEM,
  PROVIDER_IDENTIFIER_SYSTEM,
  FACILITY_IDENTIFIER_SYSTEM,
} from './constants/identifier-systems';

export { ICD11_SYSTEM, SNOMED_SYSTEM, LOINC_SYSTEM, DICOM_SYSTEM } from './constants/coding-systems';
