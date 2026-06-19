import { MockNinAuthService } from '../mocks/mock-nin-auth.service';

describe('MockNinAuthService', () => {
  let service: MockNinAuthService;

  beforeEach(() => {
    service = new MockNinAuthService();
  });

  describe('lookupNin', () => {
    it('returns found=false for NIN 00000000000', async () => {
      const result = await service.lookupNin('00000000000');
      expect(result.found).toBe(false);
    });

    it('returns found=true with demographics for normal NIN', async () => {
      const result = await service.lookupNin('12345678901');
      expect(result.found).toBe(true);
      expect(result.firstName).toBe('Oluwaseun');
      expect(result.lastName).toBe('Adeyemi');
    });
  });

  describe('verifyBiometric', () => {
    it('returns matched=false for NIN 99999999999', async () => {
      const result = await service.verifyBiometric('99999999999', 'template-data');
      expect(result.matched).toBe(false);
      expect(result.confidenceScore).toBeLessThan(0.5);
    });

    it('returns matched=true for normal NIN', async () => {
      const result = await service.verifyBiometric('12345678901', 'template-data');
      expect(result.matched).toBe(true);
      expect(result.confidenceScore).toBeGreaterThan(0.9);
    });
  });

  describe('verifyLiveness', () => {
    it('returns passed=true for normal NIN', async () => {
      const result = await service.verifyLiveness('12345678901', 'image-data');
      expect(result.passed).toBe(true);
    });

    it('returns passed=false for no-match NIN', async () => {
      const result = await service.verifyLiveness('99999999999', 'image-data');
      expect(result.passed).toBe(false);
    });
  });

  describe('verifyFaceMatch', () => {
    it('returns matched=true for normal NIN', async () => {
      const result = await service.verifyFaceMatch('12345678901', 'selfie-data');
      expect(result.matched).toBe(true);
      expect(result.confidenceScore).toBeGreaterThan(0.9);
    });

    it('returns matched=false for no-match NIN', async () => {
      const result = await service.verifyFaceMatch('99999999999', 'selfie-data');
      expect(result.matched).toBe(false);
    });
  });
});
