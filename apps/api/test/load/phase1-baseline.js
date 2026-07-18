import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const BASE_URL = __ENV.API_URL || 'http://localhost:3000';
const AUTH_TOKEN = __ENV.AUTH_TOKEN || '';

const errorRate = new Rate('errors');
const encounterCreateDuration = new Trend('encounter_create_duration');
const diagnosisAddDuration = new Trend('diagnosis_add_duration');
const patientSearchDuration = new Trend('patient_search_duration');

export const options = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '1m', target: 50 },
    { duration: '2m', target: 100 },
    { duration: '1m', target: 50 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    errors: ['rate<0.05'],
    encounter_create_duration: ['p(95)<300'],
    diagnosis_add_duration: ['p(95)<200'],
    patient_search_duration: ['p(95)<400'],
  },
};

const headers = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${AUTH_TOKEN}`,
};

const PATIENT_NUHI = __ENV.PATIENT_NUHI || 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';

export default function () {
  group('Health Check', () => {
    const res = http.get(`${BASE_URL}/health`);
    check(res, { 'health 200': (r) => r.status === 200 });
    errorRate.add(res.status !== 200);
  });

  group('Create Encounter', () => {
    const payload = JSON.stringify({
      nuhi: PATIENT_NUHI,
      encounterType: 'outpatient',
      reason: 'Routine checkup',
    });

    const res = http.post(`${BASE_URL}/encounters`, payload, { headers });
    encounterCreateDuration.add(res.timings.duration);
    const success = res.status === 201;
    check(res, { 'encounter created': () => success });
    errorRate.add(!success);

    if (success) {
      const encounter = JSON.parse(res.body);
      const encounterId = encounter.encounterId;

      group('Add Diagnosis', () => {
        const diagPayload = JSON.stringify({
          icd11Code: '1A00',
          description: 'Cholera',
          status: 'active',
        });
        const diagRes = http.post(
          `${BASE_URL}/encounters/${encounterId}/diagnoses`,
          diagPayload,
          { headers },
        );
        diagnosisAddDuration.add(diagRes.timings.duration);
        check(diagRes, { 'diagnosis added': (r) => r.status === 201 });
        errorRate.add(diagRes.status !== 201);
      });

      group('Add Prescription', () => {
        const rxPayload = JSON.stringify({
          drugCode: 'SNOMED-12345',
          drugName: 'Amoxicillin',
          dosage: '500mg',
          frequency: 'TDS',
          duration: '7 days',
        });
        const rxRes = http.post(
          `${BASE_URL}/encounters/${encounterId}/prescriptions`,
          rxPayload,
          { headers },
        );
        check(rxRes, { 'prescription added': (r) => r.status === 201 });
        errorRate.add(rxRes.status !== 201);
      });

      group('Add Lab Order', () => {
        const labPayload = JSON.stringify({
          loincCode: '2093-3',
          testName: 'Total Cholesterol',
          urgency: 'routine',
        });
        const labRes = http.post(
          `${BASE_URL}/encounters/${encounterId}/lab-orders`,
          labPayload,
          { headers },
        );
        check(labRes, { 'lab order created': (r) => r.status === 201 });
        errorRate.add(labRes.status !== 201);
      });
    }
  });

  group('Search Patients', () => {
    const res = http.get(`${BASE_URL}/patients?firstName=John&limit=20`, { headers });
    patientSearchDuration.add(res.timings.duration);
    check(res, { 'search returns 200': (r) => r.status === 200 });
    errorRate.add(res.status !== 200);
  });

  group('List Providers', () => {
    const res = http.get(`${BASE_URL}/providers?limit=20`, { headers });
    check(res, { 'providers list 200': (r) => r.status === 200 });
    errorRate.add(res.status !== 200);
  });

  group('List Facilities', () => {
    const res = http.get(`${BASE_URL}/facilities?limit=20`, { headers });
    check(res, { 'facilities list 200': (r) => r.status === 200 });
    errorRate.add(res.status !== 200);
  });

  sleep(1);
}

export function handleSummary(data) {
  return {
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
    'test/load/phase1-results.json': JSON.stringify(data, null, 2),
  };
}

function textSummary(data, opts) {
  const metrics = data.metrics;
  const lines = [
    '╔═══════════���══════════════════════════════════════════╗',
    '║       NUHIRIS Phase 1 — Load Test Results           ║',
    '╠══════════════════════════════════════════════════════╣',
    `║ Total Requests:     ${metrics.http_reqs?.values?.count || 0}`,
    `║ Failed Requests:    ${metrics.http_req_failed?.values?.passes || 0}`,
    `║ Avg Duration:       ${(metrics.http_req_duration?.values?.avg || 0).toFixed(2)}ms`,
    `║ P95 Duration:       ${(metrics.http_req_duration?.values?.['p(95)'] || 0).toFixed(2)}ms`,
    `║ P99 Duration:       ${(metrics.http_req_duration?.values?.['p(99)'] || 0).toFixed(2)}ms`,
    `║ Error Rate:         ${((metrics.errors?.values?.rate || 0) * 100).toFixed(2)}%`,
    '╠══════════════════════════════════════════════════════╣',
    `║ Encounter Create P95: ${(metrics.encounter_create_duration?.values?.['p(95)'] || 0).toFixed(2)}ms`,
    `║ Diagnosis Add P95:    ${(metrics.diagnosis_add_duration?.values?.['p(95)'] || 0).toFixed(2)}ms`,
    `║ Patient Search P95:   ${(metrics.patient_search_duration?.values?.['p(95)'] || 0).toFixed(2)}ms`,
    '╚══════════════════════════════════════════════════════╝',
  ];
  return lines.join('\n') + '\n';
}
