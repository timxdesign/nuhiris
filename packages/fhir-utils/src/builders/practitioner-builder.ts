import type { Practitioner } from '@medplum/fhirtypes';
import { PROVIDER_IDENTIFIER_SYSTEM } from '../constants/identifier-systems';

export interface InternalProvider {
  providerId: string;
  fullName: string;
  category: string;
  specialty: string | null;
  licenceNumber: string | null;
  status: string;
}

export function buildFhirPractitioner(provider: InternalProvider): Practitioner {
  const parts = provider.fullName.trim().split(/\s+/);
  const family = parts.pop() ?? '';

  return {
    resourceType: 'Practitioner',
    id: provider.providerId,
    identifier: [
      {
        system: PROVIDER_IDENTIFIER_SYSTEM,
        value: provider.providerId,
      },
    ],
    name: [
      {
        use: 'official',
        family,
        given: parts,
      },
    ],
    active: provider.status === 'active',
    qualification: provider.licenceNumber
      ? [
          {
            identifier: [{ value: provider.licenceNumber }],
            code: {
              text: provider.category,
            },
          },
        ]
      : undefined,
  };
}
