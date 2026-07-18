import type { MedicationDispense } from '@medplum/fhirtypes';

export interface InternalDispense {
  dispenseId: string;
  prescriptionId: string;
  pharmacistId: string;
  facilityId: string;
  quantity: string;
  dispensedAt: Date | string;
  notes: string | null;
}

export function buildFhirMedicationDispense(d: InternalDispense): MedicationDispense {
  const resource: MedicationDispense = {
    resourceType: 'MedicationDispense',
    id: d.dispenseId,
    status: 'completed',
    authorizingPrescription: [{ reference: `MedicationRequest/${d.prescriptionId}` }],
    performer: [{ actor: { reference: `Practitioner/${d.pharmacistId}` } }],
    location: { reference: `Organization/${d.facilityId}` },
    quantity: { value: parseFloat(d.quantity) || undefined, unit: 'units' },
    whenHandedOver: typeof d.dispensedAt === 'string' ? d.dispensedAt : d.dispensedAt.toISOString(),
  };

  if (d.notes) {
    resource.note = [{ text: d.notes }];
  }

  return resource;
}
