import { EncounterStatus, EncounterType } from '../enums';

export interface IEncounter {
  encounterId: string;
  nuhi: string;
  providerId: string;
  facilityId: string;
  encounterType: EncounterType;
  status: EncounterStatus;
  reason: string | null;
  dateTime: string;
  closedAt: string | null;
  notes: string | null;
  createdAt: string;
}
