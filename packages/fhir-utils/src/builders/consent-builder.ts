import type { Consent } from '@medplum/fhirtypes';
import { NUHI_IDENTIFIER_SYSTEM } from '../constants/identifier-systems';

export interface InternalConsent {
  consentId: string;
  nuhi: string;
  grantorId: string;
  granteeType: string;
  granteeId: string;
  purpose: string;
  scope: string[];
  validFrom: Date | string;
  validTo: Date | string | null;
  revokedAt: Date | string | null;
  createdAt: Date | string;
}

function toISO(d: Date | string): string {
  return typeof d === 'string' ? d : d.toISOString();
}

export function buildFhirConsent(c: InternalConsent): Consent {
  const isActive = !c.revokedAt;

  return {
    resourceType: 'Consent',
    id: c.consentId,
    status: isActive ? 'active' : 'inactive',
    scope: {
      coding: [{ system: 'http://terminology.hl7.org/CodeSystem/consentscope', code: 'patient-privacy' }],
    },
    category: [
      {
        coding: [{ system: 'http://loinc.org', code: '59284-0', display: 'Consent Document' }],
      },
    ],
    patient: {
      reference: `Patient/${c.nuhi}`,
      identifier: { system: NUHI_IDENTIFIER_SYSTEM, value: c.nuhi },
    },
    dateTime: toISO(c.createdAt),
    provision: {
      type: 'permit',
      period: {
        start: toISO(c.validFrom),
        end: c.validTo ? toISO(c.validTo) : undefined,
      },
      purpose: [{ code: c.purpose }],
      actor: [
        {
          role: { coding: [{ code: c.granteeType }] },
          reference: { reference: `${c.granteeType === 'facility' ? 'Organization' : 'Practitioner'}/${c.granteeId}` },
        },
      ],
      class: c.scope.map((s) => ({ code: s })),
    },
  };
}
