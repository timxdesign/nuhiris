import type { Encounter } from '@medplum/fhirtypes';
import { NUHI_IDENTIFIER_SYSTEM, PROVIDER_IDENTIFIER_SYSTEM, FACILITY_IDENTIFIER_SYSTEM } from '../constants/identifier-systems';

export interface InternalEncounter {
  encounterId: string;
  nuhi: string;
  providerId: string;
  facilityId: string;
  encounterType: string;
  status: string;
  reason: string | null;
  dateTime: Date | string;
  closedAt: Date | string | null;
  notes: string | null;
}

function mapStatus(status: string): Encounter['status'] {
  switch (status) {
    case 'open':
      return 'in-progress';
    case 'in_progress':
      return 'in-progress';
    case 'closed':
      return 'finished';
    case 'cancelled':
      return 'cancelled';
    default:
      return 'unknown';
  }
}

function mapClass(encounterType: string): { system: string; code: string; display: string } {
  const map: Record<string, { code: string; display: string }> = {
    outpatient: { code: 'AMB', display: 'ambulatory' },
    inpatient: { code: 'IMP', display: 'inpatient encounter' },
    emergency: { code: 'EMER', display: 'emergency' },
    telemedicine: { code: 'VR', display: 'virtual' },
    pharmacy: { code: 'AMB', display: 'ambulatory' },
    laboratory: { code: 'AMB', display: 'ambulatory' },
    radiology: { code: 'AMB', display: 'ambulatory' },
    referral: { code: 'AMB', display: 'ambulatory' },
  };
  const entry = map[encounterType] ?? { code: 'AMB', display: 'ambulatory' };
  return { system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode', ...entry };
}

export function buildFhirEncounter(enc: InternalEncounter): Encounter {
  const resource: Encounter = {
    resourceType: 'Encounter',
    id: enc.encounterId,
    status: mapStatus(enc.status),
    class: mapClass(enc.encounterType),
    subject: {
      reference: `Patient/${enc.nuhi}`,
      identifier: { system: NUHI_IDENTIFIER_SYSTEM, value: enc.nuhi },
    },
    participant: [
      {
        individual: {
          reference: `Practitioner/${enc.providerId}`,
          identifier: { system: PROVIDER_IDENTIFIER_SYSTEM, value: enc.providerId },
        },
      },
    ],
    serviceProvider: {
      reference: `Organization/${enc.facilityId}`,
      identifier: { system: FACILITY_IDENTIFIER_SYSTEM, value: enc.facilityId },
    },
    period: {
      start: typeof enc.dateTime === 'string' ? enc.dateTime : enc.dateTime.toISOString(),
      end: enc.closedAt
        ? typeof enc.closedAt === 'string' ? enc.closedAt : enc.closedAt.toISOString()
        : undefined,
    },
  };

  if (enc.reason) {
    resource.reasonCode = [{ text: enc.reason }];
  }

  if (enc.notes) {
    resource.text = { status: 'additional', div: `<div xmlns="http://www.w3.org/1999/xhtml">${enc.notes}</div>` };
  }

  return resource;
}
