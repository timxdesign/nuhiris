import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Patient } from '../entities/patient.entity';
import { NinEncryptionService } from './nin-encryption.service';

const JARO_WINKLER_THRESHOLD_AUTO = 0.95;
const JARO_WINKLER_THRESHOLD_REVIEW = 0.85;

export interface DuplicateCheckResult {
  exactMatch: Patient | null;
  probableMatches: Patient[];
  possibleMatches: Patient[];
}

@Injectable()
export class DuplicateDetectionService {
  constructor(
    @InjectRepository(Patient)
    private patientRepo: Repository<Patient>,
    private ninEncryption: NinEncryptionService,
  ) {}

  async checkByNin(nin: string): Promise<Patient | null> {
    const ninHash = this.ninEncryption.hash(nin);
    return this.patientRepo.findOne({ where: { ninHash } });
  }

  async checkByDemographics(
    fullName: string,
    dateOfBirth: string,
    state: string,
  ): Promise<DuplicateCheckResult> {
    const candidates = await this.patientRepo.find({
      where: { dateOfBirth, state },
      take: 50,
    });

    const probableMatches: Patient[] = [];
    const possibleMatches: Patient[] = [];

    for (const candidate of candidates) {
      const score = this.jaroWinkler(fullName.toLowerCase(), candidate.fullName.toLowerCase());
      if (score >= JARO_WINKLER_THRESHOLD_AUTO) {
        probableMatches.push(candidate);
      } else if (score >= JARO_WINKLER_THRESHOLD_REVIEW) {
        possibleMatches.push(candidate);
      }
    }

    return { exactMatch: null, probableMatches, possibleMatches };
  }

  private jaroWinkler(s1: string, s2: string): number {
    if (s1 === s2) return 1;
    if (s1.length === 0 || s2.length === 0) return 0;

    const matchWindow = Math.floor(Math.max(s1.length, s2.length) / 2) - 1;
    const s1Matches = new Array<boolean>(s1.length).fill(false);
    const s2Matches = new Array<boolean>(s2.length).fill(false);

    let matches = 0;
    let transpositions = 0;

    for (let i = 0; i < s1.length; i++) {
      const start = Math.max(0, i - matchWindow);
      const end = Math.min(i + matchWindow + 1, s2.length);
      for (let j = start; j < end; j++) {
        if (s2Matches[j] || s1[i] !== s2[j]) continue;
        s1Matches[i] = true;
        s2Matches[j] = true;
        matches++;
        break;
      }
    }

    if (matches === 0) return 0;

    let k = 0;
    for (let i = 0; i < s1.length; i++) {
      if (!s1Matches[i]) continue;
      while (!s2Matches[k]) k++;
      if (s1[i] !== s2[k]) transpositions++;
      k++;
    }

    const jaro =
      (matches / s1.length + matches / s2.length + (matches - transpositions / 2) / matches) / 3;

    let prefix = 0;
    for (let i = 0; i < Math.min(4, Math.min(s1.length, s2.length)); i++) {
      if (s1[i] === s2[i]) prefix++;
      else break;
    }

    return jaro + prefix * 0.1 * (1 - jaro);
  }
}
