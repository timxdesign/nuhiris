import type { Organization } from '@medplum/fhirtypes';
import { FACILITY_IDENTIFIER_SYSTEM } from '../constants/identifier-systems';

export interface InternalFacility {
  facilityId: string;
  name: string;
  type: string;
  state: string;
  lga: string | null;
  address: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  operationalStatus: string;
}

export function buildFhirOrganization(facility: InternalFacility): Organization {
  const telecom: Organization['telecom'] = [];

  if (facility.contactPhone) {
    telecom.push({ system: 'phone', value: facility.contactPhone });
  }
  if (facility.contactEmail) {
    telecom.push({ system: 'email', value: facility.contactEmail });
  }

  return {
    resourceType: 'Organization',
    id: facility.facilityId,
    identifier: [
      {
        system: FACILITY_IDENTIFIER_SYSTEM,
        value: facility.facilityId,
      },
    ],
    name: facility.name,
    type: [
      {
        text: facility.type,
      },
    ],
    address: [
      {
        state: facility.state,
        district: facility.lga ?? undefined,
        text: facility.address ?? undefined,
        country: 'NG',
      },
    ],
    telecom: telecom.length > 0 ? telecom : undefined,
    active: facility.operationalStatus === 'operational',
  };
}
