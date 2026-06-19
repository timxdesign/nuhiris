import type { Patient } from '@medplum/fhirtypes';
import { NUHI_IDENTIFIER_SYSTEM } from '../constants/identifier-systems';

export interface InternalPatient {
  nuhi: string;
  fullName: string;
  dateOfBirth: string;
  sex: 'male' | 'female' | 'intersex' | 'not_stated';
  state: string;
  lga: string | null;
  phone: string | null;
  email: string | null;
  status: string;
  updatedAt: string;
}

function mapGender(sex: string): Patient['gender'] {
  switch (sex) {
    case 'male':
      return 'male';
    case 'female':
      return 'female';
    case 'intersex':
      return 'other';
    default:
      return 'unknown';
  }
}

function parseFullName(fullName: string): { family: string; given: string[] } {
  const parts = fullName.trim().split(/\s+/);
  const family = parts.pop() ?? '';
  return { family, given: parts };
}

export function buildFhirPatient(patient: InternalPatient): Patient {
  const { family, given } = parseFullName(patient.fullName);
  const telecom: Patient['telecom'] = [];

  if (patient.phone) {
    telecom.push({ system: 'phone', value: patient.phone, use: 'mobile' });
  }
  if (patient.email) {
    telecom.push({ system: 'email', value: patient.email });
  }

  return {
    resourceType: 'Patient',
    id: patient.nuhi,
    meta: {
      lastUpdated: patient.updatedAt,
      source: 'https://nuhiris.health.gov.ng',
    },
    identifier: [
      {
        system: NUHI_IDENTIFIER_SYSTEM,
        value: patient.nuhi,
      },
    ],
    name: [
      {
        use: 'official',
        family,
        given,
      },
    ],
    gender: mapGender(patient.sex),
    birthDate: patient.dateOfBirth,
    address: [
      {
        use: 'home',
        state: patient.state,
        district: patient.lga ?? undefined,
        country: 'NG',
      },
    ],
    telecom: telecom.length > 0 ? telecom : undefined,
    active: patient.status === 'active',
  };
}
