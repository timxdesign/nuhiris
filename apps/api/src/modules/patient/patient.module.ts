import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Patient } from './entities/patient.entity';
import { PatientHistory } from './entities/patient-history.entity';
import { UserAccount } from '../auth/entities/user-account.entity';
import { PatientService } from './patient.service';
import { PatientController } from './patient.controller';
import { NinEncryptionService } from './services/nin-encryption.service';
import { DuplicateDetectionService } from './services/duplicate-detection.service';

@Module({
  imports: [TypeOrmModule.forFeature([Patient, PatientHistory, UserAccount])],
  controllers: [PatientController],
  providers: [PatientService, NinEncryptionService, DuplicateDetectionService],
  exports: [PatientService, NinEncryptionService],
})
export class PatientModule {}
