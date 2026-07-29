# Frontend Completion Plan

Status of the web portal as of 2026-07-19: pages exist for every role and the
records-officer and doctor journeys are wired end-to-end, but several role
scenarios have no functional UI and the admin screens are read-only. This plan
closes each gap, ordered by spec priority (`projecctbrief.md` §11, §16).

Conventions for all work below (matches existing code):

- Pages are `'use client'` components using `useState`/`useEffect` and the
  typed `api<T>()` client in `apps/web/lib/api-client.ts`.
- Role gating uses `UserRole` values from `@nuhiris/shared-types`
  (`national_admin`, `facility_admin`, `medical_officer`, `nurse`,
  `pharmacist`, `lab_scientist`, `health_records_officer`, `audit_inspector`,
  `patient`) against `user.role` from `useAuth()`.
- Every page that shows patient data renders the shared
  "This access is being logged" indicator (spec §11 UX requirements).

## P0 — Green build (blockers)

- [x] Fix web type-check: `next`'s d.ts files resolved `@types/react` 18.3.31
      via pnpm's hidden hoist dir (`node_modules/.pnpm/node_modules`), clashing
      with web's 19.2.17. Fixed with `paths` entries in `apps/web/tsconfig.json`
      pinning `react`/`react-dom` types to web's local copies.
- [x] Fix mobile type-check: added missing `@react-native-community/netinfo`
      dependency; removed unused `react-native-uuid` import from
      `register-patient.tsx`.

## P1 — Consent & break-glass UI (compliance-critical)

API already available: `POST/GET/DELETE /patients/:nuhi/consents`,
`POST /consents/check`, `POST /access/break-glass`.

- [x] `AccessLoggedBadge` shared component; rendered on every patient-data page.
- [x] Consent status section on the patient profile
      (`/patients/[nuhi]`): green = active consent, grey = none,
      red = revoked. List consents; grant (grantee type/id, purpose, scope,
      validTo) and revoke actions for authorised staff.
- [x] Break-glass full-screen modal: mandatory reason field, cannot be
      dismissed without completing; calls `POST /access/break-glass`; shown
      when profile access is blocked by consent (403 consent denial).
- [x] Patient portal: grant-consent flow added next to existing revoke.

## P2 — Pharmacist: dispense recording

API: `GET /encounters/:id/prescriptions`, `POST /encounters/:id/dispenses`
(role `pharmacist`).

- [x] Encounter detail page: prescriptions list gains a "Record dispense"
      action (pharmacist only) capturing quantity + notes. (Already present.)
- [x] Pharmacy worklist page `/pharmacy` — look up encounter, see open
      prescriptions, record dispense.

## P3 — Lab scientist: results entry

API: `GET /encounters/:id/lab-orders`, `POST /encounters/:id/lab-results`
(role `lab_scientist`).

- [x] Encounter detail: lab orders list gains "Record result" action
      (lab scientist only): value, unit, reference range, interpretation,
      notes, optional report document id.
- [x] Lab worklist page `/lab` — look up encounter, see orders, record results.

## P4 — Allergies & immunisations recording

API: `POST /encounters/:id/allergies`, `POST /encounters/:id/immunisations`.

- [x] Encounter detail: add-allergy form (substance, reaction, severity) and
      add-immunisation form (vaccine, dose, lot, site, route, date).

## P5 — Document upload

API: `POST /documents/upload` (multipart), `GET /documents/patient/:nuhi`,
`GET /documents/:docId/download`.

- [x] Documents section on patient profile: list + download.
- [x] Upload form (doc type, optional encounter link, file) on encounter
      detail and patient profile.

## P6 — Admin CRUD

API: providers (create, update, verify, affiliations add/remove), facilities
(create, update).

- [x] Providers admin: create form, verify action, affiliation management.
- [x] Facilities admin: create + edit forms (name, type, level of care,
      ownership, state, LGA, contacts).

## P7 — Role-gated navigation & live dashboard

- [x] Sidebar filters nav items by role (admin section only for
      `national_admin`/`facility_admin`, pharmacy for pharmacists, lab for
      lab scientists, audit for admins + `audit_inspector`).
- [x] Dashboard: live stats from `/analytics/summary`; quick actions vary by
      role (register/search for records officers, worklists for
      pharmacist/lab, admin shortcuts for admins).

## P8 — Audit page usability

- [ ] Filters (action, resource type, actor, date range), pagination, and a
      detail drawer per event, using existing `/audit/events` query params.

## Out of scope for this pass

- Notification module (API-side gap — needs backend work first).
- FHIR conformance validation step in CI.
- OpenAPI spec generation into `docs/api`.
