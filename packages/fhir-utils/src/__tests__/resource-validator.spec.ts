import { validateFhirResource } from '../validators/resource-validator';

describe('validateFhirResource', () => {
  it('should accept a valid Patient resource', () => {
    const result = validateFhirResource({ resourceType: 'Patient', id: '123' });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject null', () => {
    const result = validateFhirResource(null);
    expect(result.valid).toBe(false);
  });

  it('should reject missing resourceType', () => {
    const result = validateFhirResource({ id: '123' });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('resourceType');
  });

  it('should reject unsupported resourceType', () => {
    const result = validateFhirResource({ resourceType: 'FakeResource' });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('Unsupported');
  });

  it('should reject non-string id', () => {
    const result = validateFhirResource({ resourceType: 'Patient', id: 123 });
    expect(result.valid).toBe(false);
  });
});
