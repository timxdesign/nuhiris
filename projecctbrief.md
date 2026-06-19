# NUHIRIS — National Unified Health Identity and Records Integration System
## Complete Project Specification, Agent Context, Build Instructions & Roadmap

> **Version:** 1.0.0 — June 2026  
> **Author:** Ajakpo Timothy Olusoji (T_AJAKPO9725)  
> **Institution:** Miva Open University — MIT Programme  
> **Document purpose:** Working specification for human developer + AI agent pair to build NUHIRIS end-to-end

---

## Table of Contents

1. [Project Brief](#1-project-brief)
2. [Context & Background](#2-context--background)
3. [System Overview](#3-system-overview)
4. [Architecture Specification](#4-architecture-specification)
5. [Tech Stack — Canonical Decisions](#5-tech-stack--canonical-decisions)
6. [Module Specifications](#6-module-specifications)
7. [Database Schema](#7-database-schema)
8. [API Contract](#8-api-contract)
9. [Security Specification](#9-security-specification)
10. [FHIR Interoperability Specification](#10-fhir-interoperability-specification)
11. [Frontend Specification](#11-frontend-specification)
12. [Mobile Specification](#12-mobile-specification)
13. [Infrastructure & DevOps Specification](#13-infrastructure--devops-specification)
14. [Testing Specification](#14-testing-specification)
15. [AI Agent Instructions](#15-ai-agent-instructions)
16. [Phased Roadmap](#16-phased-roadmap)
17. [Definition of Done](#17-definition-of-done)
18. [Glossary](#18-glossary)

---

## 1. Project Brief

### What We Are Building

NUHIRIS is a **national digital health identity and records integration platform** for Nigeria. It gives every patient one unique health identity that works across every accredited hospital, clinic, and laboratory in the country. It gives every authorised clinician secure, audited access to a patient's longitudinal medical record regardless of where previous care was delivered.

This is not a hospital management system. It is the **national governance and exchange layer** that sits above individual hospital applications, makes them interoperable, and provides the identity, consent, audit, and security infrastructure that no individual facility can provide on its own.

### Problem Statement

- A patient treated at Lagos University Teaching Hospital cannot have their records seen by a doctor at Federal Medical Centre Keffi without physically carrying a folder.
- A pharmacist in Abuja cannot verify whether a prescription was actually issued by the doctor named on it.
- An emergency room doctor treating an unconscious patient has no way to check for known drug allergies from previous admissions at a different hospital.
- Nigeria has no unified, nationally governed patient identifier for health purposes.
- Duplicate registrations, lost records, and broken referral chains cost lives and money every day.

### What NUHIRIS Solves

| Problem | NUHIRIS Solution |
|---|---|
| No patient identifier across facilities | National Health ID (NUHI) — UUID-based, lifelong, portable |
| Records trapped in facility silos | Shared health record layer with FHIR R4 exchange APIs |
| No verified provider linkage to care events | Provider registry with professional licence verification |
| Facilities not uniquely identified | National master facility list with unique facility IDs |
| No access control or audit trail | RBAC + ABAC + append-only audit log on every record access |
| No patient consent management | Granular consent records per provider, per purpose, per period |
| Privacy violations with no accountability | Full NDPA 2023 compliance, DPIA before each phase |

### Stakeholders

| Role | Needs |
|---|---|
| **Patients** | Portable health records, consent control, view their own data |
| **Medical Officers / Doctors** | Fast access to full patient history, prescription tools, referrals |
| **Nurses / Midwives** | Encounter notes, observation recording, referral tracking |
| **Pharmacists** | Verified prescription access, dispense recording |
| **Laboratory Scientists** | Order receipt, result upload with LOINC codes |
| **Health Records Officers** | Patient registration, NUHI management, de-duplication |
| **Facility Administrators** | Staff management, facility profile, local reporting |
| **National Administrators** | System governance, audit oversight, national analytics |
| **NDPC / Regulators** | Privacy compliance, data breach response, audit access |

---

## 2. Context & Background

### Policy and Legal Environment (Nigeria 2026)

- **Nigeria Data Protection Act 2023 (NDPA)** — classifies health information as sensitive personal data. Explicit consent required. Data subject rights must be honoured. DPIA mandatory for each deployment phase. Enforced by the Nigeria Data Protection Commission (NDPC).
- **NITDA Data Interoperability Standards** — semantic interoperability standard for Nigerian public-sector systems. NUHIRIS must comply. Standard draws from global best practice including Estonia's X-Road model.
- **National Health Insurance Authority (NHIA)** — positions universal health coverage as a national goal. NUHIRIS is a key infrastructure component for NHIA's provider verification and claims tracking goals.
- **Federal Ministry of Health and Social Welfare (FMOHSW)** — has mandated digitisation of health records, invested in DHIS2, and endorsed the national health workforce registry. NUHIRIS is the natural next layer.
- **Medical and Dental Council of Nigeria (MDCN), Nursing and Midwifery Council of Nigeria (NMCN), Pharmacists Council of Nigeria (PCN), Medical Laboratory Science Council of Nigeria (MLSCN)** — professional regulatory bodies whose licence registries must be referenced for provider verification.

### What Already Exists (Build On, Not Replace)

- **DHIS2** — national health management information system. NUHIRIS should expose a FHIR endpoint that DHIS2 can consume for patient-level data where needed.
- **Nigeria National Data Repository (NDR)** — HIV programme patient registry. NUHIRIS must be able to ingest or reference NDR records where consent exists.
- **National Health Workforce Registry** — workforce data. NUHIRIS provider registry should sync with or reference this where API access is available.
- **NIMC / NIN** — National Identification Number. NIN is the **primary de-duplication anchor** for NUHIRIS. Every patient registration begins with a NIN lookup against the NIMC Verification API. Where the patient has a NIN and their biometric matches, NUHIRIS pulls verified demographics directly from NIMC and binds the NUHI to that NIN permanently (one-to-one, immutable). Patients without a NIN receive a provisional NUHI with a 30-day reconciliation window. NIN is never used as a clinical identifier inside FHIR resources — the NUHI is the health identity. NIN is the backstage anchor that prevents duplicates from being created.

### Key Design Principles

1. **Privacy by default** — no data shared without a lawful basis. Consent is the primary basis; treatment access is the secondary basis for active care relationships.
2. **Security first** — TLS 1.3 in transit, AES-256 at rest, MFA for all privileged access, append-only audit trail.
3. **Standards-based exchange** — HL7 FHIR R4 for all external APIs. No proprietary formats.
4. **Offline-resilient** — facilities with intermittent connectivity must still capture data. Store-and-forward sync.
5. **Modular and federated** — national identity and exchange layer; individual hospital systems can remain in place and integrate through the FHIR gateway.
6. **Incrementally deployable** — starts with a regional pilot; scales to national. No big-bang go-live.
7. **Auditable by design** — every access event is logged, immutably, forever. No exceptions.
8. **NIN-first, patient-led registration** — NIN is the de-duplication anchor. NUHI generation always begins with a NIN lookup. The channel through which that lookup happens — facility counter, patient self-service app, kiosk, provider-initiated mobile — does not change the validity of the identity. All four channels produce the same NUHI anchored to the same NIN. Requiring a physical facility visit as the only path to registration creates a new access barrier, which this system exists to remove. A Nigerian with a NIN and a smartphone must be able to onboard themselves.
9. **Biometric-verified identity across channels** — a patient's identity is confirmed through fingerprint or selfie+liveness match against NIMC's NINAuth platform regardless of which channel they use. Device attestation ensures checks on facility hardware cannot be spoofed. Liveness detection ensures remote selfie checks cannot be spoofed. The channel determines the method; the standard of identity assurance is equivalent across all channels.
10. **NINAuth as the single NIMC integration point** — NUHIRIS integrates with NIMC through the NINAuth API suite (launched May 2025, mandated for all Nigerian government MDAs). This single integration handles NIN lookup, demographic retrieval, face match, and liveness verification. NUHIRIS does not manage its own biometric database. NINAuth is the national identity layer; NUHIRIS is the health layer built on top of it.

---

## 3. System Overview

### Three-Tier Architecture Summary

```
┌─────────────────────────────────────────────────────────────────┐
│  TIER 1 — PRESENTATION LAYER                                    │
│  Next.js Web Portal  │  React Native Mobile  │  Admin Panel     │
│  Hospital Portal     │  Provider Portal       │  Patient Portal  │
└──────────────────────────────┬──────────────────────────────────┘
                               │ HTTPS / TLS 1.3
┌──────────────────────────────▼──────────────────────────────────┐
│  TIER 2 — CORE APPLICATION AND DATA LAYER                       │
│  NestJS API Server (REST + FHIR R4 Gateway)                     │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────────────┐  │
│  │ Patient       │ │ Provider      │ │ Facility Registry     │  │
│  │ Identity Mod. │ │ Registry Mod. │ │ Module                │  │
│  └───────────────┘ └───────────────┘ └───────────────────────┘  │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────────────┐  │
│  │ Encounter &   │ │ Consent       │ │ Audit & Provenance    │  │
│  │ Clinical Mod. │ │ Module        │ │ Module                │  │
│  └───────────────┘ └───────────────┘ └───────────────────────┘  │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────────────┐  │
│  │ Auth & IAM    │ │ Notification  │ │ FHIR Gateway &        │  │
│  │ Module        │ │ Module        │ │ Terminology Service   │  │
│  └───────────────┘ └───────────────┘ └───────────────────────┘  │
│  PostgreSQL (primary)  │  Redis (cache/sessions)  │  Object Store│
└──────────────────────────────┬──────────────────────────────────┘
                               │ mTLS
┌──────────────────────────────▼──────────────────────────────────┐
│  TIER 3 — SECURITY, ACCESS, AND INFRASTRUCTURE LAYER            │
│  OAuth 2.0 / OIDC  │  MFA (TOTP/FIDO2)  │  AES-256 / TLS 1.3  │
│  RBAC + ABAC       │  Audit Logging      │  Key Management Svc  │
│  Docker + K8s      │  Sovereign Cloud    │  CI/CD Pipeline      │
│  DR Environment    │  Encrypted Backups  │  Monitoring / Alerts │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow — High Level

```
Patient onboards via any channel (app / facility / kiosk / provider-initiated)
  → NIN entered → NINAuth API called → demographics + photo returned
  → NIN already bound to NUHI? → YES: existing record returned, no duplicate
                                → NO:  biometric/liveness check → NUHI generated
  → Encounter opened → Provider attaches diagnoses (ICD-11), procedures (SNOMED CT),
    observations (LOINC), prescriptions, labs, referrals
  → Consent layer checked on every access
  → Every action → append-only audit event + biometric event where applicable
  → FHIR gateway exposes encounter as FHIR R4 resources
  → External hospital systems can query/push via FHIR APIs (with OAuth token)
```

---

### 3.5 Patient Onboarding Channels

NUHIRIS supports **four parallel onboarding channels** that are equivalent in outcome. All four produce the same verified NUHI anchored to the same NIN. They differ only in who initiates registration, where, and with what tools. Requiring a physical facility visit as the *only* registration path recreates an access barrier this system is designed to remove. A Nigerian adult with a NIN and a smartphone must be able to register themselves without leaving home.

As of early 2025, NIMC reports over 120 million Nigerians enrolled in the National Identity Database. NIMC launched NINAuth in May 2025 — a suite of web, API, and mobile verification services mandated by President Tinubu for use across all government MDAs, including financial services and government programmes. Telcos already use NINAuth for SIM card KYC at national scale. NUHIRIS integrates with NINAuth as its single NIMC integration point: one API for NIN lookup, demographic retrieval, face match, and liveness verification. NUHIRIS does not manage its own biometric database.

---

#### Channel 1 — Facility-Assisted Registration

**Initiated by:** Health Records Officer at a registered facility.
**Best for:** Emergency admissions, patients without smartphones, elderly patients, rural facilities.

Flow:
1. Officer logs in with MFA → enters patient NIN
2. System calls NINAuth API → returns verified name, DOB, state, NIMC photo
3. System checks: NUHI already exists for this NIN? → **YES**: return existing record, no new registration → **NO**: continue
4. Patient places finger on registered biometric reader at facility
5. NINAuth Biometric Match → MATCH required; NO MATCH → supervisor review required
6. NUHI generated, NIN bound one-to-one, immutably
7. Audit event + biometric event written
8. Registration type: `biometric_verified`

---

#### Channel 2 — Patient Self-Registration via NUHIRIS App

**Initiated by:** The patient, on their own smartphone.
**Best for:** Urban patients, pre-registration before a planned hospital visit, telemedicine users, anyone comfortable with mobile apps.

Flow:
1. Patient downloads NUHIRIS app → taps "Register with NIN"
2. Patient enters NIN → app calls NINAuth API (with explicit consent) → demographics returned
3. System checks: NUHI already exists? → **YES**: patient logs into existing record → **NO**: continue
4. App opens camera → liveness challenge (blink + head turn, randomised per session)
5. Selfie matched against NIMC photo via NINAuth Face Match API
6. MATCH → NUHI generated → consent preferences set in same onboarding flow
7. Patient receives NUHI and downloadable QR code immediately
8. Registration type: `selfie_verified`

NINAuth provides the same identity assurance standard used by Nigerian banks and telecoms for remote KYC. A patient who verifies themselves to get a SIM card or open a bank account can verify themselves to get a health record through the same national infrastructure.

---

#### Channel 3 — Facility Kiosk Self-Check-In

**Initiated by:** The patient at a self-service tablet or kiosk installed at a registered facility reception.
**Best for:** High-volume hospitals, return-visit identification, walk-ins who prefer to avoid queuing at the records desk.

Flow:
1. Patient types NIN or scans NUHI QR code at kiosk
2. Kiosk camera runs NINAuth face match + liveness check
3. **NUHI exists** → identity confirmed → encounter initiated → patient proceeds to consultation without touching the records desk
4. **NUHI does not exist** → new registration completed at kiosk in under 60 seconds → patient proceeds
5. **No match** → kiosk flags for officer review
6. Registration type: `selfie_verified`

The records officer handles exceptions, not routine arrivals. This mirrors how modern airports handle check-in — staff exist for complex cases, not for every passenger.

---

#### Channel 4 — Provider-Initiated Remote Registration

**Initiated by:** A doctor, nurse, or community health worker during a telemedicine consultation or outreach visit.
**Best for:** Telemedicine, community health worker home visits, outreach programmes in underserved areas, emergencies where the patient cannot operate a device.

Flow:
1. Provider opens "Register New Patient" in provider portal or mobile app
2. Provider enters patient's NIN (patient verbally provides it or shares NINAuth QR code)
3. System calls NINAuth → retrieves demographics + NIMC photo
4. Provider confirms identity visually using NIMC photo on their screen
5. NUHI generated; encounter opened immediately — **care is not delayed**
6. Biometric capture deferred to patient's first physical facility visit
7. System sets `registration_type = provider_initiated`; biometric upgrade prompted at next visit
8. Prescriptions and referrals are permitted — clinical care must not be blocked by an incomplete identity step

---

#### Registration Type Hierarchy

| Type | Channel | Identity Assurance | Restrictions |
|---|---|---|---|
| `biometric_verified` | Facility-assisted (fingerprint) | Highest | None |
| `selfie_verified` | App self-reg or kiosk (face + liveness) | High | None |
| `provider_initiated` | Doctor/CHW, NIN + visual photo confirm | Medium | Biometric upgrade required at first in-person visit |
| `provisional` | No NIN available (rural / unregistered) | Low | No prescriptions or referrals; 30-day reconciliation window |
| `emergency` | Unconscious patient, no identity documents | Minimal | Temporary NUHI; mandatory reconciliation on recovery |

All types except `emergency` begin with a NIN lookup against NINAuth. The channel determines the biometric method. The identity assurance outcome is equivalent across channels — `selfie_verified` is not a weaker registration than `biometric_verified`. Both are NIN-confirmed and biometrically verified; only the biometric modality differs.

---

### 4.1 Monorepo Structure

```
nuhiris/
├── apps/
│   ├── api/                    # NestJS backend
│   ├── web/                    # Next.js web portal
│   └── mobile/                 # React Native app
├── packages/
│   ├── shared-types/           # TypeScript types shared across apps
│   ├── fhir-utils/             # FHIR R4 resource builders & validators
│   ├── crypto-utils/           # Encryption helpers, key management wrappers
│   └── ui-components/          # Shared React component library
├── infra/
│   ├── docker/                 # Dockerfiles
│   ├── k8s/                    # Kubernetes manifests
│   ├── terraform/              # Cloud infrastructure as code
│   └── ci/                     # GitHub Actions / Jenkins pipelines
├── docs/
│   ├── adr/                    # Architecture Decision Records
│   ├── api/                    # OpenAPI specs
│   └── runbooks/               # Operational runbooks
└── scripts/
    ├── seed/                   # Database seed scripts
    ├── migrate/                # Migration helpers
    └── audit/                  # Audit log rotation scripts
```

### 4.2 API Gateway Pattern

All client traffic enters through a single API gateway. The gateway handles:
- TLS termination
- Rate limiting (per account, per IP, per endpoint)
- JWT validation (rejects expired/tampered tokens before they hit the API)
- Request logging (structured JSON logs to monitoring stack)
- Routing to internal NestJS services

The NestJS application is never exposed directly to the public internet.

### 4.3 FHIR Gateway Pattern

The FHIR gateway is a dedicated NestJS module (not a separate service) that:
- Exposes standard FHIR R4 REST endpoints (`/fhir/r4/Patient`, `/fhir/r4/Encounter`, etc.)
- Translates incoming FHIR resources to the internal NUHIRIS data model
- Translates internal data model to FHIR resources on outbound requests
- Validates all FHIR resources against R4 base profiles before accepting them
- Enforces the same OAuth token and RBAC rules as the rest of the API

### 4.4 Offline Sync Architecture

```
Mobile App (offline mode)
  ↓ captures data to local SQLite (encrypted with SQLCipher)
  ↓ queues sync operations with monotonic sequence numbers
  ↓ when online: pushes to API with idempotency keys
API (sync endpoint)
  ↓ validates, deduplicates (idempotency key check)
  ↓ applies to PostgreSQL
  ↓ returns confirmation with server-side timestamps
Mobile App
  ↓ reconciles local state with server response
  ↓ marks queue items as synced
```

---

## 5. Tech Stack — Canonical Decisions

These are **locked decisions**. Do not propose alternatives without an Architecture Decision Record (ADR).

### Backend

| Component | Decision | Rationale |
|---|---|---|
| Runtime | Node.js 22 LTS | LTS stability, large ecosystem, native TypeScript |
| Framework | NestJS 11 | Modular, DI-native, TypeScript-first, guards for RBAC |
| Language | TypeScript 5.x (strict mode) | Type safety across the entire codebase |
| ORM | TypeORM 0.3.x | PostgreSQL-native, migration support, repository pattern |
| Validation | class-validator + class-transformer | Decorator-based, NestJS-native |
| API docs | @nestjs/swagger (OpenAPI 3.1) | Auto-generated from decorators |
| Testing | Jest + Supertest | Standard NestJS testing stack |
| FHIR library | @medplum/fhirtypes + fhir-kit-client | Type-safe FHIR R4 resources |

### Database

| Component | Decision | Rationale |
|---|---|---|
| Primary DB | PostgreSQL 16 | ACID, JSONB, row-level security, partition support |
| Cache | Redis 7 (Cluster mode in prod) | Sessions, rate limiting, terminology cache |
| Object store | S3-compatible (MinIO in dev, cloud in prod) | Documents, imaging, discharge summaries |
| Search | PostgreSQL full-text search (Phase 1), OpenSearch (Phase 3+) | Start simple, migrate when scale demands |

### Frontend (Web)

| Component | Decision | Rationale |
|---|---|---|
| Framework | Next.js 15 (App Router) | SSR, file-based routing, API routes, Vercel-deployable |
| Language | TypeScript 5.x (strict) | Type safety, shared types with backend |
| Styling | Tailwind CSS 4 | Utility-first, consistent design system |
| Components | shadcn/ui (Radix primitives) | Accessible, unstyled base, Tailwind-compatible |
| State | Zustand (client), TanStack Query (server) | Lightweight, no boilerplate |
| Forms | React Hook Form + Zod | Performance, TypeScript-native validation |
| Charts | Recharts | Lightweight, composable |
| Testing | Vitest + React Testing Library + Playwright | Unit, component, E2E |

### Mobile

| Component | Decision | Rationale |
|---|---|---|
| Framework | React Native 0.76 (New Architecture) | Cross-platform, shares types with web |
| Language | TypeScript 5.x (strict) | Same codebase type system |
| Navigation | Expo Router | File-based routing, same mental model as Next.js |
| Storage | expo-sqlite (encrypted via SQLCipher) | Offline data, FHIR-compatible schema |
| State | Zustand + TanStack Query | Same as web |
| MFA | expo-local-authentication + TOTP library | Biometric + TOTP |

### Security & Auth

| Component | Decision | Rationale |
|---|---|---|
| Auth protocol | OAuth 2.0 + OpenID Connect | Industry standard, FHIR SMART compatible |
| Auth server | Keycloak 25 (self-hosted) | Full OIDC, MFA built-in, RBAC, audit logs |
| Token format | JWT (RS256, 15-min access, 7-day refresh) | Stateless, verifiable |
| MFA — primary | TOTP (RFC 6238) via Google Authenticator / Authy | Widely supported |
| MFA — high privilege | FIDO2 / WebAuthn hardware key | Phishing-resistant |
| MFA — fallback | SMS OTP | Low-smartphone users, acknowledge risk |
| Encryption at rest | AES-256-GCM | NIST FIPS 197 compliant |
| Encryption in transit | TLS 1.3 (TLS 1.2 minimum for legacy clients) | RFC 8446 |
| Key management | HashiCorp Vault (self-hosted) | Centralised, auditable, rotation support |
| Access control | RBAC (Keycloak roles) + ABAC (NestJS guards) | Fine-grained, context-aware |

### Infrastructure

| Component | Decision | Rationale |
|---|---|---|
| Containerisation | Docker | Standard, reproducible |
| Orchestration | Kubernetes 1.30 | Auto-scaling, rolling deploys, self-healing |
| Cloud | Sovereign/Gov cloud (Nigeria-approved) | NDPA compliance, data residency |
| IaC | Terraform | Repeatable infra, state management |
| CI/CD | GitHub Actions (dev) / Jenkins (prod) | Automated test → build → deploy |
| Monitoring | Prometheus + Grafana | Metrics, dashboards, alerting |
| Logging | Loki + Grafana (structured JSON logs) | Centralised, queryable |
| Secrets | HashiCorp Vault | No secrets in env files or source control |
| DR | Active-passive across two availability zones | RTO 4h, RPO 1h |

### Clinical Standards

| Standard | Use |
|---|---|
| HL7 FHIR R4 | All external health data exchange APIs |
| ICD-11 | Diagnosis coding (Condition resource) |
| SNOMED CT | Clinical findings, procedures, allergies |
| LOINC | Laboratory tests and observations |
| DICOM | Medical imaging references |

---

## 6. Module Specifications

### 6.1 Patient Identity Module (`/api/src/modules/patient`)

**Responsibility:** Create, read, update, and manage patient identities. NUHI lifecycle. De-duplication.

**Endpoints:**
```
POST   /patients                        — register new patient (NIN-first; channel detected from request context)
POST   /patients/self-register          — patient self-registration via app (Channel 2)
POST   /patients/kiosk-register         — kiosk registration (Channel 3; device-attested)
POST   /patients/provider-register      — provider-initiated registration (Channel 4)
GET    /patients/:nuhi                  — fetch patient by NUHI
GET    /patients/search                 — search by NUHI / NIN / name+dob+phone
PUT    /patients/:nuhi/demographics     — update demographics (versioned)
GET    /patients/:nuhi/history          — full version history
POST   /patients/merge                  — merge duplicate records (admin only)
GET    /patients/:nuhi/summary          — clinical summary (authorised providers)
POST   /patients/nin-lookup             — look up NIN against NINAuth API
POST   /patients/biometric/verify       — submit biometric/liveness check via NINAuth
POST   /patients/:nuhi/upgrade-biometric — upgrade provider_initiated record after first physical visit
GET    /patients/:nuhi/biometric-events — audit trail of biometric checks for patient
```

**Registration flow (standard — NIN available):**
1. Records officer enters patient's NIN into NUHIRIS.
2. NUHIRIS calls **NIMC Verification API** → returns verified name, DOB, state, photo.
3. System checks: does a NUHI already exist for this NIN?
   - **YES** → return existing NUHI. No new record created. Duplicate prevented at source.
   - **NO** → continue to step 4.
4. Patient places finger on registered biometric reader at the facility.
5. NUHIRIS calls **NIMC Biometric Match API** → returns MATCH / NO MATCH + confidence score.
   - **NO MATCH** → registration halted. Supervisor review required before proceeding.
   - **MATCH** → continue.
6. NUHI generated (UUID v4), permanently and immutably bound to NIN (one-to-one).
7. NIMC demographic data auto-populates the record. Officer adds health-specific fields.
8. NIMC photo stored encrypted in object storage as `nimc_photo_ref`.
9. Audit event written: registration type, NIN verified, biometric result, device ID, officer ID, facility, timestamp.
10. NUHI QR code generated and optionally printed for patient.

**Registration flow (provisional — no NIN):**
- Allowed for: unconscious emergency patients, newborns, patients in rural areas awaiting NIN enrolment.
- Status set to `provisional`. NUHI issued but flagged.
- Fuzzy name match (Jaro-Winkler on name + DOB + phone) used as a **secondary duplicate check only** — not the primary mechanism.
- Score ≥ 0.85 → flag for review. Score ≥ 0.95 → block pending manual supervisor review.
- Facility has **30 days** to assist the patient in completing NIN enrolment, after which provisional NUHI is upgraded and NIN-bound. NIMC has mobile enrolment units that can assist.
- Provisional patients **cannot have prescriptions or referrals** issued until status is upgraded to `active`.

**Business rules:**
- NUHI = UUID v4. Never reused, never changed, never deleted.
- NIN ↔ NUHI binding is one-to-one and immutable once set.
- NIN is stored encrypted (`AES-256-GCM`, key from Vault). It is never exposed in FHIR resources or API responses to clinical users — only the NUHI is used as the health identifier.
- NIMC photo stored encrypted. Displayed to records officer at every return visit for visual identity confirmation.
- Demographics updates are versioned — previous versions stored in `patient_history`. Never physically overwritten.
- Deceased patients: `status = deceased`, `deceased_at` set. NUHI and NIN binding retained for medicolegal record.

**Key service methods:**
```typescript
// Channel 1 — Facility-assisted
registerPatientFacility(dto: FacilityRegisterDto, deviceId: string): Promise<Patient>
// Channel 2 — Patient self-registration (app)
registerPatientSelf(dto: SelfRegisterDto, ninAuthToken: string): Promise<Patient>
// Channel 3 — Kiosk
registerPatientKiosk(dto: KioskRegisterDto, deviceId: string): Promise<Patient>
// Channel 4 — Provider-initiated
registerPatientProviderInitiated(dto: ProviderRegisterDto, providerId: string): Promise<Patient>

// Shared utilities
lookupNin(nin: string): Promise<NinAuthLookupResult>
verifyBiometric(nin: string, deviceId: string, payload: BiometricPayload): Promise<BiometricResult>
verifyLiveness(nin: string, selfiePayload: LivenessPayload): Promise<LivenessResult>
checkNuhiExistsForNin(nin: string): Promise<Patient | null>
upgradeToSelfieVerified(nuhi: string, selfiePayload: LivenessPayload): Promise<Patient>
upgradeToBiometricVerified(nuhi: string, deviceId: string, fingerprintPayload: BiometricPayload): Promise<Patient>
findByNuhi(nuhi: string): Promise<Patient>
searchPatients(query: SearchPatientsDto): Promise<PatientSearchResult[]>
updateDemographics(nuhi: string, dto: UpdateDemographicsDto, actorId: string): Promise<Patient>
mergePatients(primaryNuhi: string, duplicateNuhi: string, actorId: string): Promise<Patient>
```

---

### 6.2 Provider Registry Module (`/api/src/modules/provider`)

**Responsibility:** Manage health professional identities, licence verification, and facility affiliations.

**Endpoints:**
```
POST   /providers                       — create provider account
GET    /providers/:providerId           — fetch provider profile
PUT    /providers/:providerId           — update provider profile
POST   /providers/:providerId/verify    — submit for licence verification
GET    /providers/:providerId/affiliations — list facility affiliations
POST   /providers/:providerId/affiliations — add affiliation
DELETE /providers/:providerId/affiliations/:affiliationId — close affiliation
GET    /providers/search                — search by name/licence/specialty
```

**Business rules:**
- Provider categories: `doctor`, `nurse`, `pharmacist`, `lab_scientist`, `radiographer`, `physiotherapist`, `allied_health`, `admin`.
- Licence verification: system calls regulatory body API (MDCN, NMCN, PCN, MLSCN) where available. Falls back to manual verification queue.
- Unverified providers: `verification_status = pending`. Access restricted to read-only until verified.
- Affiliations: a provider can be affiliated with multiple facilities. Each affiliation has `start_date`, `end_date`, `employment_type` (full-time, part-time, locum, consultant).
- Affiliation closure: `end_date` set, status = `inactive`. Historical encounters retain the provider linkage as it was at time of encounter.
- Providers cannot be deleted — only `deactivated`. All historical encounters retain the reference.

---

### 6.3 Facility Registry Module (`/api/src/modules/facility`)

**Responsibility:** Maintain the national master facility list.

**Endpoints:**
```
POST   /facilities              — register facility (admin only)
GET    /facilities/:facilityId  — fetch facility profile
PUT    /facilities/:facilityId  — update facility profile (admin/fac-admin)
GET    /facilities              — list/search facilities
GET    /facilities/:facilityId/providers — list affiliated providers
GET    /facilities/:facilityId/stats    — facility encounter statistics
```

**Business rules:**
- Facility attributes (minimum required): name, type, level_of_care, ownership, address, state, lga, coordinates, contact_phone, accreditation_status, operational_status.
- Facility types: `hospital`, `clinic`, `PHC`, `laboratory`, `pharmacy`, `diagnostic_centre`, `specialist_centre`, `dental_clinic`, `maternity_home`, `rehabilitation_centre`.
- Levels of care: `primary`, `secondary`, `tertiary`.
- Ownership: `federal`, `state`, `LGA`, `faith-based`, `private`, `NGO`.
- Facilities cannot be deleted — `operational_status = closed` with `closure_date`.
- Accreditation status tracked with `accreditation_expiry`. Expired facilities cannot have new encounters registered.

---

### 6.4 Encounter & Clinical Records Module (`/api/src/modules/encounter`)

**Responsibility:** Record every clinical visit and attach structured clinical data.

**Endpoints:**
```
POST   /encounters                          — open new encounter
GET    /encounters/:encounterId             — fetch encounter
PUT    /encounters/:encounterId/status      — update status (open/in-progress/closed)
GET    /patients/:nuhi/encounters           — patient encounter list (paginated)
POST   /encounters/:encounterId/diagnoses   — add ICD-11 diagnosis
POST   /encounters/:encounterId/procedures  — add SNOMED CT procedure
POST   /encounters/:encounterId/observations — add LOINC observation
POST   /encounters/:encounterId/prescriptions — add prescription
POST   /encounters/:encounterId/dispenses   — record dispense (pharmacist only)
POST   /encounters/:encounterId/lab-orders  — create lab order
POST   /encounters/:encounterId/lab-results — upload lab result
POST   /encounters/:encounterId/referrals   — create referral
POST   /encounters/:encounterId/discharge   — record discharge summary
GET    /patients/:nuhi/clinical-summary     — full longitudinal summary
```

**Business rules:**
- Encounter types: `outpatient`, `inpatient`, `emergency`, `telemedicine`, `pharmacy`, `laboratory`, `radiology`, `referral`.
- All clinical records are **versioned and immutable**. No physical overwrites. Amendments create new versions with `amended_by`, `amended_at`, `amendment_reason`.
- Diagnoses must use valid ICD-11 codes (validated against terminology service).
- Procedures must use valid SNOMED CT codes.
- Observations must use valid LOINC codes.
- Prescriptions must reference a provider who has prescribing rights (doctors, qualified nurses where applicable).
- Dispenses must reference a valid prescription and be performed by a pharmacist.
- Lab orders must reference a valid encounter; results must reference a valid order.
- Referrals include: referring provider, receiving facility, reason, urgency, clinical summary snapshot at time of referral.

---

### 6.5 Consent Management Module (`/api/src/modules/consent`)

**Responsibility:** Record, enforce, and manage patient consent for data access.

**Endpoints:**
```
POST   /patients/:nuhi/consents         — grant consent
GET    /patients/:nuhi/consents         — list active consents
DELETE /patients/:nuhi/consents/:id     — revoke consent
GET    /patients/:nuhi/consents/:id     — fetch specific consent
POST   /consents/check                  — check if actor has access (internal)
POST   /access/break-glass              — request emergency override
```

**Consent structure:**
```typescript
interface Consent {
  consent_id: string;           // UUID
  nuhi: string;                 // patient
  grantor_id: string;           // patient or authorised rep
  grantee_type: 'provider' | 'facility' | 'role';
  grantee_id: string;           // provider_id or facility_id or role name
  purpose: ConsentPurpose;      // TREATMENT | RESEARCH | INSURANCE | ADMIN
  scope: string[];              // resource types permitted: ['Encounter', 'Observation', ...]
  valid_from: Date;
  valid_to: Date | null;        // null = indefinite until revoked
  revoked_at: Date | null;
  revocation_reason: string | null;
  created_at: Date;
}
```

**Access decision logic (called before every data access):**
```
1. Is actor authenticated? → No → 401
2. Does actor's role permit this resource type? (RBAC) → No → 403
3. Is there an active encounter linking actor to patient at same facility? → Yes → PERMIT (treatment access)
4. Does patient have an active, non-revoked consent for this actor and purpose? → Yes → PERMIT
5. Is there an active break-glass override by this actor? → Yes → PERMIT (heightened audit)
6. → DENY, log access attempt with reason
```

**Break-glass:**
- Only Medical Officers and National Admins can trigger break-glass.
- Must provide a documented clinical reason before access is granted.
- Access immediately logged with `access_type = emergency_override`.
- Supervisor notification sent within 60 seconds.
- Patient notification sent (where contact available) within 24 hours.
- Break-glass log reviewed by Facility Administrator within 1 working day.
- Repeated unjustified break-glass use is a disciplinary matter.

---

### 6.6 Authentication & IAM Module (`/api/src/modules/auth`)

**Responsibility:** OAuth 2.0 / OIDC integration, JWT handling, session management, MFA enforcement.

**Endpoints:**
```
POST   /auth/login              — initiate login (returns MFA challenge if needed)
POST   /auth/mfa/verify         — complete MFA, receive tokens
POST   /auth/refresh            — refresh access token
POST   /auth/logout             — invalidate refresh token
POST   /auth/mfa/setup          — set up TOTP (returns QR code)
POST   /auth/mfa/setup/confirm  — confirm TOTP setup
DELETE /auth/mfa                — remove MFA (admin action only)
GET    /auth/me                 — current user profile
```

**Token specification:**
```
Access token:
  - Algorithm: RS256
  - Expiry: 15 minutes
  - Claims: sub (account_id), roles[], facility_id, provider_id, iat, exp, jti

Refresh token:
  - Stored server-side (Redis) + hashed copy in PostgreSQL
  - Expiry: 7 days
  - Rotated on every use (refresh token rotation)
  - Single-use: used token immediately invalidated
```

**MFA enforcement rules:**
- All roles except `patient` require TOTP or FIDO2 to complete login.
- `national_admin` and `audit_inspector` require FIDO2 hardware key (no TOTP fallback in production).
- Patients may use password-only or TOTP (encouraged but not mandatory in Phase 1).
- Failed MFA: 5 attempts then 30-minute lockout. Admin can unlock.
- All login events (success, failure, lockout) → audit log.

---

### 6.7 Audit & Provenance Module (`/api/src/modules/audit`)

**Responsibility:** Immutable, append-only log of every access and modification event. Provenance tracking for clinical entries.

**Endpoints:**
```
GET    /audit/events            — query audit log (admin/inspector only, paginated)
GET    /audit/events/:eventId   — fetch specific event
GET    /audit/patient/:nuhi     — all events touching a patient record
GET    /audit/actor/:actorId    — all events by an actor
GET    /audit/export            — export audit logs (CSV/JSONL, admin only)
```

**Audit event structure:**
```typescript
interface AuditEvent {
  event_id: string;           // UUID (auto-generated)
  actor_id: string;           // account_id
  actor_role: string;         // role at time of action
  actor_facility_id: string;  // facility at time of action
  resource_type: string;      // Patient | Encounter | Consent | etc.
  resource_id: string;        // ID of the resource
  action: AuditAction;        // READ | CREATE | UPDATE | DELETE | EXPORT | EMERGENCY_OVERRIDE | LOGIN | LOGOUT | FAILED_ACCESS
  outcome: 'success' | 'failure';
  failure_reason: string | null;
  patient_nuhi: string | null; // populated when action relates to a patient
  pathway: string;             // web_portal | mobile_app | fhir_api | admin_panel
  ip_address: string;
  user_agent: string;
  session_id: string;
  timestamp: Date;             // server UTC time
  metadata: Record<string, unknown>; // additional context (break-glass reason, etc.)
}
```

**Critical rules:**
- Audit table is **append-only**. The database role used by the application has `INSERT` permission only on `audit_events`. No `UPDATE` or `DELETE` permitted at database level (enforced by PostgreSQL roles, not just application logic).
- Audit logs are **never deleted** within the retention period. Retention: 7 years minimum (health record legal requirement in Nigeria).
- After 90 days, logs are moved to cold storage (compressed JSONL, integrity-hashed).
- Audit log writes are **synchronous** — if the audit write fails, the originating action fails. No silent audit log loss.

---

### 6.8 Notification Module (`/api/src/modules/notification`)

**Responsibility:** Send event-driven notifications to users.

**Notification types:**

| Event | Channel | Recipients |
|---|---|---|
| Break-glass access | In-app + email | Patient (where available), Facility Admin, National Admin |
| New consent granted | In-app | Provider receiving consent |
| Consent revoked | In-app + email | Provider losing consent |
| Referral received | In-app + SMS | Receiving provider + facility |
| Lab result ready | In-app + SMS | Ordering provider |
| Account locked | Email + SMS | Account holder |
| New provider verified | Email | Provider |

**Implementation:** Bull queue (Redis-backed) for async notification dispatch. Retry logic: 3 attempts with exponential backoff. Dead-letter queue for failed notifications with manual retry from admin panel.

---

### 6.9 FHIR Gateway Module (`/api/src/modules/fhir`)

**Responsibility:** Expose HL7 FHIR R4 REST endpoints for external system integration.

**Supported resource types (Phase 1):**

| FHIR Resource | Internal Entity | Operations |
|---|---|---|
| Patient | Patient | read, search, create |
| Practitioner | Provider | read, search |
| Organization | Facility | read, search |
| Encounter | Encounter | read, search, create |
| Condition | Diagnosis | read, create |
| Observation | Observation / LabResult | read, create |
| MedicationRequest | Prescription | read, create |
| MedicationDispense | Dispense | read, create |
| AllergyIntolerance | Allergy | read, create |
| Immunization | Immunisation | read, create |
| DiagnosticReport | LabResult (complete) | read, create |
| ServiceRequest | LabOrder / Referral | read, create |
| DocumentReference | DocumentRef | read, create |
| Consent | Consent | read, create |
| AuditEvent | AuditEvent | read (admin only) |
| Provenance | Provenance | read |

**FHIR identifiers:**
```
Patient.identifier.system = "https://nuhiris.health.gov.ng/identifier/nuhi"
Practitioner.identifier.system = "https://nuhiris.health.gov.ng/identifier/provider"
Organization.identifier.system = "https://nuhiris.health.gov.ng/identifier/facility"
```

**FHIR security:**
- All FHIR endpoints require a valid OAuth 2.0 bearer token.
- SMART on FHIR scopes (Phase 3): `patient/*.read`, `user/*.read`, `system/*.read`.
- External systems must be registered OAuth clients with defined scope grants.
- All FHIR requests logged to audit trail.

---

## 7. Database Schema

### Core Tables

```sql
-- ─────────────────────────────────────
-- PATIENT IDENTITY
-- ─────────────────────────────────────
CREATE TABLE patients (
  nuhi                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name                TEXT NOT NULL,
  date_of_birth            DATE NOT NULL,
  sex                      TEXT NOT NULL CHECK (sex IN ('male','female','intersex','not_stated')),
  state                    TEXT NOT NULL,
  lga                      TEXT,
  phone                    TEXT,
  email                    TEXT,
  -- NIN fields (NIN is the de-duplication anchor, not the health identifier)
  nin                      TEXT UNIQUE,              -- AES-256-GCM encrypted; NULL for provisional
  nin_verified             BOOLEAN NOT NULL DEFAULT FALSE,
  nin_verification_date    TIMESTAMPTZ,
  nin_verification_method  TEXT                      -- 'biometric' | 'documentary' | 'manual_review'
                           CHECK (nin_verification_method IN ('biometric','documentary','manual_review')),
  nimc_photo_ref           TEXT,                     -- encrypted object storage key for NIMC photo
  -- Registration metadata
  registration_type        TEXT NOT NULL DEFAULT 'standard'
                           CHECK (registration_type IN ('biometric_verified','selfie_verified','provider_initiated','provisional','emergency')),
  status                   TEXT NOT NULL DEFAULT 'active'
                           CHECK (status IN ('active','provisional','deceased','merged')),
  provisional_deadline     DATE,                     -- 30-day upgrade deadline for provisional patients
  deceased_at              TIMESTAMPTZ,
  merged_into              UUID REFERENCES patients(nuhi),
  registration_facility_id UUID REFERENCES facilities(facility_id),
  registered_by            UUID REFERENCES user_accounts(account_id),
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique partial index: one NUHI per NIN (NIN is the dedup anchor)
CREATE UNIQUE INDEX idx_patients_nin_unique ON patients(nin) WHERE nin IS NOT NULL;

CREATE TABLE patient_history (
  history_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nuhi            UUID NOT NULL REFERENCES patients(nuhi),
  changed_by      UUID NOT NULL REFERENCES user_accounts(account_id),
  changed_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  field_name      TEXT NOT NULL,
  old_value       TEXT,
  new_value       TEXT,
  change_reason   TEXT
);

-- ─────────────────────────────────────
-- DEVICE REGISTRY
-- Tracks trusted facility devices for biometric and liveness checks.
-- ─────────────────────────────────────
CREATE TABLE registered_devices (
  device_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_fingerprint TEXT NOT NULL UNIQUE,  -- hardware attestation token (Android Keystore / Secure Enclave)
  device_name        TEXT,
  device_type        TEXT NOT NULL CHECK (device_type IN ('facility_tablet','facility_phone','patient_personal')),
  facility_id        UUID REFERENCES facilities(facility_id),
  trust_level        TEXT NOT NULL CHECK (trust_level IN ('high','medium','low')),
  -- 'high'   = facility device, attestation verified, geofenced
  -- 'medium' = facility device, attestation verified, no geofence
  -- 'low'    = patient personal device, software attestation only
  enrolled_by        UUID REFERENCES user_accounts(account_id),
  enrolled_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at       TIMESTAMPTZ,
  last_seen_lat      DECIMAL(10,7),
  last_seen_lng      DECIMAL(10,7),
  status             TEXT NOT NULL DEFAULT 'active'
                     CHECK (status IN ('active','suspended','revoked')),
  revoked_at         TIMESTAMPTZ,
  revocation_reason  TEXT
);

-- ─────────────────────────────────────
-- BIOMETRIC EVENTS (append-only audit trail for every biometric check)
-- ─────────────────────────────────────
CREATE TABLE biometric_events (
  event_id          UUID NOT NULL DEFAULT gen_random_uuid(),
  nuhi              UUID REFERENCES patients(nuhi),         -- NULL for pre-registration checks
  nin               TEXT,                                   -- NIN checked (encrypted for storage)
  device_id         UUID NOT NULL REFERENCES registered_devices(device_id),
  event_type        TEXT NOT NULL
                    CHECK (event_type IN ('registration','identity_check','liveness_check','access_gate','nin_lookup')),
  method            TEXT NOT NULL
                    CHECK (method IN ('fingerprint','face','face_liveness','fingerprint_liveness','documentary')),
  result            TEXT NOT NULL
                    CHECK (result IN ('match','no_match','inconclusive','liveness_fail','device_untrusted')),
  confidence_score  DECIMAL(5,4),                          -- 0.0000 to 1.0000
  nimc_api_called   BOOLEAN NOT NULL DEFAULT FALSE,
  nimc_reference_id TEXT,                                  -- NIMC transaction reference for audit trail
  liveness_passed   BOOLEAN,
  device_attested   BOOLEAN,                               -- did device pass hardware attestation?
  geofence_passed   BOOLEAN,                               -- was device within facility GPS boundary?
  performed_by      UUID REFERENCES user_accounts(account_id),
  facility_id       UUID REFERENCES facilities(facility_id),
  timestamp         TIMESTAMPTZ NOT NULL DEFAULT NOW()
  -- Append-only: same REVOKE rules as audit_events
  -- REVOKE UPDATE, DELETE ON biometric_events FROM nuhiris_app;
) PARTITION BY RANGE (timestamp);

-- ─────────────────────────────────────
-- PROVIDER REGISTRY
-- ─────────────────────────────────────
CREATE TABLE providers (
  provider_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name           TEXT NOT NULL,
  category            TEXT NOT NULL,   -- doctor, nurse, pharmacist, etc.
  specialty           TEXT,
  licence_number      TEXT UNIQUE,
  regulatory_body     TEXT,            -- MDCN, NMCN, PCN, MLSCN, etc.
  verification_status TEXT NOT NULL DEFAULT 'pending'
                      CHECK (verification_status IN ('pending','verified','rejected','expired')),
  verified_at         TIMESTAMPTZ,
  verification_source TEXT,
  status              TEXT NOT NULL DEFAULT 'active'
                      CHECK (status IN ('active','inactive','deactivated')),
  account_id          UUID REFERENCES user_accounts(account_id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE provider_affiliations (
  affiliation_id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id     UUID NOT NULL REFERENCES providers(provider_id),
  facility_id     UUID NOT NULL REFERENCES facilities(facility_id),
  employment_type TEXT NOT NULL CHECK (employment_type IN ('full_time','part_time','locum','consultant')),
  start_date      DATE NOT NULL,
  end_date        DATE,
  status          TEXT NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active','inactive')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────
-- FACILITY REGISTRY
-- ─────────────────────────────────────
CREATE TABLE facilities (
  facility_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  TEXT NOT NULL,
  short_name            TEXT,
  type                  TEXT NOT NULL,
  level_of_care         TEXT NOT NULL CHECK (level_of_care IN ('primary','secondary','tertiary')),
  ownership             TEXT NOT NULL,
  state                 TEXT NOT NULL,
  lga                   TEXT,
  address               TEXT,
  latitude              DECIMAL(10,7),
  longitude             DECIMAL(10,7),
  contact_phone         TEXT,
  contact_email         TEXT,
  accreditation_status  TEXT NOT NULL DEFAULT 'pending'
                        CHECK (accreditation_status IN ('pending','accredited','expired','suspended')),
  accreditation_expiry  DATE,
  operational_status    TEXT NOT NULL DEFAULT 'operational'
                        CHECK (operational_status IN ('operational','closed','suspended')),
  closure_date          DATE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────
-- USER ACCOUNTS
-- ─────────────────────────────────────
CREATE TABLE user_accounts (
  account_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username        TEXT UNIQUE NOT NULL,
  email           TEXT UNIQUE NOT NULL,
  password_hash   TEXT NOT NULL,          -- bcrypt, cost 12
  role            TEXT NOT NULL,
  mfa_enabled     BOOLEAN NOT NULL DEFAULT FALSE,
  mfa_secret      TEXT,                   -- encrypted TOTP secret
  mfa_type        TEXT,                   -- totp | fido2 | sms
  provider_id     UUID REFERENCES providers(provider_id),
  facility_id     UUID REFERENCES facilities(facility_id),
  status          TEXT NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active','locked','deactivated')),
  last_login_at   TIMESTAMPTZ,
  failed_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────
-- ENCOUNTERS
-- ─────────────────────────────────────
CREATE TABLE encounters (
  encounter_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nuhi            UUID NOT NULL REFERENCES patients(nuhi),
  provider_id     UUID NOT NULL REFERENCES providers(provider_id),
  facility_id     UUID NOT NULL REFERENCES facilities(facility_id),
  encounter_type  TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'open'
                  CHECK (status IN ('open','in_progress','closed','cancelled')),
  reason          TEXT,
  date_time       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at       TIMESTAMPTZ,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
) PARTITION BY RANGE (date_time);

-- Partitions (created by migration scripts)
-- encounters_2024, encounters_2025, encounters_2026, etc.

-- ─────────────────────────────────────
-- CLINICAL RECORDS (sub-tables)
-- ─────────────────────────────────────
CREATE TABLE diagnoses (
  diagnosis_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  encounter_id    UUID NOT NULL REFERENCES encounters(encounter_id),
  icd11_code      TEXT NOT NULL,
  description     TEXT,
  onset_date      DATE,
  status          TEXT,              -- active, resolved, chronic
  severity        TEXT,
  version         INTEGER NOT NULL DEFAULT 1,
  is_current      BOOLEAN NOT NULL DEFAULT TRUE,
  created_by      UUID NOT NULL REFERENCES providers(provider_id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE observations (
  observation_id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  encounter_id    UUID NOT NULL REFERENCES encounters(encounter_id),
  loinc_code      TEXT NOT NULL,
  display         TEXT,
  value_quantity  DECIMAL,
  value_unit      TEXT,
  value_string    TEXT,
  value_codeable  TEXT,             -- SNOMED CT code for coded answers
  reference_range TEXT,
  interpretation  TEXT,
  status          TEXT,
  effective_dt    TIMESTAMPTZ,
  created_by      UUID NOT NULL REFERENCES providers(provider_id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE prescriptions (
  prescription_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  encounter_id    UUID NOT NULL REFERENCES encounters(encounter_id),
  prescriber_id   UUID NOT NULL REFERENCES providers(provider_id),
  drug_code       TEXT NOT NULL,   -- SNOMED CT or local drug code
  drug_name       TEXT NOT NULL,
  dosage          TEXT NOT NULL,
  frequency       TEXT NOT NULL,
  duration        TEXT,
  route           TEXT,
  quantity        TEXT,
  instructions    TEXT,
  status          TEXT NOT NULL DEFAULT 'active',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE dispenses (
  dispense_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id UUID NOT NULL REFERENCES prescriptions(prescription_id),
  pharmacist_id   UUID NOT NULL REFERENCES providers(provider_id),
  facility_id     UUID NOT NULL REFERENCES facilities(facility_id),
  quantity        TEXT NOT NULL,
  dispensed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes           TEXT
);

CREATE TABLE lab_orders (
  order_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  encounter_id    UUID NOT NULL REFERENCES encounters(encounter_id),
  ordered_by      UUID NOT NULL REFERENCES providers(provider_id),
  loinc_code      TEXT NOT NULL,
  test_name       TEXT NOT NULL,
  urgency         TEXT DEFAULT 'routine',
  status          TEXT NOT NULL DEFAULT 'pending',
  ordered_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE lab_results (
  result_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        UUID NOT NULL REFERENCES lab_orders(order_id),
  performed_by    UUID NOT NULL REFERENCES providers(provider_id),
  facility_id     UUID NOT NULL REFERENCES facilities(facility_id),
  result_value    TEXT,
  result_unit     TEXT,
  reference_range TEXT,
  interpretation  TEXT,
  notes           TEXT,
  resulted_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  report_doc_id   UUID REFERENCES document_refs(doc_id)
);

CREATE TABLE allergies (
  allergy_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nuhi            UUID NOT NULL REFERENCES patients(nuhi),
  encounter_id    UUID REFERENCES encounters(encounter_id),
  substance_code  TEXT,            -- SNOMED CT
  substance_name  TEXT NOT NULL,
  reaction        TEXT,
  severity        TEXT,
  status          TEXT NOT NULL DEFAULT 'active',
  recorded_by     UUID NOT NULL REFERENCES providers(provider_id),
  recorded_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE referrals (
  referral_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  encounter_id    UUID NOT NULL REFERENCES encounters(encounter_id),
  referring_provider_id UUID NOT NULL REFERENCES providers(provider_id),
  receiving_facility_id UUID NOT NULL REFERENCES facilities(facility_id),
  receiving_provider_id UUID REFERENCES providers(provider_id),
  urgency         TEXT NOT NULL DEFAULT 'routine',
  reason          TEXT NOT NULL,
  clinical_summary TEXT,
  status          TEXT NOT NULL DEFAULT 'pending',
  referred_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at     TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ
);

-- ─────────────────────────────────────
-- DOCUMENT REFERENCES
-- ─────────────────────────────────────
CREATE TABLE document_refs (
  doc_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  encounter_id    UUID REFERENCES encounters(encounter_id),
  nuhi            UUID NOT NULL REFERENCES patients(nuhi),
  doc_type        TEXT NOT NULL,   -- discharge_summary | lab_report | imaging | consent_form | referral_letter
  storage_url     TEXT NOT NULL,   -- S3-compatible object key (not public URL)
  content_hash    TEXT NOT NULL,   -- SHA-256 of file content (integrity check)
  mime_type       TEXT NOT NULL,
  file_size_bytes INTEGER,
  uploaded_by     UUID NOT NULL REFERENCES user_accounts(account_id),
  uploaded_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────
-- CONSENT
-- ─────────────────────────────────────
CREATE TABLE consents (
  consent_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nuhi            UUID NOT NULL REFERENCES patients(nuhi),
  grantor_id      UUID NOT NULL REFERENCES user_accounts(account_id),
  grantee_type    TEXT NOT NULL CHECK (grantee_type IN ('provider','facility','role')),
  grantee_id      TEXT NOT NULL,
  purpose         TEXT NOT NULL CHECK (purpose IN ('TREATMENT','RESEARCH','INSURANCE','ADMIN')),
  scope           TEXT[] NOT NULL,
  valid_from      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_to        TIMESTAMPTZ,
  revoked_at      TIMESTAMPTZ,
  revocation_reason TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────
-- AUDIT EVENTS (append-only)
-- ─────────────────────────────────────
CREATE TABLE audit_events (
  event_id         UUID DEFAULT gen_random_uuid(),
  actor_id         UUID,
  actor_role       TEXT,
  actor_facility_id UUID,
  resource_type    TEXT,
  resource_id      TEXT,
  action           TEXT NOT NULL,
  outcome          TEXT NOT NULL,
  failure_reason   TEXT,
  patient_nuhi     UUID,
  pathway          TEXT,
  ip_address       INET,
  user_agent       TEXT,
  session_id       TEXT,
  timestamp        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata         JSONB
) PARTITION BY RANGE (timestamp);

-- Revoke UPDATE and DELETE from app role at database level:
-- REVOKE UPDATE, DELETE ON audit_events FROM nuhiris_app;

-- ─────────────────────────────────────
-- PROVENANCE
-- ─────────────────────────────────────
CREATE TABLE provenance (
  prov_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_type   TEXT NOT NULL,
  resource_id     UUID NOT NULL,
  author_id       UUID NOT NULL REFERENCES providers(provider_id),
  source_system   TEXT,
  recorded_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes           TEXT
);
```

### Key Indexes

```sql
-- Patient search
CREATE INDEX idx_patients_phone ON patients(phone);
CREATE INDEX idx_patients_dob ON patients(date_of_birth);
CREATE INDEX idx_patients_name_gin ON patients USING gin(to_tsvector('english', full_name));
CREATE INDEX idx_patients_status ON patients(status);
CREATE INDEX idx_patients_provisional_deadline ON patients(provisional_deadline) WHERE status = 'provisional';
-- idx_patients_nin_unique already defined in table section above

-- Device registry
CREATE INDEX idx_devices_facility ON registered_devices(facility_id) WHERE status = 'active';
CREATE INDEX idx_devices_fingerprint ON registered_devices(device_fingerprint);

-- Biometric events (append-only — query by patient, device, or time window)
CREATE INDEX idx_biometric_nuhi ON biometric_events(nuhi, timestamp DESC);
CREATE INDEX idx_biometric_device ON biometric_events(device_id, timestamp DESC);
CREATE INDEX idx_biometric_facility ON biometric_events(facility_id, timestamp DESC);

-- Encounter queries
CREATE INDEX idx_encounters_nuhi ON encounters(nuhi);
CREATE INDEX idx_encounters_provider ON encounters(provider_id);
CREATE INDEX idx_encounters_facility ON encounters(facility_id);
CREATE INDEX idx_encounters_datetime ON encounters(date_time DESC);

-- Audit queries
CREATE INDEX idx_audit_actor ON audit_events(actor_id, timestamp DESC);
CREATE INDEX idx_audit_patient ON audit_events(patient_nuhi, timestamp DESC);
CREATE INDEX idx_audit_resource ON audit_events(resource_type, resource_id);
CREATE INDEX idx_audit_timestamp ON audit_events(timestamp DESC);

-- Consent lookup (called on every access check — must be fast)
CREATE INDEX idx_consents_nuhi ON consents(nuhi) WHERE revoked_at IS NULL;
CREATE INDEX idx_consents_grantee ON consents(grantee_id, grantee_type) WHERE revoked_at IS NULL;
```

---

## 8. API Contract

### Base URL Structure

```
Production:  https://api.nuhiris.health.gov.ng/v1
Staging:     https://api-staging.nuhiris.health.gov.ng/v1
Development: http://localhost:3000/api/v1
FHIR:        https://api.nuhiris.health.gov.ng/fhir/r4
```

### Authentication Headers

```http
Authorization: Bearer <access_token>
X-Request-ID: <uuid>        (required — for distributed tracing)
X-Facility-ID: <uuid>       (required for clinical endpoints)
Content-Type: application/json
```

### Standard Response Envelope

```typescript
// Success
{
  "success": true,
  "data": { ... },
  "meta": {
    "requestId": "...",
    "timestamp": "2026-06-15T10:30:00Z",
    "version": "1.0.0"
  }
}

// Error
{
  "success": false,
  "error": {
    "code": "PATIENT_NOT_FOUND",
    "message": "No patient found with the provided NUHI",
    "details": {},
    "requestId": "..."
  }
}

// Paginated list
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 342,
    "totalPages": 18
  }
}
```

### Error Codes (select)

| Code | HTTP Status | Meaning |
|---|---|---|
| `UNAUTHENTICATED` | 401 | No valid token |
| `FORBIDDEN` | 403 | Token valid but role insufficient |
| `CONSENT_REQUIRED` | 403 | No active consent for this access |
| `PATIENT_NOT_FOUND` | 404 | NUHI not found |
| `DUPLICATE_DETECTED` | 409 | Registration blocked — likely duplicate |
| `VALIDATION_ERROR` | 422 | Request body fails validation |
| `RATE_LIMITED` | 429 | Too many requests |
| `AUDIT_WRITE_FAILED` | 500 | Critical — audit log could not be written |
| `MFA_REQUIRED` | 403 | Login must complete MFA before proceeding |
| `ACCOUNT_LOCKED` | 423 | Too many failed attempts |

---

## 9. Security Specification

### 9.1 Encryption

**Data at rest:**
- PostgreSQL: Transparent Data Encryption (TDE) at storage level (cloud provider feature).
- Column-level encryption for highest-risk fields:
  - `patients.nin` — AES-256-GCM, key from Vault. NIN is sensitive national identity data.
  - `patients.nimc_photo_ref` — AES-256-GCM (the object storage key itself is encrypted; the photo file in object storage is also AES-256 server-side encrypted).
  - `biometric_events.nin` — AES-256-GCM (NIN stored in biometric audit trail is encrypted at rest).
  - `user_accounts.mfa_secret` — AES-256-GCM
  - Mental health diagnoses (`diagnoses` rows where `sensitivity_level = 'high'`) — AES-256-GCM
  - HIV-related records — AES-256-GCM
- Object store: server-side encryption AES-256 on all uploaded files including NIMC photos.
- Backups: encrypted before leaving the server, AES-256-GCM, key stored in Vault.

**Data in transit:**
- TLS 1.3 enforced on all external endpoints. TLS 1.2 minimum for legacy FHIR client compatibility.
- mTLS between internal services (API ↔ database, API ↔ Redis, API ↔ Vault).
- HTTP Strict Transport Security (HSTS) with `max-age=31536000; includeSubDomains; preload`.

### 9.2 Key Management

- All encryption keys stored in HashiCorp Vault.
- Keys never in source code, environment variables, or config files.
- Application uses Vault's Transit Secret Engine — data encrypted/decrypted by Vault; keys never leave Vault.
- Key rotation: AES keys rotated every 90 days. Old ciphertext re-encrypted after rotation.
- Vault itself: unsealed manually by ≥2 of 5 key holders (Shamir's Secret Sharing). Vault unsealing is an audited process.

### 9.3 Application Security

**NestJS guards (applied globally unless overridden):**
1. `JwtAuthGuard` — validates JWT on every request
2. `RolesGuard` — checks required roles from `@Roles()` decorator
3. `ConsentGuard` — checks patient consent before any patient data access
4. `AuditInterceptor` — writes audit event after every request (success or failure)
5. `ThrottlerGuard` — rate limiting (configurable per endpoint)
6. `DeviceAttestationGuard` — applied to all biometric endpoints; verifies the calling device is in the `registered_devices` table with `status = active` and trust level meets the required threshold for the operation
7. `BiometricResultGuard` — applied to patient registration endpoints; blocks progression if the most recent biometric event for this registration session is not `result = match`

**Input validation:**
- All DTOs validated with `class-validator` and `class-transformer`.
- No raw SQL queries — TypeORM parameterised queries only.
- All user-supplied strings HTML-escaped before storage.
- File uploads: MIME type validated (not just extension), virus scanned before storage.

**OWASP mitigations:**

| OWASP Top 10 | Mitigation |
|---|---|
| A01 Broken Access Control | RBAC + ABAC, consent enforcement, least-privilege DB roles |
| A02 Cryptographic Failures | AES-256, TLS 1.3, no MD5/SHA1 |
| A03 Injection | TypeORM parameterised queries, class-validator input sanitisation |
| A04 Insecure Design | Consent-by-default, privacy-by-design architecture |
| A05 Security Misconfiguration | Terraform IaC, no default credentials, CSP headers |
| A06 Vulnerable Components | Automated dependency scanning in CI (npm audit, Snyk) |
| A07 Auth Failures | MFA required, token rotation, account lockout, Keycloak |
| A08 Software Integrity | Signed Docker images, dependency lockfiles, SBOM generation |
| A09 Logging Failures | Audit-first design, sync audit writes, centralised logging |
| A10 SSRF | No user-controlled URLs in server requests, egress allowlist |

### 9.4 Row-Level Security (PostgreSQL)

```sql
-- Only the patient's providers can read their encounters
ALTER TABLE encounters ENABLE ROW LEVEL SECURITY;

CREATE POLICY encounter_provider_access ON encounters
  FOR SELECT
  USING (
    facility_id = current_setting('app.current_facility_id')::UUID
    AND EXISTS (
      SELECT 1 FROM provider_affiliations pa
      WHERE pa.provider_id = current_setting('app.current_provider_id')::UUID
        AND pa.facility_id = encounters.facility_id
        AND pa.status = 'active'
    )
  );
```

(National admins and audit inspectors bypass RLS via separate DB roles.)

---

## 10. FHIR Interoperability Specification

### FHIR Server Capabilities

NUHIRIS implements a FHIR R4 capability statement at `/fhir/r4/metadata`. External clients must check the capability statement before attempting operations.

### Patient Resource Mapping

```json
{
  "resourceType": "Patient",
  "id": "<nuhi>",
  "meta": {
    "lastUpdated": "<updated_at>",
    "source": "https://nuhiris.health.gov.ng"
  },
  "identifier": [
    {
      "system": "https://nuhiris.health.gov.ng/identifier/nuhi",
      "value": "<nuhi>"
    }
  ],
  "name": [
    {
      "use": "official",
      "family": "<surname>",
      "given": ["<first_name>", "<middle_name>"]
    }
  ],
  "gender": "<sex mapped to FHIR: male|female|other|unknown>",
  "birthDate": "<date_of_birth>",
  "address": [
    {
      "use": "home",
      "state": "<state>",
      "district": "<lga>",
      "country": "NG"
    }
  ],
  "telecom": [
    {
      "system": "phone",
      "value": "<phone>",
      "use": "mobile"
    }
  ],
  "active": "<status == active>"
}
```

### Search Parameters

```
GET /fhir/r4/Patient?identifier=https://nuhiris.health.gov.ng/identifier/nuhi|<nuhi>
GET /fhir/r4/Patient?name=<name>&birthdate=<date>
GET /fhir/r4/Patient?phone=<phone>
GET /fhir/r4/Encounter?patient=Patient/<nuhi>&date=ge2025-01-01
GET /fhir/r4/Condition?patient=Patient/<nuhi>&clinical-status=active
GET /fhir/r4/Observation?patient=Patient/<nuhi>&code=<loinc_code>
GET /fhir/r4/MedicationRequest?patient=Patient/<nuhi>&status=active
```

### Terminology Bindings

```
Condition.code: ICD-11 codes
  system = "http://id.who.int/icd/release/11/mms"

Procedure.code, AllergyIntolerance.code: SNOMED CT
  system = "http://snomed.info/sct"

Observation.code, DiagnosticReport.code: LOINC
  system = "http://loinc.org"

ImagingStudy.modality: DICOM
  system = "http://dicom.nema.org/resources/ontology/DCM"
```

### External System Onboarding

For a hospital system to integrate with NUHIRIS via FHIR:
1. Submit integration request to National Administrator.
2. Receive OAuth 2.0 client credentials (client_id + secret).
3. Define required FHIR scopes (e.g. `system/Patient.read`, `system/Encounter.write`).
4. Register allowed redirect URIs and IP ranges.
5. Complete integration testing in staging environment.
6. Sign data sharing agreement aligned to NDPA 2023.
7. Production credentials issued.

---

## 11. Frontend Specification

### Portal Structure (Next.js App Router)

```
apps/web/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── mfa/page.tsx
│   ├── (hospital)/
│   │   ├── layout.tsx            — hospital portal layout
│   │   ├── dashboard/page.tsx
│   │   ├── patients/
│   │   │   ├── page.tsx          — search / register
│   │   │   ├── [nuhi]/page.tsx   — patient profile
│   │   │   └── [nuhi]/encounter/[id]/page.tsx
│   │   ├── encounters/page.tsx
│   │   └── referrals/page.tsx
│   ├── (provider)/
│   │   ├── layout.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── patients/page.tsx
│   │   └── prescriptions/page.tsx
│   ├── (admin)/
│   │   ├── layout.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── providers/page.tsx
│   │   ├── facilities/page.tsx
│   │   ├── audit/page.tsx
│   │   └── analytics/page.tsx
│   ├── (patient)/
│   │   ├── layout.tsx
│   │   ├── my-records/page.tsx
│   │   └── my-consents/page.tsx
│   └── api/
│       └── auth/[...nextauth]/route.ts
├── components/
│   ├── patient/
│   │   ├── PatientSearchBar.tsx
│   │   ├── PatientCard.tsx
│   │   ├── PatientSummary.tsx
│   │   ├── ClinicalTimeline.tsx
│   │   └── RegisterPatientForm.tsx
│   ├── encounter/
│   │   ├── EncounterHeader.tsx
│   │   ├── DiagnosisInput.tsx     — ICD-11 autocomplete
│   │   ├── ObservationForm.tsx    — LOINC code picker
│   │   ├── PrescriptionForm.tsx
│   │   └── ReferralForm.tsx
│   ├── audit/
│   │   ├── AuditEventTable.tsx
│   │   └── AuditEventDetail.tsx
│   └── ui/                       — shadcn/ui components
├── hooks/
│   ├── usePatient.ts
│   ├── useEncounter.ts
│   ├── useAuditLog.ts
│   └── useConsent.ts
├── lib/
│   ├── api-client.ts             — typed API client
│   ├── fhir-client.ts            — FHIR R4 client
│   └── auth.ts                   — NextAuth configuration
└── store/
    ├── authStore.ts              — Zustand: current user/session
    └── encounterStore.ts         — Zustand: active encounter state
```

### Key UX Requirements

- **Patient search must return results in < 500ms** (Redis cache for frequent lookups).
- **NUHI display:** always shown in a distinct pill/badge component, never as plain text.
- **Audit trail indicator:** every page accessing patient data must show a visible "This access is being logged" indicator.
- **Consent status:** clearly visible on patient profile. Green = consented. Grey = no consent. Red = revoked.
- **ICD-11 input:** type-ahead search with code + description. Supports Nigerian English disease names.
- **Offline mode indicator:** mobile-first banner when offline, shows queue count.
- **Break-glass flow:** requires a mandatory text reason field before access is granted. Full-screen modal. Cannot be dismissed without completing the form.
- **Accessibility:** WCAG 2.1 AA compliance. All forms keyboard-navigable. Screen reader labels on all interactive elements.

### Design System Tokens (Tailwind config)

```typescript
// tailwind.config.ts
{
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#075E54',     // NUHIRIS green (health, Nigeria)
          secondary: '#128C7E',
          accent: '#25D366',
        },
        nuhi: {
          pill: '#E8F5E9',        // NUHI badge background
          pillText: '#1B5E20',    // NUHI badge text
        },
        alert: {
          emergency: '#B71C1C',   // break-glass
          warning: '#E65100',
          info: '#0D47A1',
        }
      }
    }
  }
}
```

---

## 12. Mobile Specification

### React Native App Structure

```
apps/mobile/
├── app/
│   ├── (auth)/
│   │   ├── login.tsx
│   │   └── mfa.tsx
│   ├── (provider)/
│   │   ├── _layout.tsx
│   │   ├── index.tsx              — dashboard
│   │   ├── patients/[nuhi].tsx    — patient profile
│   │   ├── encounter/new.tsx      — start encounter
│   │   └── encounter/[id].tsx     — encounter detail
│   └── (records-officer)/
│       ├── _layout.tsx
│       ├── index.tsx
│       ├── register.tsx           — register new patient
│       └── search.tsx
├── components/
│   ├── NuhiScanner.tsx            — QR code scanner for NUHI
│   ├── OfflineBanner.tsx
│   ├── SyncStatus.tsx
│   └── BiometricPrompt.tsx
├── services/
│   ├── offlineQueue.ts            — SQLite queue for offline ops
│   ├── syncService.ts             — background sync logic
│   └── localAuth.ts               — biometric / TOTP
└── db/
    └── schema.ts                  — Local SQLite schema (encrypted)
```

### Offline-First Logic

```typescript
// services/offlineQueue.ts

interface QueuedOperation {
  id: string;              // UUID
  sequence: number;        // monotonic counter for ordering
  operation: 'CREATE' | 'UPDATE';
  resourceType: string;
  payload: object;
  idempotencyKey: string;  // UUID — prevents duplicate application on sync
  createdAt: string;
  syncedAt: string | null;
  syncError: string | null;
  retryCount: number;
}

// When offline:
// 1. Save operation to SQLite queue
// 2. Apply optimistic update to local SQLite data
// 3. Show user "Saved offline — will sync when connected"

// When connectivity restored:
// 1. Retrieve unsynced operations ordered by sequence
// 2. POST to /sync/batch with array of operations + idempotency keys
// 3. Server applies, returns results
// 4. Mark successful operations as synced
// 5. Handle conflicts: server wins by default, flag for officer review
```

### NUHI QR Code

- Every registered patient can generate a NUHI QR code from the patient portal.
- QR code encodes: `nuhiris://patient/<nuhi>` (URL scheme).
- Scanning on mobile opens the patient's record directly (if actor has access).
- QR code is not a substitute for identity verification — it is a shortcut, not a credential.

---

## 13. Infrastructure & DevOps Specification

### Kubernetes Deployment (Production)

```yaml
# k8s/deployments/api.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nuhiris-api
  namespace: nuhiris-prod
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: nuhiris-api
  template:
    spec:
      containers:
      - name: api
        image: nuhiris/api:latest
        resources:
          requests:
            cpu: "500m"
            memory: "512Mi"
          limits:
            cpu: "2000m"
            memory: "2Gi"
        livenessProbe:
          httpGet:
            path: /health/live
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 5
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: nuhiris-secrets
              key: database-url
        # All secrets from Vault via Vault Agent Injector
```

### CI/CD Pipeline

```yaml
# .github/workflows/ci.yml

name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install dependencies
        run: npm ci
      - name: Type check
        run: npm run type-check
      - name: Lint
        run: npm run lint
      - name: Unit tests
        run: npm run test:unit -- --coverage
      - name: Integration tests
        run: npm run test:integration
      - name: Security scan (npm audit)
        run: npm audit --audit-level=high
      - name: OWASP ZAP scan
        run: docker run -t owasp/zap2docker-stable zap-api-scan.py -t $API_URL

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Build Docker image
        run: docker build -t nuhiris/api:${{ github.sha }} .
      - name: Sign image
        run: cosign sign nuhiris/api:${{ github.sha }}
      - name: Push to registry
        run: docker push nuhiris/api:${{ github.sha }}

  deploy-staging:
    needs: build
    if: github.ref == 'refs/heads/develop'
    steps:
      - name: Deploy to staging
        run: kubectl set image deployment/nuhiris-api api=nuhiris/api:${{ github.sha }} -n nuhiris-staging

  deploy-prod:
    needs: build
    if: github.ref == 'refs/heads/main'
    environment: production   # requires manual approval
    steps:
      - name: Deploy to production
        run: kubectl set image deployment/nuhiris-api api=nuhiris/api:${{ github.sha }} -n nuhiris-prod
```

### Backup Strategy

```
Schedule:
  Full backup:        Weekly (Sunday 02:00 WAT)
  Incremental backup: Daily (02:00 WAT)
  WAL archiving:      Continuous (RPO = minutes)

Storage:
  Primary backup:     Same availability zone (hot)
  Secondary backup:   Separate AZ (warm, 24h delay)
  Archive backup:     Object storage, encrypted (cold, 90 days+)

Retention:
  Hot backups:        7 days
  Warm backups:       30 days
  Cold archive:       7 years (NDPA / health records requirement)

Restoration testing:
  Monthly restoration test to isolated environment
  Results documented in runbook
```

### Health Endpoints

```
GET /health/live    — liveness (is the process running?)
GET /health/ready   — readiness (can it handle traffic? DB + Redis connected?)
GET /health/startup — startup probe (migrations complete?)
GET /metrics        — Prometheus metrics (internal network only)
```

---

## 14. Testing Specification

### Test Coverage Requirements

| Layer | Minimum Coverage | Priority |
|---|---|---|
| Auth & IAM module | 100% | Critical |
| Audit module | 100% | Critical |
| Consent module | 100% | Critical |
| Patient identity module | 95% | High |
| Encounter/clinical module | 90% | High |
| FHIR gateway | 90% | High |
| Provider/facility modules | 85% | Medium |
| Notification module | 80% | Medium |

### Test Types

```
Unit tests (Jest):
  - Every service method
  - Every DTO validation
  - Every guard and interceptor
  - Every FHIR resource mapper
  - Location: *.spec.ts alongside each file

Integration tests (Jest + Supertest + test database):
  - Full HTTP request → database → response cycles
  - Cross-module interactions (encounter creation → audit event written)
  - RBAC enforcement (role cannot access forbidden endpoint)
  - Consent enforcement (provider denied without consent)
  - Duplicate detection logic
  - Location: test/integration/

E2E tests (Playwright):
  - Patient registration flow
  - Doctor login → patient search → encounter create → diagnosis add
  - Break-glass flow
  - Consent grant and revoke
  - Admin audit log query
  - Location: test/e2e/

Security tests:
  - OWASP ZAP automated scan (CI)
  - Manual penetration test (pre-pilot, annually)
  - Dependency vulnerability scan (npm audit, Snyk in CI)
  - JWT tampering tests (unit)
  - SQL injection tests (integration)

Performance tests (k6):
  - 500 concurrent users — all key endpoints
  - Load test profile: 10-min ramp up, 30-min sustain, 10-min ramp down
  - Thresholds: p95 < 700ms for record retrieval, p95 < 400ms for search
  - Location: test/performance/
```

### Test Data Strategy

- Use factory functions (not hardcoded fixtures) to generate test data.
- Test database is reset between integration test suites.
- No real patient data in test environments. Ever.
- Synthetic data generated using Faker.js with Nigeria-appropriate locale.
- FHIR resources validated against official R4 profiles in CI using FHIR validator CLI.

---

## 15. AI Agent Instructions

> **Read this section in full before writing any code.**

### You Are Building

A Nigerian national health records system. This is not a toy project. Real patient data will eventually run on this platform. Security, audit, and correctness are non-negotiable.

### Absolute Rules

1. **Never write plaintext secrets.** No database URLs, API keys, or tokens in source code, comments, or example files. Use `process.env.SECRET_NAME` and reference the `.env.example` file.

2. **Never skip audit logging.** Every endpoint that reads, creates, or modifies patient data MUST write an audit event. The `AuditInterceptor` handles this globally, but verify it is active. If you write a module that bypasses the interceptor, add explicit audit calls.

3. **Never allow SQL injection.** Use TypeORM query builder or repository methods only. If raw SQL is unavoidable, use parameterised queries (`$1`, `$2` style). Never concatenate user input into SQL strings.

4. **Never store passwords in plain text.** `bcrypt` with cost factor 12. Never MD5, SHA1, or SHA256 for passwords.

5. **Always validate FHIR resources** before accepting them from external systems. Use the `fhir-utils` package validators. Reject non-conformant resources with a 422 and a FHIR OperationOutcome response.

6. **Never delete audit records.** Not in application code, not in migrations, not in maintenance scripts. If you are asked to write code that deletes from `audit_events`, refuse.

7. **Always write tests.** Every new service method needs a unit test. Every new endpoint needs an integration test. Do not mark tasks complete without tests.

8. **Never bypass the consent check.** The `ConsentGuard` must be active on every endpoint that returns patient clinical data. Do not create helper methods that fetch patient records without going through the consent service.

9. **TypeScript strict mode is mandatory.** No `any` types. No `@ts-ignore`. If you don't know the correct type, ask or use `unknown` and narrow it properly.

10. **All PRs must pass CI.** Do not suggest merging code with failing tests, lint errors, or type errors.

### Coding Style

- **NestJS modules:** One module per domain (patient, provider, facility, encounter, consent, audit, auth, fhir, notification). No cross-module service injection — use events (NestJS EventEmitter) for cross-module side effects.
- **DTOs:** One DTO class per operation. `Create`, `Update`, `Response`, `Search` DTOs are separate classes.
- **Error handling:** Use NestJS `HttpException` subclasses. Never `throw new Error('something')` in a controller or service. Use the `ErrorCodes` enum from `shared-types`.
- **Logging:** Use NestJS Logger. Log at `debug` for verbose flow, `log` for significant events, `warn` for recoverable issues, `error` for failures. Never log patient data (names, diagnoses) in application logs — only IDs and resource types.
- **Comments:** Comment WHY, not WHAT. If a business rule is non-obvious (e.g. "provisional patients cannot have prescriptions until status is active"), add a comment explaining the rule and referencing the relevant section of this spec.
- **Naming:** snake_case for database columns. camelCase for TypeScript variables and methods. PascalCase for classes and types. kebab-case for file names.

### When You Are Unsure

- If the spec is ambiguous, pick the more secure option and document your assumption in a code comment.
- If a task would require bypassing a security control, stop and ask.
- If a library you want to use is not in the canonical tech stack (Section 5), ask before using it.
- If a database schema change is needed that is not in the spec, propose it first. Do not apply unapproved schema changes.

### How to Start a New Module

```
1. Create the module directory: apps/api/src/modules/<name>/
2. Files to create:
   - <name>.module.ts
   - <name>.controller.ts
   - <name>.service.ts
   - <name>.repository.ts (extends TypeORM Repository)
   - dto/create-<name>.dto.ts
   - dto/update-<name>.dto.ts
   - dto/response-<name>.dto.ts
   - entities/<name>.entity.ts
   - <name>.service.spec.ts
   - <name>.controller.spec.ts
3. Register in AppModule
4. Write unit tests alongside the service
5. Write integration tests in test/integration/<name>/
```

### Useful Commands

```bash
# Development
npm run start:dev           # start API in watch mode
npm run start:mobile        # start Expo dev server
npm run start:web           # start Next.js dev server

# Database
npm run migration:generate  # generate migration from entity changes
npm run migration:run       # apply pending migrations
npm run migration:revert    # revert last migration
npm run db:seed             # seed development data

# Testing
npm run test:unit           # unit tests
npm run test:integration    # integration tests (requires test DB)
npm run test:e2e            # E2E tests (requires full stack running)
npm run test:coverage       # coverage report

# Code quality
npm run lint                # ESLint
npm run type-check          # TypeScript compiler check
npm run format              # Prettier

# FHIR
npm run fhir:validate       # validate all FHIR resources in test fixtures
npm run fhir:capability     # generate capability statement
```

---

## 16. Phased Roadmap

### Phase 0 — Foundation (Weeks 1–6)

**Goal:** Working monorepo, database, auth, and patient identity module.

| Week | Deliverables |
|---|---|
| 1 | Monorepo setup (Turborepo), Docker Compose dev environment, PostgreSQL + Redis + MinIO running locally |
| 1 | Keycloak setup, OAuth 2.0 flow working, JWT validation in NestJS |
| 2 | Database schema (all tables including registered_devices, biometric_events), first migration, seed script |
| 2 | Auth module: login, MFA setup (TOTP), token refresh, logout |
| 3 | NIMC Verification API integration: NIN lookup, pull demographics, return verified data |
| 3 | NIMC Biometric Match API integration: fingerprint payload submission, match/no-match result handling |
| 4 | Patient identity module: NIN-first registration flow, NUHI generation, NIN↔NUHI binding |
| 4 | Device registry module: enrol device, device attestation check, geofence validation |
| 5 | Provisional registration path: Jaro-Winkler fuzzy match as secondary check, 30-day deadline tracking |
| 5 | Audit module: AuditInterceptor global, append-only writes; BiometricGuard + DeviceAttestationGuard |
| 6 | Basic Next.js web portal: login, MFA, patient search, NIN entry screen, biometric capture UI |
| 6 | Unit and integration tests for all Phase 0 modules (≥90% coverage). CI pipeline. |

**Phase 0 Done When:**
- A records officer can log in with MFA.
- They can enter a patient NIN, the system calls NIMC and returns verified demographics.
- Biometric match is confirmed before NUHI is issued.
- Attempting to register a second patient with the same NIN returns the existing NUHI — no duplicate.
- Provisional path creates a NUHI with `registration_type = provisional` and sets a 30-day deadline.
- Every action generates an audit event. Every biometric check generates a biometric event.
- All Phase 0 tests pass in CI.

---

### Phase 1 — Core Clinical (Weeks 7–14)

**Goal:** Full encounter lifecycle, clinical records, consent, provider and facility modules.

| Week | Deliverables |
|---|---|
| 7 | Provider registry module: create, verify, affiliate |
| 7 | Facility registry module: create, list, search |
| 8 | Encounter module: open, close, encounter list |
| 8 | Diagnosis entry with ICD-11 code validation |
| 9 | Observation entry with LOINC code validation |
| 9 | Prescription and dispense modules |
| 10 | Lab orders and lab results modules |
| 10 | Allergy and immunisation modules |
| 11 | Referral module: create, accept, track status |
| 11 | Document upload: discharge summaries, lab reports |
| 12 | Consent module: grant, revoke, access check integration |
| 12 | Break-glass flow: reason capture, immediate audit, supervisor alert |
| 13 | Provider portal (web): encounter create, diagnosis, prescription |
| 13 | Hospital portal (web): patient profile, clinical timeline |
| 14 | Full test coverage for Phase 1 modules |
| 14 | Performance baseline: k6 load test, document results |

**Phase 1 Done When:**
- A doctor can open a patient encounter, record a diagnosis (ICD-11), write a prescription, and order a lab test.
- A pharmacist can view and record dispense against a valid prescription.
- A lab scientist can receive an order and upload a result.
- Consent enforcement is active on all clinical endpoints.
- Break-glass access works, is logged, and triggers a supervisor notification.

---

### Phase 2 — FHIR Gateway & Mobile (Weeks 15–20)

**Goal:** Standards-based interoperability, mobile app, offline sync.

| Week | Deliverables |
|---|---|
| 15 | FHIR gateway: Patient, Practitioner, Organization resources |
| 15 | FHIR gateway: Encounter, Condition, Observation resources |
| 16 | FHIR gateway: MedicationRequest, AllergyIntolerance, Immunization |
| 16 | FHIR conformance validation in CI (FHIR validator CLI) |
| 17 | External system OAuth client registration and management |
| 17 | Terminology service: ICD-11, LOINC, SNOMED CT search API |
| 18 | React Native mobile app: login, MFA, patient search |
| 18 | Mobile: patient registration, encounter open (online) |
| 19 | Mobile: offline-first SQLite layer, queue management |
| 19 | Mobile: background sync, conflict resolution |
| 20 | Mobile: NUHI QR code generation and scanning |
| 20 | Integration tests: full FHIR resource round-trip with external test client |

---

### Phase 3 — Security Hardening & Pilot Readiness (Weeks 21–26)

**Goal:** Production-ready security, infrastructure, monitoring, pilot preparation.

| Week | Deliverables |
|---|---|
| 21 | HashiCorp Vault integration: all secrets migrated out of env vars |
| 21 | Column-level encryption for high-sensitivity fields (NIN, NIMC photo ref, biometric NIN) |
| 22 | Kubernetes manifests: production and staging environments |
| 22 | Terraform: cloud infrastructure as code |
| 23 | Prometheus + Grafana monitoring, alerting rules |
| 23 | Centralised logging (Loki), log rotation, cold storage archival |
| 24 | Manual penetration test by independent assessor (includes biometric API surface) |
| 24 | DPIA completed and filed with NDPC (includes biometric data processing assessment) |
| 25 | Admin panel: provider management, facility management, audit query, biometric event review |
| 25 | Analytics dashboard: encounter volumes, registration trends, provisional upgrade rates |
| 26 | Patient portal: view own records, manage consents, NUHI QR code with liveness gate |
| 26 | Pilot go-live preparation: training materials, runbooks, support plan, biometric device setup guide |

---

### Phase 4 — Pilot (Months 7–12)

**Goal:** Live deployment in 3–5 pilot facilities across one state.

- Week 1–2: Deploy to pilot facilities. Staff training.
- Week 3–4: Go-live. Intensive monitoring. Daily standup with pilot facilities.
- Month 2–6: Collect KPI data. Iterate on UX issues. Fix bugs.
- Month 6: Pilot evaluation report. Lessons learned. Go/no-go for expansion.

**Pilot KPIs:**

| KPI | Target |
|---|---|
| Patient registration (NUHI assignments) | ≥1,000 |
| NIN-verified registrations (standard path) | ≥80% of total |
| Provisional registrations upgraded within 30 days | ≥70% |
| Active providers enrolled | ≥50 |
| Encounters recorded | ≥500 |
| Critical security incidents | 0 |
| Duplicate registration rate (same NIN issued two NUHIs) | 0% |
| Biometric match failure rate (inconclusive or no-match at registration) | < 5% |
| Referral completion rate (vs baseline) | +20% improvement |
| User satisfaction score | ≥ 4.0 / 5.0 |
| System uptime | ≥ 99.5% |

---

### Phase 5 — National Scale (Year 2+)

- State-by-state rollout following pilot success.
- SMART on FHIR ecosystem: third-party app integration.
- OpenSearch integration for advanced clinical analytics.
- AI-assisted provisional de-duplication (ML model trained on Nigerian name patterns to improve the Jaro-Winkler fallback for patients without NIN).
- Iris-based biometric option for facilities with iris scanners (supplements fingerprint as an alternative where fingerprints are worn or missing).
- Full NIMC self-enrolment integration: patients with provisional NUHI can complete NIN enrolment and upgrade their record entirely through the NUHIRIS patient app without visiting an office.
- Integration with NHIA for provider payment verification against encounter records.
- DHIS2 integration: FHIR → DHIS2 for national aggregate reporting.

---

## 17. Definition of Done

A feature is only **done** when all of the following are true:

- [ ] Code is written in TypeScript strict mode. No `any`, no `@ts-ignore`.
- [ ] All new DTOs have class-validator decorators.
- [ ] All new service methods have unit tests (≥90% line coverage).
- [ ] All new endpoints have integration tests covering: success case, auth failure (401), role failure (403), validation failure (422).
- [ ] Audit logging is active for all operations that touch patient data.
- [ ] Consent enforcement is active for all operations that return patient clinical data.
- [ ] All new database tables have appropriate indexes.
- [ ] No secrets in code (Vault / env vars only).
- [ ] OpenAPI spec updated (auto-generated from NestJS decorators — run `npm run api:spec`).
- [ ] FHIR resources (if applicable) validated against R4 profiles.
- [ ] CI pipeline passes (lint, type-check, unit tests, integration tests, security scan).
- [ ] PR reviewed and approved.
- [ ] README / runbook updated if deployment process changed.

---

## 18. Glossary

| Term | Definition |
|---|---|
| **ABAC** | Attribute-Based Access Control — access decisions based on attributes of the user, resource, and environment |
| **AuditEvent** | An immutable record of a user action in the system |
| **Biometric event** | An append-only record of every fingerprint or face match attempt, including result, confidence score, device, and NIMC reference |
| **Break-glass** | Emergency override mechanism allowing access beyond normal consent scope |
| **Device attestation** | Hardware-level proof that a device is genuine, unrooted/unjailbroken, and running an unmodified version of the NUHIRIS app |
| **Encounter** | A clinical contact event between a patient and a provider at a facility |
| **FHIR** | Fast Healthcare Interoperability Resources — HL7 standard for health data exchange |
| **FMOHSW** | Federal Ministry of Health and Social Welfare, Nigeria |
| **Geofence** | A GPS boundary around a registered facility; device must be within this boundary for high-trust biometric operations |
| **ICD-11** | International Classification of Diseases 11th Revision — WHO disease classification standard |
| **Idempotency key** | A unique token sent with a request that ensures the operation is only applied once even if retried |
| **Liveness detection** | A check that proves a real, physically present person is in front of the camera — not a photo, printed image, or recorded video. Uses active challenges (blink, turn head) or passive 3D depth analysis |
| **LOINC** | Logical Observation Identifiers Names and Codes — standard for lab tests and observations |
| **MFA** | Multi-Factor Authentication |
| **NDPA** | Nigeria Data Protection Act 2023 |
| **NDPC** | Nigeria Data Protection Commission |
| **NHIA** | National Health Insurance Authority |
| **NIN** | National Identification Number — issued by NIMC. The primary de-duplication anchor for NUHIRIS. Every standard registration begins with a NIN lookup and biometric match |
| **NIMC** | National Identity Management Commission — the Nigerian government agency that issues NINs and maintains the national biometric identity database |
| **NIMC Biometric Match API** | NIMC's API that accepts a fingerprint or face payload and returns a MATCH / NO MATCH result against the enrolled biometric for a given NIN |
| **NIMC Verification API** | NIMC's API that accepts a NIN and returns verified demographic data (name, DOB, state, photo) |
| **NITDA** | National Information Technology Development Agency |
| **NUHI** | National Unified Health Identity — a patient's unique, lifelong health identifier. UUID v4. Bound one-to-one to NIN for verified patients |
| **NUHIRIS** | National Unified Health Identity and Records Integration System |
| **OIDC** | OpenID Connect — identity layer on top of OAuth 2.0 |
| **Provisional NUHI** | A NUHI issued without NIN verification — for emergency, unconscious, or unregistered patients. Carries a 30-day upgrade deadline. Cannot be used to issue prescriptions or referrals |
| **Provenance** | Record of the authorship and source of a clinical data entry |
| **RBAC** | Role-Based Access Control |
| **Registered device** | A facility tablet or phone that has been enrolled in NUHIRIS, passed hardware attestation, and is authorised to perform biometric operations |
| **SMART on FHIR** | Substitutable Medical Applications, Reusable Technologies — standard for app auth on FHIR servers |
| **SNOMED CT** | Systematised Nomenclature of Medicine Clinical Terms — comprehensive clinical terminology |
| **Sovereign cloud** | Cloud infrastructure subject to Nigerian jurisdiction and data residency requirements |
| **WAT** | West Africa Time (UTC+1) |

---

*End of NUHIRIS Project Specification v1.2.0*

*Changelog v1.2.0 (June 2026): Multi-channel patient onboarding model introduced. Four parallel registration channels defined: Channel 1 (facility-assisted, fingerprint), Channel 2 (patient self-registration via app, NINAuth face+liveness), Channel 3 (facility kiosk, face+liveness), Channel 4 (provider-initiated remote, NIN+visual confirm). Registration types expanded from 3 to 5: biometric_verified, selfie_verified, provider_initiated, provisional, emergency. NINAuth confirmed as single NIMC integration point for all channels (NIN lookup, face match, liveness). Section 3.5 added: Patient Onboarding Channels. Patient identity module endpoints expanded to four channel-specific registration routes plus upgrade endpoints. Key service methods updated. Principle 10 added: NINAuth as single NIMC integration point. Phase 0 roadmap updated to include multi-channel registration flows.*

*Changelog v1.1.0 (June 2026): NIN promoted from optional supplementary field to primary de-duplication anchor. Biometric verification via NIMC Biometric Match API added as mandatory step in standard registration flow. Liveness detection and device attestation added as identity assurance layers. New tables: registered_devices, biometric_events. New guards: DeviceAttestationGuard, BiometricResultGuard. Jaro-Winkler fuzzy match demoted to provisional/fallback path only. Glossary expanded. Phase 0 roadmap updated. Pilot KPIs updated.*

*This document is the single source of truth for the NUHIRIS build. All architecture decisions, security requirements, API contracts, and coding standards defined here take precedence over any other source. When in doubt, refer back to this document.*