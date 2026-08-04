/**
 * Demo accounts seeded by the API migrations (DemoAccounts1718700000005).
 * Every account shares the same password so the login screen can offer
 * one-click sign-in for each role during walkthroughs.
 */

export const DEMO_PASSWORD = 'Password1!';

export interface DemoAccount {
  username: string;
  role: string;
  /** Human-readable role name shown on the card */
  roleLabel: string;
  /** The person behind the account */
  displayName: string;
  facility: string;
  /** What this role is worth showing off */
  highlight: string;
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    username: 'admin',
    role: 'national_admin',
    roleLabel: 'National Admin',
    displayName: 'System Administrator',
    facility: 'Federal Ministry of Health',
    highlight: 'Full oversight — analytics, facilities, providers, audit',
  },
  {
    username: 'fadmin',
    role: 'facility_admin',
    roleLabel: 'Facility Admin',
    displayName: 'Facility Administrator',
    facility: 'LUTH, Lagos',
    highlight: 'Manages one facility’s staff, devices and reporting',
  },
  {
    username: 'dr.amina',
    role: 'medical_officer',
    roleLabel: 'Medical Officer',
    displayName: 'Dr Amina Yusuf',
    facility: 'LUTH, Lagos',
    highlight: 'Open encounters, diagnoses, prescribing, referrals',
  },
  {
    username: 'nurse.chidi',
    role: 'nurse',
    roleLabel: 'Nurse',
    displayName: 'Nurse Chidi Okafor',
    facility: 'LUTH, Lagos',
    highlight: 'Vitals, triage, emergency encounter and break-glass',
  },
  {
    username: 'pharm.fatima',
    role: 'pharmacist',
    roleLabel: 'Pharmacist',
    displayName: 'Pharm Fatima Bello',
    facility: 'LUTH, Lagos',
    highlight: 'Two active prescriptions waiting to be dispensed',
  },
  {
    username: 'lab.emeka',
    role: 'lab_scientist',
    roleLabel: 'Lab Scientist',
    displayName: 'Dr Emeka Nwosu',
    facility: 'FMC Keffi, Nasarawa',
    highlight: 'Pending lab orders including one urgent request',
  },
  {
    username: 'hro.aisha',
    role: 'health_records_officer',
    roleLabel: 'Health Records Officer',
    displayName: 'Aisha Bala',
    facility: 'LUTH, Lagos',
    highlight: 'Patient registration and NIN identity verification',
  },
  {
    username: 'auditor.tunde',
    role: 'audit_inspector',
    roleLabel: 'Audit Inspector',
    displayName: 'Tunde Adeyemi',
    facility: 'NUHIRIS Governance',
    highlight: 'Read-only audit trail — denials and break-glass reviews',
  },
  {
    username: 'patient.ada',
    role: 'patient',
    roleLabel: 'Patient',
    displayName: 'Adebayo Ogunlesi',
    facility: 'Patient Portal',
    highlight: 'Own records, health ID and consent grant/revoke',
  },
];

/** Where each role lands after a successful sign-in. */
export function landingPathForRole(role: string): string {
  switch (role) {
    case 'patient':
      return '/portal';
    case 'audit_inspector':
      return '/audit';
    default:
      return '/dashboard';
  }
}
