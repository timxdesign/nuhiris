import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BiometricEvent } from '../device/entities/biometric-event.entity';
import {
  BiometricEventType,
  BiometricMethod,
  BiometricResult,
} from '@nuhiris/shared-types';

interface LookupParams {
  nin: string;
  found: boolean;
  nimcReferenceId: string;
  performedBy: string;
  facilityId: string | null;
}

interface LivenessParams {
  nin: string;
  passed: boolean;
  confidenceScore: number;
  nimcReferenceId: string;
  performedBy: string;
  facilityId: string | null;
}

interface FaceMatchParams {
  nin: string;
  matched: boolean;
  confidenceScore: number;
  nimcReferenceId: string;
  performedBy: string;
  facilityId: string | null;
}

@Injectable()
export class BiometricEventService {
  constructor(
    @InjectRepository(BiometricEvent)
    private biometricEventRepo: Repository<BiometricEvent>,
  ) {}

  async recordLookup(params: LookupParams): Promise<BiometricEvent> {
    return this.biometricEventRepo.save(
      this.biometricEventRepo.create({
        nin: params.nin,
        eventType: BiometricEventType.NIN_LOOKUP,
        method: BiometricMethod.DOCUMENTARY,
        result: params.found ? BiometricResult.MATCH : BiometricResult.NO_MATCH,
        nimcApiCalled: true,
        nimcReferenceId: params.nimcReferenceId,
        performedBy: params.performedBy,
        facilityId: params.facilityId,
        deviceId: null,
      }),
    );
  }

  async recordLiveness(params: LivenessParams): Promise<BiometricEvent> {
    return this.biometricEventRepo.save(
      this.biometricEventRepo.create({
        nin: params.nin,
        eventType: BiometricEventType.LIVENESS_CHECK,
        method: BiometricMethod.FACE_LIVENESS,
        result: params.passed ? BiometricResult.MATCH : BiometricResult.LIVENESS_FAIL,
        confidenceScore: params.confidenceScore.toFixed(4),
        nimcApiCalled: true,
        nimcReferenceId: params.nimcReferenceId,
        livenessPassed: params.passed,
        performedBy: params.performedBy,
        facilityId: params.facilityId,
        deviceId: null,
      }),
    );
  }

  async recordFaceMatch(params: FaceMatchParams): Promise<BiometricEvent> {
    return this.biometricEventRepo.save(
      this.biometricEventRepo.create({
        nin: params.nin,
        eventType: BiometricEventType.IDENTITY_CHECK,
        method: BiometricMethod.FACE,
        result: params.matched ? BiometricResult.MATCH : BiometricResult.NO_MATCH,
        confidenceScore: params.confidenceScore.toFixed(4),
        nimcApiCalled: true,
        nimcReferenceId: params.nimcReferenceId,
        performedBy: params.performedBy,
        facilityId: params.facilityId,
        deviceId: null,
      }),
    );
  }

  async recordRegistration(params: FaceMatchParams & { nuhi: string }): Promise<BiometricEvent> {
    return this.biometricEventRepo.save(
      this.biometricEventRepo.create({
        nuhi: params.nuhi,
        nin: params.nin,
        eventType: BiometricEventType.REGISTRATION,
        method: BiometricMethod.FACE,
        result: params.matched ? BiometricResult.MATCH : BiometricResult.NO_MATCH,
        confidenceScore: params.confidenceScore.toFixed(4),
        nimcApiCalled: true,
        nimcReferenceId: params.nimcReferenceId,
        performedBy: params.performedBy,
        facilityId: params.facilityId,
        deviceId: null,
      }),
    );
  }
}
