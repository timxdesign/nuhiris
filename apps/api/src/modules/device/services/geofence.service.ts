import { Injectable } from '@nestjs/common';
import { TrustLevel } from '@nuhiris/shared-types';

const RADIUS_BY_TRUST: Record<TrustLevel, number> = {
  [TrustLevel.HIGH]: 500,
  [TrustLevel.MEDIUM]: 1000,
  [TrustLevel.LOW]: 5000,
};

@Injectable()
export class GeofenceService {
  isWithinRadius(
    deviceLat: number,
    deviceLng: number,
    facilityLat: number,
    facilityLng: number,
    trustLevel: TrustLevel,
  ): boolean {
    const maxRadius = RADIUS_BY_TRUST[trustLevel];
    if (maxRadius === 0) return false;
    const distance = this.haversine(deviceLat, deviceLng, facilityLat, facilityLng);
    return distance <= maxRadius;
  }

  private haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6_371_000;
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
}
