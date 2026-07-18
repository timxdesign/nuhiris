import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { FhirService } from './fhir.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { SkipConsent } from '../consent/guards/consent.guard';

@Controller('fhir/r4')
@UseGuards(JwtAuthGuard, RolesGuard)
@SkipConsent()
export class FhirController {
  constructor(private fhirService: FhirService) {}

  // --- Patient ---

  @Get('Patient/:id')
  readPatient(@Param('id') id: string) {
    return this.fhirService.readPatient(id);
  }

  @Get('Patient')
  searchPatient(@Query() params: Record<string, string>) {
    return this.fhirService.searchPatient(params);
  }

  // --- Practitioner ---

  @Get('Practitioner/:id')
  readPractitioner(@Param('id') id: string) {
    return this.fhirService.readPractitioner(id);
  }

  @Get('Practitioner')
  searchPractitioner(@Query() params: Record<string, string>) {
    return this.fhirService.searchPractitioner(params);
  }

  // --- Organization ---

  @Get('Organization/:id')
  readOrganization(@Param('id') id: string) {
    return this.fhirService.readOrganization(id);
  }

  @Get('Organization')
  searchOrganization(@Query() params: Record<string, string>) {
    return this.fhirService.searchOrganization(params);
  }

  // --- Encounter ---

  @Get('Encounter/:id')
  readEncounter(@Param('id') id: string) {
    return this.fhirService.readEncounter(id);
  }

  @Get('Encounter')
  searchEncounter(@Query() params: Record<string, string>) {
    return this.fhirService.searchEncounter(params);
  }

  // --- Condition ---

  @Get('Condition/:id')
  readCondition(@Param('id') id: string) {
    return this.fhirService.readCondition(id);
  }

  @Get('Condition')
  searchCondition(@Query() params: Record<string, string>) {
    return this.fhirService.searchCondition(params);
  }

  // --- Observation ---

  @Get('Observation/:id')
  readObservation(@Param('id') id: string) {
    return this.fhirService.readObservation(id);
  }

  @Get('Observation')
  searchObservation(@Query() params: Record<string, string>) {
    return this.fhirService.searchObservation(params);
  }

  // --- MedicationRequest ---

  @Get('MedicationRequest/:id')
  readMedicationRequest(@Param('id') id: string) {
    return this.fhirService.readMedicationRequest(id);
  }

  @Get('MedicationRequest')
  searchMedicationRequest(@Query() params: Record<string, string>) {
    return this.fhirService.searchMedicationRequest(params);
  }

  // --- MedicationDispense ---

  @Get('MedicationDispense/:id')
  readMedicationDispense(@Param('id') id: string) {
    return this.fhirService.readMedicationDispense(id);
  }

  // --- AllergyIntolerance ---

  @Get('AllergyIntolerance/:id')
  readAllergyIntolerance(@Param('id') id: string) {
    return this.fhirService.readAllergyIntolerance(id);
  }

  @Get('AllergyIntolerance')
  searchAllergyIntolerance(@Query() params: Record<string, string>) {
    return this.fhirService.searchAllergyIntolerance(params);
  }

  // --- Immunization ---

  @Get('Immunization/:id')
  readImmunization(@Param('id') id: string) {
    return this.fhirService.readImmunization(id);
  }

  @Get('Immunization')
  searchImmunization(@Query() params: Record<string, string>) {
    return this.fhirService.searchImmunization(params);
  }

  // --- DiagnosticReport ---

  @Get('DiagnosticReport/:id')
  readDiagnosticReport(@Param('id') id: string) {
    return this.fhirService.readDiagnosticReport(id);
  }

  // --- ServiceRequest ---

  @Get('ServiceRequest/:id')
  readServiceRequest(@Param('id') id: string) {
    return this.fhirService.readServiceRequest(id);
  }

  // --- DocumentReference ---

  @Get('DocumentReference/:id')
  readDocumentReference(@Param('id') id: string) {
    return this.fhirService.readDocumentReference(id);
  }

  @Get('DocumentReference')
  searchDocumentReference(@Query() params: Record<string, string>) {
    return this.fhirService.searchDocumentReference(params);
  }

  // --- Consent ---

  @Get('Consent/:id')
  readConsent(@Param('id') id: string) {
    return this.fhirService.readConsent(id);
  }

  @Get('Consent')
  searchConsent(@Query() params: Record<string, string>) {
    return this.fhirService.searchConsent(params);
  }

  // --- Metadata (CapabilityStatement) ---

  @Get('metadata')
  metadata() {
    return {
      resourceType: 'CapabilityStatement',
      status: 'active',
      date: new Date().toISOString(),
      kind: 'instance',
      software: { name: 'NUHIRIS FHIR Gateway', version: '1.0.0' },
      fhirVersion: '4.0.1',
      format: ['json'],
      rest: [
        {
          mode: 'server',
          resource: [
            'Patient', 'Practitioner', 'Organization', 'Encounter',
            'Condition', 'Observation', 'MedicationRequest', 'MedicationDispense',
            'AllergyIntolerance', 'Immunization', 'DiagnosticReport', 'ServiceRequest',
            'DocumentReference', 'Consent',
          ].map((type) => ({
            type,
            interaction: [{ code: 'read' }, { code: 'search-type' }],
          })),
        },
      ],
    };
  }
}
