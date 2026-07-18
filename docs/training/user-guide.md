# NUHIRIS User Training Guide

## For Front Desk Staff

### Patient Registration
1. Navigate to **Register Patient** in the sidebar
2. Fill in required fields: Full Name, Date of Birth, Sex, State
3. If the patient has their NIN, enter it for immediate biometric verification
4. Click **Register** — the system generates a unique NUHI
5. Print or show the NUHI QR code to the patient

### Patient Search
1. Navigate to **Patient Search**
2. Enter patient name, NUHI, or phone number
3. Click on a patient to view their profile
4. To scan a NUHI QR code, use the mobile app's Scan tab

### Key Points
- Every patient gets a NUHI even without NIN (provisional registration)
- Provisional patients have 90 days to verify with NIN
- Never share NIN information — the system encrypts it automatically

---

## For Healthcare Providers

### Opening an Encounter
1. Find the patient via search or QR scan
2. Click **Open New Encounter** on the patient profile
3. Select encounter type (Outpatient, Inpatient, Emergency, etc.)
4. Enter the reason for visit
5. The encounter opens — you can now add clinical data

### During the Encounter
- Add **diagnoses** using ICD-11 codes (search by name or code)
- Record **observations** (vitals, lab values) with LOINC codes
- Write **prescriptions** — drug names link to SNOMED codes
- Order **lab tests** or make **referrals**

### Closing an Encounter
- Review all entries
- Click **Close Encounter** when the visit is complete
- The record becomes part of the patient's longitudinal history

---

## For Facility Administrators

### Managing Providers
- Navigate to **Admin > Providers** to see all registered providers
- Verify licence numbers against MDCN/PCN/NMCN registries
- Provider status can be active or suspended

### Managing Facilities
- Navigate to **Admin > Facilities** to see facility details
- Update facility type, tier, and contact information

### Reviewing Biometric Events
- Navigate to **Admin > Biometric Events**
- Filter by result type (Match, No Match, Error)
- Investigate flagged events: check liveness, device attestation, geofence

### Audit Log
- Navigate to **Audit Log** to review all system actions
- Filter by actor, patient, or resource type
- All entries are immutable — they cannot be deleted or modified

---

## For Patients (Patient Portal)

### Accessing Your Records
1. Log in at `portal.nuhiris.health.gov.ng`
2. **My Health ID** shows your NUHI and verification status
3. **My Records** shows your encounter history
4. **Manage Consents** lets you control who accesses your data

### Managing Consent
- Each facility you visit requires your consent
- You can **revoke** consent at any time
- Revoking consent prevents that facility from viewing your records going forward
- Emergency encounters may override consent for life-saving treatment

### Your NUHI QR Code
- Click **Show QR Code** on your profile
- Present this at any NUHIRIS facility for instant identification
- The QR code contains only your NUHI — no personal data

---

## Mobile App Guide

### Login
1. Open the NUHIRIS app
2. Enter your credentials
3. Complete biometric MFA (fingerprint or face)

### Offline Mode
- The app works without internet
- Registrations and encounters are saved locally
- Data syncs automatically when connectivity returns
- Look for the sync status indicator in Settings

### QR Scanning
1. Tap the **Scan QR** tab
2. Point camera at patient's NUHI QR code
3. The patient's record loads instantly
