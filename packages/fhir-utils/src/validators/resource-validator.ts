export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

const VALID_RESOURCE_TYPES = new Set([
  'Patient',
  'Practitioner',
  'Organization',
  'Encounter',
  'Condition',
  'Observation',
  'MedicationRequest',
  'MedicationDispense',
  'AllergyIntolerance',
  'Immunization',
  'DiagnosticReport',
  'ServiceRequest',
  'DocumentReference',
  'Consent',
  'AuditEvent',
  'Provenance',
]);

export function validateFhirResource(resource: unknown): ValidationResult {
  const errors: string[] = [];

  if (!resource || typeof resource !== 'object') {
    return { valid: false, errors: ['Resource must be a non-null object'] };
  }

  const obj = resource as Record<string, unknown>;

  if (!obj['resourceType'] || typeof obj['resourceType'] !== 'string') {
    errors.push('Resource must have a string resourceType');
  } else if (!VALID_RESOURCE_TYPES.has(obj['resourceType'])) {
    errors.push(`Unsupported resourceType: ${obj['resourceType']}`);
  }

  if (obj['id'] !== undefined && typeof obj['id'] !== 'string') {
    errors.push('id must be a string if present');
  }

  return { valid: errors.length === 0, errors };
}
