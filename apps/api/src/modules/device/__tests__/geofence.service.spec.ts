import { GeofenceService } from '../services/geofence.service';
import { TrustLevel } from '@nuhiris/shared-types';

describe('GeofenceService', () => {
  let service: GeofenceService;

  beforeEach(() => {
    service = new GeofenceService();
  });

  it('returns true when device is within HIGH trust radius (500m)', () => {
    // Two points ~100m apart in Abuja
    expect(service.isWithinRadius(9.0579, 7.4951, 9.0580, 7.4960, TrustLevel.HIGH)).toBe(true);
  });

  it('returns false when device is outside HIGH trust radius', () => {
    // Two points ~1km apart
    expect(service.isWithinRadius(9.0579, 7.4951, 9.0670, 7.4951, TrustLevel.HIGH)).toBe(false);
  });

  it('returns true for MEDIUM trust with wider radius (1000m)', () => {
    // ~800m apart
    expect(service.isWithinRadius(9.0579, 7.4951, 9.0650, 7.4951, TrustLevel.MEDIUM)).toBe(true);
  });

  it('allows up to 5000m for LOW trust', () => {
    // ~3km apart
    expect(service.isWithinRadius(9.0579, 7.4951, 9.0850, 7.4951, TrustLevel.LOW)).toBe(true);
  });

  it('returns false when outside LOW trust radius', () => {
    // ~10km apart — exceeds LOW trust 5000m
    expect(service.isWithinRadius(9.0579, 7.4951, 9.1479, 7.4951, TrustLevel.LOW)).toBe(false);
  });
});
