import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { Patient } from '../patient/entities/patient.entity';
import { Encounter } from '../encounter/entities/encounter.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Patient, Encounter])],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
