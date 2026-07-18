import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Encounter } from './entities/encounter.entity';
import { Diagnosis } from './entities/diagnosis.entity';
import { Observation } from './entities/observation.entity';
import { Prescription } from './entities/prescription.entity';
import { Dispense } from './entities/dispense.entity';
import { LabOrder } from './entities/lab-order.entity';
import { LabResult } from './entities/lab-result.entity';
import { Allergy } from './entities/allergy.entity';
import { Referral } from './entities/referral.entity';
import { Immunisation } from './entities/immunisation.entity';
import { EncounterService } from './encounter.service';
import { EncounterController } from './encounter.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Encounter,
      Diagnosis,
      Observation,
      Prescription,
      Dispense,
      LabOrder,
      LabResult,
      Allergy,
      Referral,
      Immunisation,
    ]),
  ],
  controllers: [EncounterController],
  providers: [EncounterService],
  exports: [EncounterService],
})
export class EncounterModule {}
