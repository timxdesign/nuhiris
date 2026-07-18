import type { Immunization } from '@medplum/fhirtypes';
import { NUHI_IDENTIFIER_SYSTEM } from '../constants/identifier-systems';

export interface InternalImmunisation {
  immunisationId: string;
  nuhi: string;
  encounterId: string | null;
  vaccineCode: string;
  vaccineName: string;
  doseNumber: number | null;
  lotNumber: string | null;
  site: string | null;
  route: string | null;
  administeredAt: Date | string;
  administeredBy: string;
  facilityId: string;
  status: string;
  notes: string | null;
}

export function buildFhirImmunization(imm: InternalImmunisation): Immunization {
  const resource: Immunization = {
    resourceType: 'Immunization',
    id: imm.immunisationId,
    status: imm.status === 'completed' ? 'completed' : 'not-done',
    vaccineCode: {
      coding: [{ code: imm.vaccineCode, display: imm.vaccineName }],
      text: imm.vaccineName,
    },
    patient: {
      reference: `Patient/${imm.nuhi}`,
      identifier: { system: NUHI_IDENTIFIER_SYSTEM, value: imm.nuhi },
    },
    occurrenceDateTime: typeof imm.administeredAt === 'string'
      ? imm.administeredAt
      : imm.administeredAt.toISOString(),
    performer: [{ actor: { reference: `Practitioner/${imm.administeredBy}` } }],
    location: { reference: `Organization/${imm.facilityId}` },
    lotNumber: imm.lotNumber ?? undefined,
  };

  if (imm.encounterId) {
    resource.encounter = { reference: `Encounter/${imm.encounterId}` };
  }

  if (imm.doseNumber !== null) {
    resource.protocolApplied = [{ doseNumberPositiveInt: imm.doseNumber }];
  }

  if (imm.site) {
    resource.site = { text: imm.site };
  }

  if (imm.route) {
    resource.route = { text: imm.route };
  }

  if (imm.notes) {
    resource.note = [{ text: imm.notes }];
  }

  return resource;
}
