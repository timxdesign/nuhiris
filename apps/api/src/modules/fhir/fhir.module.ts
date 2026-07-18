import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FhirController } from './fhir.controller';
import { FhirService } from './fhir.service';
import { Patient } from '../patient/entities/patient.entity';
import { Provider } from '../provider/entities/provider.entity';
import { Facility } from '../facility/entities/facility.entity';
import { Encounter } from '../encounter/entities/encounter.entity';
import { Diagnosis } from '../encounter/entities/diagnosis.entity';
import { Observation } from '../encounter/entities/observation.entity';
import { Prescription } from '../encounter/entities/prescription.entity';
import { Dispense } from '../encounter/entities/dispense.entity';
import { Allergy } from '../encounter/entities/allergy.entity';
import { Immunisation } from '../encounter/entities/immunisation.entity';
import { LabOrder } from '../encounter/entities/lab-order.entity';
import { LabResult } from '../encounter/entities/lab-result.entity';
import { Referral } from '../encounter/entities/referral.entity';
import { DocumentRef } from '../document/entities/document-ref.entity';
import { Consent } from '../consent/entities/consent.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Patient,
      Provider,
      Facility,
      Encounter,
      Diagnosis,
      Observation,
      Prescription,
      Dispense,
      Allergy,
      Immunisation,
      LabOrder,
      LabResult,
      Referral,
      DocumentRef,
      Consent,
    ]),
  ],
  controllers: [FhirController],
  providers: [FhirService],
})
export class FhirModule {}
