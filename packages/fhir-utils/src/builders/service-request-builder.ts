import type { ServiceRequest } from '@medplum/fhirtypes';
import { LOINC_SYSTEM } from '../constants/coding-systems';

export interface InternalLabOrder {
  orderId: string;
  encounterId: string;
  nuhi: string;
  orderedBy: string;
  loincCode: string;
  testName: string;
  urgency: string;
  status: string;
  orderedAt: Date | string;
}

export interface InternalReferral {
  referralId: string;
  encounterId: string;
  nuhi: string;
  referringProviderId: string;
  receivingFacilityId: string;
  receivingProviderId: string | null;
  urgency: string;
  reason: string;
  clinicalSummary: string | null;
  status: string;
  referredAt: Date | string;
}

function mapLabOrderStatus(status: string): ServiceRequest['status'] {
  switch (status) {
    case 'pending':
      return 'active';
    case 'completed':
      return 'completed';
    case 'cancelled':
      return 'revoked';
    default:
      return 'active';
  }
}

function mapReferralStatus(status: string): ServiceRequest['status'] {
  switch (status) {
    case 'pending':
      return 'active';
    case 'accepted':
      return 'active';
    case 'completed':
      return 'completed';
    case 'rejected':
      return 'revoked';
    default:
      return 'active';
  }
}

function mapPriority(urgency: string): ServiceRequest['priority'] {
  switch (urgency) {
    case 'stat':
      return 'stat';
    case 'urgent':
      return 'urgent';
    case 'asap':
      return 'asap';
    default:
      return 'routine';
  }
}

export function buildFhirServiceRequestFromLabOrder(order: InternalLabOrder): ServiceRequest {
  return {
    resourceType: 'ServiceRequest',
    id: order.orderId,
    status: mapLabOrderStatus(order.status),
    intent: 'order',
    category: [{ coding: [{ system: 'http://snomed.info/sct', code: '108252007', display: 'Laboratory procedure' }] }],
    code: {
      coding: [{ system: LOINC_SYSTEM, code: order.loincCode, display: order.testName }],
    },
    subject: { reference: `Patient/${order.nuhi}` },
    encounter: { reference: `Encounter/${order.encounterId}` },
    requester: { reference: `Practitioner/${order.orderedBy}` },
    priority: mapPriority(order.urgency),
    authoredOn: typeof order.orderedAt === 'string' ? order.orderedAt : order.orderedAt.toISOString(),
  };
}

export function buildFhirServiceRequestFromReferral(ref: InternalReferral): ServiceRequest {
  const resource: ServiceRequest = {
    resourceType: 'ServiceRequest',
    id: ref.referralId,
    status: mapReferralStatus(ref.status),
    intent: 'order',
    category: [{ coding: [{ system: 'http://snomed.info/sct', code: '3457005', display: 'Patient referral' }] }],
    code: { text: ref.reason },
    subject: { reference: `Patient/${ref.nuhi}` },
    encounter: { reference: `Encounter/${ref.encounterId}` },
    requester: { reference: `Practitioner/${ref.referringProviderId}` },
    performer: ref.receivingProviderId
      ? [{ reference: `Practitioner/${ref.receivingProviderId}` }]
      : undefined,
    locationReference: [{ reference: `Organization/${ref.receivingFacilityId}` }],
    priority: mapPriority(ref.urgency),
    authoredOn: typeof ref.referredAt === 'string' ? ref.referredAt : ref.referredAt.toISOString(),
  };

  if (ref.clinicalSummary) {
    resource.note = [{ text: ref.clinicalSummary }];
  }

  return resource;
}
