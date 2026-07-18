import type { DocumentReference } from '@medplum/fhirtypes';
import { NUHI_IDENTIFIER_SYSTEM } from '../constants/identifier-systems';

export interface InternalDocumentRef {
  docId: string;
  nuhi: string;
  encounterId: string | null;
  docType: string;
  mimeType: string;
  fileSizeBytes: number | null;
  contentHash: string;
  uploadedBy: string;
  uploadedAt: Date | string;
}

export function buildFhirDocumentReference(doc: InternalDocumentRef): DocumentReference {
  const resource: DocumentReference = {
    resourceType: 'DocumentReference',
    id: doc.docId,
    status: 'current',
    type: { text: doc.docType },
    subject: {
      reference: `Patient/${doc.nuhi}`,
      identifier: { system: NUHI_IDENTIFIER_SYSTEM, value: doc.nuhi },
    },
    author: [{ reference: `Practitioner/${doc.uploadedBy}` }],
    date: typeof doc.uploadedAt === 'string' ? doc.uploadedAt : doc.uploadedAt.toISOString(),
    content: [
      {
        attachment: {
          contentType: doc.mimeType,
          size: doc.fileSizeBytes ?? undefined,
          hash: doc.contentHash,
          url: `/documents/${doc.docId}/download`,
        },
      },
    ],
  };

  if (doc.encounterId) {
    resource.context = { encounter: [{ reference: `Encounter/${doc.encounterId}` }] };
  }

  return resource;
}
