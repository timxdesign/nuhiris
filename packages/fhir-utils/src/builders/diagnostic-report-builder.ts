import type { DiagnosticReport } from '@medplum/fhirtypes';
import { LOINC_SYSTEM } from '../constants/coding-systems';

export interface InternalLabResult {
  resultId: string;
  orderId: string;
  encounterId: string;
  nuhi: string;
  loincCode: string;
  testName: string;
  performedBy: string;
  facilityId: string;
  resultValue: string | null;
  resultUnit: string | null;
  referenceRange: string | null;
  interpretation: string | null;
  notes: string | null;
  resultedAt: Date | string;
  reportDocId: string | null;
}

export function buildFhirDiagnosticReport(lr: InternalLabResult): DiagnosticReport {
  const resource: DiagnosticReport = {
    resourceType: 'DiagnosticReport',
    id: lr.resultId,
    status: 'final',
    code: {
      coding: [{ system: LOINC_SYSTEM, code: lr.loincCode, display: lr.testName }],
    },
    subject: { reference: `Patient/${lr.nuhi}` },
    encounter: { reference: `Encounter/${lr.encounterId}` },
    performer: [{ reference: `Practitioner/${lr.performedBy}` }],
    effectiveDateTime: typeof lr.resultedAt === 'string' ? lr.resultedAt : lr.resultedAt.toISOString(),
    issued: typeof lr.resultedAt === 'string' ? lr.resultedAt : lr.resultedAt.toISOString(),
    basedOn: [{ reference: `ServiceRequest/${lr.orderId}` }],
  };

  if (lr.resultValue) {
    resource.conclusion = `${lr.resultValue}${lr.resultUnit ? ` ${lr.resultUnit}` : ''}`;
  }

  if (lr.notes) {
    resource.conclusion = resource.conclusion
      ? `${resource.conclusion} — ${lr.notes}`
      : lr.notes;
  }

  if (lr.reportDocId) {
    resource.presentedForm = [{ url: `DocumentReference/${lr.reportDocId}` }];
  }

  return resource;
}
