import type { Observation } from '@medplum/fhirtypes';
import { LOINC_SYSTEM } from '../constants/coding-systems';
import { NUHI_IDENTIFIER_SYSTEM } from '../constants/identifier-systems';

export interface InternalObservation {
  observationId: string;
  encounterId: string;
  nuhi: string;
  loincCode: string;
  display: string | null;
  valueQuantity: string | null;
  valueUnit: string | null;
  valueString: string | null;
  valueCodeable: string | null;
  referenceRange: string | null;
  interpretation: string | null;
  status: string | null;
  effectiveDt: Date | string | null;
  createdBy: string;
  createdAt: Date | string;
}

function mapStatus(status: string | null): Observation['status'] {
  switch (status) {
    case 'final':
      return 'final';
    case 'preliminary':
      return 'preliminary';
    case 'amended':
      return 'amended';
    case 'cancelled':
      return 'cancelled';
    default:
      return 'final';
  }
}

export function buildFhirObservation(obs: InternalObservation): Observation {
  const resource: Observation = {
    resourceType: 'Observation',
    id: obs.observationId,
    status: mapStatus(obs.status),
    code: {
      coding: [{ system: LOINC_SYSTEM, code: obs.loincCode, display: obs.display ?? undefined }],
    },
    subject: {
      reference: `Patient/${obs.nuhi}`,
      identifier: { system: NUHI_IDENTIFIER_SYSTEM, value: obs.nuhi },
    },
    encounter: { reference: `Encounter/${obs.encounterId}` },
    performer: [{ reference: `Practitioner/${obs.createdBy}` }],
    issued: typeof obs.createdAt === 'string' ? obs.createdAt : obs.createdAt.toISOString(),
  };

  if (obs.effectiveDt) {
    resource.effectiveDateTime = typeof obs.effectiveDt === 'string'
      ? obs.effectiveDt
      : obs.effectiveDt.toISOString();
  }

  if (obs.valueQuantity !== null && obs.valueQuantity !== undefined) {
    resource.valueQuantity = {
      value: parseFloat(obs.valueQuantity),
      unit: obs.valueUnit ?? undefined,
    };
  } else if (obs.valueString) {
    resource.valueString = obs.valueString;
  } else if (obs.valueCodeable) {
    resource.valueCodeableConcept = { text: obs.valueCodeable };
  }

  if (obs.interpretation) {
    resource.interpretation = [{
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation',
        code: obs.interpretation,
      }],
    }];
  }

  if (obs.referenceRange) {
    resource.referenceRange = [{ text: obs.referenceRange }];
  }

  return resource;
}
