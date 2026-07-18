import type { AllergyIntolerance } from '@medplum/fhirtypes';
import { SNOMED_SYSTEM } from '../constants/coding-systems';
import { NUHI_IDENTIFIER_SYSTEM } from '../constants/identifier-systems';

export interface InternalAllergy {
  allergyId: string;
  nuhi: string;
  encounterId: string | null;
  substanceCode: string | null;
  substanceName: string;
  reaction: string | null;
  severity: string | null;
  status: string;
  recordedBy: string;
  recordedAt: Date | string;
}

function mapSeverity(severity: string | null): 'mild' | 'moderate' | 'severe' | undefined {
  if (!severity) return undefined;
  const s = severity.toLowerCase();
  if (s === 'mild' || s === 'moderate' || s === 'severe') return s;
  return undefined;
}

export function buildFhirAllergyIntolerance(allergy: InternalAllergy): AllergyIntolerance {
  const resource: AllergyIntolerance = {
    resourceType: 'AllergyIntolerance',
    id: allergy.allergyId,
    clinicalStatus: {
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical',
        code: allergy.status === 'resolved' ? 'resolved' : 'active',
      }],
    },
    code: {
      coding: allergy.substanceCode
        ? [{ system: SNOMED_SYSTEM, code: allergy.substanceCode, display: allergy.substanceName }]
        : [],
      text: allergy.substanceName,
    },
    patient: {
      reference: `Patient/${allergy.nuhi}`,
      identifier: { system: NUHI_IDENTIFIER_SYSTEM, value: allergy.nuhi },
    },
    recorder: { reference: `Practitioner/${allergy.recordedBy}` },
    recordedDate: typeof allergy.recordedAt === 'string' ? allergy.recordedAt : allergy.recordedAt.toISOString(),
  };

  if (allergy.encounterId) {
    resource.encounter = { reference: `Encounter/${allergy.encounterId}` };
  }

  if (allergy.reaction) {
    resource.reaction = [{
      manifestation: [{ text: allergy.reaction }],
      severity: mapSeverity(allergy.severity),
    }];
  }

  return resource;
}
