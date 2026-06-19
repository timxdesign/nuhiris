import { Injectable, Logger } from '@nestjs/common';
import {
  INinAuthLookupResult,
  IBiometricMatchResult,
  ILivenessResult,
  IFaceMatchResult,
} from '@nuhiris/shared-types';
import { INinAuthService } from '../interfaces/nin-auth-service.interface';

const MOCK_DELAY_MIN = 50;
const MOCK_DELAY_MAX = 200;

function delay(): Promise<void> {
  const ms = MOCK_DELAY_MIN + Math.random() * (MOCK_DELAY_MAX - MOCK_DELAY_MIN);
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const NOT_FOUND_NIN = '00000000000';
const NO_MATCH_NIN = '99999999999';

@Injectable()
export class MockNinAuthService implements INinAuthService {
  private readonly logger = new Logger(MockNinAuthService.name);

  async lookupNin(nin: string): Promise<INinAuthLookupResult> {
    await delay();
    this.logger.debug(`[MOCK] NIN lookup: ${nin.slice(0, 4)}****`);

    if (nin === NOT_FOUND_NIN) {
      return {
        found: false,
        nin,
        firstName: '',
        lastName: '',
        middleName: null,
        dateOfBirth: '',
        gender: '',
        state: '',
        lga: null,
        photoBase64: null,
        nimcReferenceId: `NIMC-MOCK-${Date.now()}`,
      };
    }

    return {
      found: true,
      nin,
      firstName: 'Oluwaseun',
      lastName: 'Adeyemi',
      middleName: 'Tobi',
      dateOfBirth: '1990-03-15',
      gender: 'male',
      state: 'Lagos',
      lga: 'Ikeja',
      photoBase64: 'mock-base64-photo-data',
      nimcReferenceId: `NIMC-MOCK-${Date.now()}`,
    };
  }

  async verifyBiometric(nin: string, _payload: unknown): Promise<IBiometricMatchResult> {
    await delay();
    this.logger.debug(`[MOCK] Biometric verify: ${nin.slice(0, 4)}****`);

    if (nin === NO_MATCH_NIN) {
      return { matched: false, confidenceScore: 0.2, nimcReferenceId: `NIMC-BIO-${Date.now()}` };
    }

    return { matched: true, confidenceScore: 0.98, nimcReferenceId: `NIMC-BIO-${Date.now()}` };
  }

  async verifyLiveness(nin: string, _payload: unknown): Promise<ILivenessResult> {
    await delay();
    this.logger.debug(`[MOCK] Liveness verify: ${nin.slice(0, 4)}****`);

    if (nin === NO_MATCH_NIN) {
      return { passed: false, confidenceScore: 0.3, nimcReferenceId: `NIMC-LIV-${Date.now()}` };
    }

    return { passed: true, confidenceScore: 0.95, nimcReferenceId: `NIMC-LIV-${Date.now()}` };
  }

  async verifyFaceMatch(nin: string, _payload: unknown): Promise<IFaceMatchResult> {
    await delay();
    this.logger.debug(`[MOCK] Face match: ${nin.slice(0, 4)}****`);

    if (nin === NO_MATCH_NIN) {
      return { matched: false, confidenceScore: 0.25, nimcReferenceId: `NIMC-FACE-${Date.now()}` };
    }

    return { matched: true, confidenceScore: 0.96, nimcReferenceId: `NIMC-FACE-${Date.now()}` };
  }
}
