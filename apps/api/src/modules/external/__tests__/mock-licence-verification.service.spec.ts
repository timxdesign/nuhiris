import { MockLicenceVerificationService } from '../mocks/mock-licence-verification.service';

describe('MockLicenceVerificationService', () => {
  let service: MockLicenceVerificationService;

  beforeEach(() => {
    service = new MockLicenceVerificationService();
  });

  it('returns valid for normal licence number', async () => {
    const result = await service.verifyLicence('MDCN/12345', 'MDCN');
    expect(result.status).toBe('active');
    expect(result.valid).toBe(true);
  });

  it('returns expired for licence prefixed with EXPIRED/', async () => {
    const result = await service.verifyLicence('EXPIRED/12345', 'MDCN');
    expect(result.status).toBe('expired');
    expect(result.valid).toBe(false);
  });
});
