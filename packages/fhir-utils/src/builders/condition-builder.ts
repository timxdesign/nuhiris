import type { Condition } from '@medplum/fhirtypes';
import { ICD11_SYSTEM } from '../constants/coding-systems';
import { NUHI_IDENTIFIER_SYSTEM } from '../constants/identifier-systems';

export interface InternalDiagnosis {
  diagnosisId: string;
  encounterId: string;
  nuhi: string;
  icd11Code: string;
  description: string | null;
  onsetDate: string | null;
  status: string | null;
  severity: string | null;
  createdBy: string;
  createdAt: Date | string;
}

function mapClinicalStatus(status: string | null): { coding: Array<{ system: string; code: string }> } {
  const code = status === 'resolved' ? 'resolved'
    : status === 'inactive' ? 'inactive'
    : 'active';
  return {
    coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-clinical', code }],
  };
}

function mapSeverity(severity: string | null): Condition['severity'] {
  if (!severity) return undefined;
  const map: Record<string, string> = {
    mild: '255604002',
    moderate: '6736007',
    severe: '24484000',
  };
  const snomedCode = map[severity.toLowerCase()];
  if (!snomedCode) return { text: severity };
  return {
    coding: [{ system: 'http://snomed.info/sct', code: snomedCode, display: severity }],
  };
}

export function buildFhirCondition(diag: InternalDiagnosis): Condition {
  const resource: Condition = {
    resourceType: 'Condition',
    id: diag.diagnosisId,
    clinicalStatus: mapClinicalStatus(diag.status),
    code: {
      coding: [{ system: ICD11_SYSTEM, code: diag.icd11Code, display: diag.description ?? undefined }],
    },
    subject: {
      reference: `Patient/${diag.nuhi}`,
      identifier: { system: NUHI_IDENTIFIER_SYSTEM, value: diag.nuhi },
    },
    encounter: { reference: `Encounter/${diag.encounterId}` },
    recorder: { reference: `Practitioner/${diag.createdBy}` },
    recordedDate: typeof diag.createdAt === 'string' ? diag.createdAt : diag.createdAt.toISOString(),
    severity: mapSeverity(diag.severity),
  };

  if (diag.onsetDate) {
    resource.onsetDateTime = diag.onsetDate;
  }

  return resource;
}
