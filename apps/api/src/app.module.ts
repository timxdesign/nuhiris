import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';

import databaseConfig from './config/database.config';
import redisConfig from './config/redis.config';
import keycloakConfig from './config/keycloak.config';
import minioConfig from './config/minio.config';
import appConfig from './config/app.config';
import vaultConfig from './config/vault.config';

import { HealthModule } from './modules/health/health.module';
import { ExternalModule } from './modules/external/external.module';
import { AuthModule } from './modules/auth/auth.module';
import { AuditModule } from './modules/audit/audit.module';
import { DeviceModule } from './modules/device/device.module';
import { PatientModule } from './modules/patient/patient.module';
import { ProviderModule } from './modules/provider/provider.module';
import { FacilityModule } from './modules/facility/facility.module';
import { EncounterModule } from './modules/encounter/encounter.module';
import { ConsentModule } from './modules/consent/consent.module';
import { DocumentModule } from './modules/document/document.module';
import { FhirModule } from './modules/fhir/fhir.module';
import { OAuthClientModule } from './modules/oauth-client/oauth-client.module';
import { TerminologyModule } from './modules/terminology/terminology.module';
import { VaultModule } from './modules/vault/vault.module';
import { MetricsModule } from './modules/metrics/metrics.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { OAuthClient } from './modules/oauth-client/entities/oauth-client.entity';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from './modules/auth/guards/roles.guard';
import { ConsentGuard } from './modules/consent/guards/consent.guard';
import { AuditInterceptor } from './modules/audit/audit.interceptor';

import { Patient } from './modules/patient/entities/patient.entity';
import { PatientHistory } from './modules/patient/entities/patient-history.entity';
import { UserAccount } from './modules/auth/entities/user-account.entity';
import { Facility } from './modules/facility/entities/facility.entity';
import { Provider } from './modules/provider/entities/provider.entity';
import { ProviderAffiliation } from './modules/provider/entities/provider-affiliation.entity';
import { RegisteredDevice } from './modules/device/entities/registered-device.entity';
import { BiometricEvent } from './modules/device/entities/biometric-event.entity';
import { Encounter } from './modules/encounter/entities/encounter.entity';
import { Diagnosis } from './modules/encounter/entities/diagnosis.entity';
import { Observation } from './modules/encounter/entities/observation.entity';
import { Prescription } from './modules/encounter/entities/prescription.entity';
import { Dispense } from './modules/encounter/entities/dispense.entity';
import { LabOrder } from './modules/encounter/entities/lab-order.entity';
import { LabResult } from './modules/encounter/entities/lab-result.entity';
import { Allergy } from './modules/encounter/entities/allergy.entity';
import { Referral } from './modules/encounter/entities/referral.entity';
import { Immunisation } from './modules/encounter/entities/immunisation.entity';
import { DocumentRef } from './modules/document/entities/document-ref.entity';
import { Consent } from './modules/consent/entities/consent.entity';
import { AuditEvent } from './modules/audit/entities/audit-event.entity';
import { Provenance } from './modules/audit/entities/provenance.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
      load: [databaseConfig, redisConfig, keycloakConfig, minioConfig, appConfig, vaultConfig],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        host: config.get<string>('database.host'),
        port: config.get<number>('database.port'),
        database: config.get<string>('database.name'),
        username: config.get<string>('database.username'),
        password: config.get<string>('database.password'),
        entities: [
          Patient,
          PatientHistory,
          UserAccount,
          Facility,
          Provider,
          ProviderAffiliation,
          RegisteredDevice,
          BiometricEvent,
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
          DocumentRef,
          Consent,
          AuditEvent,
          Provenance,
          OAuthClient,
        ],
        synchronize: false,
        logging: config.get<string>('app.nodeEnv') === 'development',
      }),
    }),
    EventEmitterModule.forRoot(),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    ScheduleModule.forRoot(),
    VaultModule,
    MetricsModule,
    HealthModule,
    ExternalModule,
    AuthModule,
    AuditModule,
    DeviceModule,
    PatientModule,
    ProviderModule,
    FacilityModule,
    EncounterModule,
    ConsentModule,
    DocumentModule,
    FhirModule,
    OAuthClientModule,
    TerminologyModule,
    AnalyticsModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: ConsentGuard },
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
  ],
})
export class AppModule {}
