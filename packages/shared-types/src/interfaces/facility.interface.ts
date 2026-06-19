import { AccreditationStatus, FacilityType, LevelOfCare, OwnershipType } from '../enums';

export interface IFacility {
  facilityId: string;
  name: string;
  shortName: string | null;
  type: FacilityType;
  levelOfCare: LevelOfCare;
  ownership: OwnershipType;
  state: string;
  lga: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  contactPhone: string | null;
  contactEmail: string | null;
  accreditationStatus: AccreditationStatus;
  accreditationExpiry: string | null;
  operationalStatus: 'operational' | 'closed' | 'suspended';
  closureDate: string | null;
  createdAt: string;
  updatedAt: string;
}
