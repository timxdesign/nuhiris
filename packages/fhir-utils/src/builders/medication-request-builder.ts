import type { MedicationRequest } from '@medplum/fhirtypes';
import { SNOMED_SYSTEM } from '../constants/coding-systems';
import { NUHI_IDENTIFIER_SYSTEM } from '../constants/identifier-systems';

export interface InternalPrescription {
  prescriptionId: string;
  encounterId: string;
  nuhi: string;
  prescriberId: string;
  drugCode: string;
  drugName: string;
  dosage: string;
  frequency: string;
  duration: string | null;
  route: string | null;
  quantity: string | null;
  instructions: string | null;
  status: string;
  createdAt: Date | string;
}

function mapStatus(status: string): MedicationRequest['status'] {
  switch (status) {
    case 'active':
      return 'active';
    case 'completed':
      return 'completed';
    case 'cancelled':
      return 'cancelled';
    case 'stopped':
      return 'stopped';
    default:
      return 'active';
  }
}

export function buildFhirMedicationRequest(rx: InternalPrescription): MedicationRequest {
  const resource: MedicationRequest = {
    resourceType: 'MedicationRequest',
    id: rx.prescriptionId,
    status: mapStatus(rx.status),
    intent: 'order',
    medicationCodeableConcept: {
      coding: [{ system: SNOMED_SYSTEM, code: rx.drugCode, display: rx.drugName }],
      text: rx.drugName,
    },
    subject: {
      reference: `Patient/${rx.nuhi}`,
      identifier: { system: NUHI_IDENTIFIER_SYSTEM, value: rx.nuhi },
    },
    encounter: { reference: `Encounter/${rx.encounterId}` },
    requester: { reference: `Practitioner/${rx.prescriberId}` },
    authoredOn: typeof rx.createdAt === 'string' ? rx.createdAt : rx.createdAt.toISOString(),
    dosageInstruction: [
      {
        text: `${rx.dosage} ${rx.frequency}${rx.duration ? ` for ${rx.duration}` : ''}`,
        route: rx.route ? { text: rx.route } : undefined,
      },
    ],
  };

  if (rx.quantity) {
    resource.dispenseRequest = { quantity: { value: parseFloat(rx.quantity) || undefined, unit: 'units' } };
  }

  if (rx.instructions) {
    resource.note = [{ text: rx.instructions }];
  }

  return resource;
}
