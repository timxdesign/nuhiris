import { TerminologyService } from '../terminology.service';

describe('TerminologyService', () => {
  let service: TerminologyService;

  beforeEach(() => {
    service = new TerminologyService();
  });

  describe('search', () => {
    it('searches ICD-11 by code', () => {
      const results = service.search('icd11', '1A00');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0]!.code).toBe('1A00');
      expect(results[0]!.display).toBe('Cholera');
    });

    it('searches ICD-11 by display text', () => {
      const results = service.search('icd11', 'malaria');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0]!.display).toContain('Malaria');
    });

    it('searches LOINC codes', () => {
      const results = service.search('loinc', 'cholesterol');
      expect(results.length).toBeGreaterThan(0);
    });

    it('searches SNOMED codes', () => {
      const results = service.search('snomed', 'amoxicillin');
      expect(results.length).toBeGreaterThan(0);
    });

    it('returns empty for unknown system', () => {
      expect(service.search('unknown', 'test')).toEqual([]);
    });

    it('respects limit parameter', () => {
      const results = service.search('icd11', '', 3);
      expect(results.length).toBeLessThanOrEqual(3);
    });
  });

  describe('lookup', () => {
    it('finds ICD-11 code by exact match', () => {
      const result = service.lookup('icd11', '1A00');
      expect(result).not.toBeNull();
      expect(result!.display).toBe('Cholera');
    });

    it('finds LOINC code', () => {
      const result = service.lookup('loinc', '2093-3');
      expect(result).not.toBeNull();
      expect(result!.display).toBe('Total Cholesterol');
    });

    it('returns null for unknown code', () => {
      expect(service.lookup('icd11', 'ZZZZZ')).toBeNull();
    });
  });

  describe('validate', () => {
    it('validates known ICD-11 code', () => {
      const result = service.validate('icd11', 'BA00');
      expect(result.valid).toBe(true);
      expect(result.display).toBe('Essential hypertension');
    });

    it('invalidates unknown code', () => {
      const result = service.validate('loinc', 'INVALID');
      expect(result.valid).toBe(false);
      expect(result.display).toBeUndefined();
    });
  });

  describe('listSystems', () => {
    it('returns all three coding systems', () => {
      const systems = service.listSystems();
      expect(systems).toHaveLength(3);
      expect(systems.map((s) => s.id)).toEqual(['icd11', 'loinc', 'snomed']);
    });
  });
});
