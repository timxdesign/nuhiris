# Data Protection Impact Assessment (DPIA)
## NUHIRIS — National Unified Health Identity and Records Integration System

**Filing Authority:** Nigeria Data Protection Commission (NDPC)
**Data Controller:** Federal Ministry of Health, Nigeria
**Assessment Date:** ___________
**DPIA Reference:** NUHIRIS-DPIA-2026-001

---

## 1. Project Description

### 1.1 Purpose
NUHIRIS provides a national unified health identity for every Nigerian, enabling secure sharing of health records across facilities. The system assigns a National Unified Health Identifier (NUHI) to each patient and maintains a longitudinal electronic health record.

### 1.2 Data Processing Activities
| Activity | Purpose | Legal Basis |
|----------|---------|-------------|
| Patient registration | Create NUHI identity | Public interest (healthcare delivery) |
| NIN verification | Identity validation | Legal obligation (NIN Act) |
| Biometric capture | Identity deduplication | Consent + public interest |
| Health record storage | Clinical care continuity | Vital interest + public interest |
| Audit logging | Accountability and compliance | Legal obligation |
| Analytics | Public health surveillance | Public interest |

### 1.3 Data Subjects
- Patients (including minors with guardian consent)
- Healthcare providers
- System administrators

---

## 2. Data Inventory

### 2.1 Personal Data Categories
| Category | Data Elements | Sensitivity | Retention |
|----------|--------------|-------------|-----------|
| Identity | Full name, date of birth, sex, state, LGA | Standard | Lifetime |
| Contact | Phone number, email | Standard | Active + 5 years |
| National ID | NIN (encrypted) | High | Lifetime |
| Biometric | Face match score, liveness result | High (Special Category) | 7 years |
| Health Records | Diagnoses, observations, prescriptions, lab results | High (Special Category) | Lifetime |
| NIMC Photo Ref | Reference to NIMC photo (encrypted) | High | Lifetime |
| Access Logs | Actor ID, timestamp, action, IP address | Standard | 7 years |

### 2.2 Special Category Data
Biometric data and health records are classified as **sensitive personal data** under the NDPA 2023, requiring enhanced safeguards.

---

## 3. Necessity and Proportionality

### 3.1 Why This Processing is Necessary
- Nigeria lacks a unified patient identifier, causing duplicate records and medication errors
- Cross-facility record sharing requires verified identity
- Biometric verification prevents identity fraud in healthcare

### 3.2 Proportionality Assessment
- Only minimum necessary data is collected at each stage
- NIN is encrypted at rest and never included in API responses
- Biometric raw data is NOT stored — only match scores and liveness results
- Patient consent is enforced at the API level before any data sharing

---

## 4. Risk Assessment

### 4.1 Identified Risks

| # | Risk | Likelihood | Impact | Inherent Risk | Mitigation | Residual Risk |
|---|------|-----------|--------|--------------|------------|--------------|
| R1 | Unauthorized access to health records | Medium | High | High | JWT auth, RBAC, consent guard, audit logging | Low |
| R2 | NIN data breach | Low | Critical | High | AES-256-GCM encryption, HMAC for lookup, Vault key management | Low |
| R3 | Biometric data misuse | Low | Critical | High | No raw biometric storage, encrypted NIN in events, device attestation | Low |
| R4 | Cross-facility data leakage | Medium | High | High | Facility-scoped access, consent verification per request | Low |
| R5 | Insider threat (admin abuse) | Low | High | Medium | Audit trail on all access, role separation, immutable logs | Low |
| R6 | Data loss | Low | Critical | High | Automated backups, multi-AZ RDS, point-in-time recovery | Low |
| R7 | Re-identification from anonymized data | Low | Medium | Medium | No bulk export without admin, no NIN in responses | Low |

### 4.2 Biometric-Specific Risks

| # | Risk | Mitigation |
|---|------|-----------|
| B1 | Spoofing (photo/video replay) | Liveness detection required, device attestation |
| B2 | Biometric template theft | Templates are NOT stored — NIMC performs matching |
| B3 | Coercion at point of capture | Audit trail of who performed capture, geofence validation |
| B4 | Function creep beyond healthcare | Strict scope in consent, purpose limitation enforced |

---

## 5. Technical and Organizational Measures

### 5.1 Encryption
- **At rest:** AES-256-GCM for NIN, NIMC photo ref, biometric NIN
- **In transit:** TLS 1.3 for all connections
- **Key management:** HashiCorp Vault with AppRole authentication

### 5.2 Access Controls
- Keycloak OIDC with RS256 JWT tokens
- Role hierarchy: national_admin > state_officer > facility_admin > provider > front_desk
- Consent-based access: API enforces patient consent before sharing records
- Network policies restrict database access to API pods only

### 5.3 Audit & Accountability
- Every patient data access generates an immutable audit event
- Audit events include: actor, action, resource, timestamp, IP, outcome
- Provenance tracking for all clinical data modifications
- 7-year retention for audit logs

### 5.4 Data Subject Rights
- **Access:** Patient portal allows viewing own records
- **Rectification:** Providers can update records with audit trail
- **Erasure:** Soft delete with 30-day grace period (clinical records exempt per regulation)
- **Portability:** FHIR R4 export capability
- **Consent management:** Patients can grant/revoke consent per facility

### 5.5 Monitoring
- Prometheus metrics with alerting on anomalous access patterns
- Centralized logging via Loki with 90-day hot retention
- Grafana dashboards for security operations

---

## 6. Consultation

### 6.1 Data Subjects
Patient advisory group to be consulted during pilot phase at selected facilities in Lagos and Abuja.

### 6.2 NDPC
This DPIA is filed with the Nigeria Data Protection Commission as required for high-risk processing involving biometric data and health records at national scale.

---

## 7. Approval

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Data Controller Representative | | | |
| Data Protection Officer | | | |
| Chief Technology Officer | | | |
| NDPC Acknowledgment | | | |

---

## 8. Review Schedule
This DPIA shall be reviewed:
- Annually
- Upon significant system changes
- Upon regulatory changes affecting health data
- After any data breach incident
