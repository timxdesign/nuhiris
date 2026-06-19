import { buildFhirPatient, InternalPatient } from '../builders/patient-builder';

const basePatient: InternalPatient = {
  nuhi: '550e8400-e29b-41d4-a716-446655440000',
  fullName: 'Oluwaseun Adeyemi Ogundimu',
  dateOfBirth: '1990-03-15',
  sex: 'male',
  state: 'Lagos',
  lga: 'Ikeja',
  phone: '+2348012345678',
  email: null,
  status: 'active',
  updatedAt: '2026-06-15T10:00:00Z',
};

describe('buildFhirPatient', () => {
  it('should build a valid FHIR Patient resource', () => {
    const result = buildFhirPatient(basePatient);

    expect(result.resourceType).toBe('Patient');
    expect(result.id).toBe(basePatient.nuhi);
    expect(result.identifier?.[0]?.value).toBe(basePatient.nuhi);
    expect(result.name?.[0]?.family).toBe('Ogundimu');
    expect(result.name?.[0]?.given).toEqual(['Oluwaseun', 'Adeyemi']);
    expect(result.gender).toBe('male');
    expect(result.birthDate).toBe('1990-03-15');
    expect(result.address?.[0]?.state).toBe('Lagos');
    expect(result.address?.[0]?.country).toBe('NG');
    expect(result.active).toBe(true);
  });

  it('should map intersex to other', () => {
    const result = buildFhirPatient({ ...basePatient, sex: 'intersex' });
    expect(result.gender).toBe('other');
  });

  it('should map not_stated to unknown', () => {
    const result = buildFhirPatient({ ...basePatient, sex: 'not_stated' });
    expect(result.gender).toBe('unknown');
  });

  it('should omit telecom when no phone or email', () => {
    const result = buildFhirPatient({ ...basePatient, phone: null, email: null });
    expect(result.telecom).toBeUndefined();
  });

  it('should set active false for non-active patients', () => {
    const result = buildFhirPatient({ ...basePatient, status: 'deceased' });
    expect(result.active).toBe(false);
  });
});
