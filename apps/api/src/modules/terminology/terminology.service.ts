import { Injectable } from '@nestjs/common';

export interface TerminologyEntry {
  code: string;
  display: string;
  system: string;
}

const ICD11_SYSTEM = 'http://id.who.int/icd/release/11/mms';
const LOINC_SYSTEM = 'http://loinc.org';
const SNOMED_SYSTEM = 'http://snomed.info/sct';

const ICD11_CODES: TerminologyEntry[] = [
  { code: '1A00', display: 'Cholera', system: ICD11_SYSTEM },
  { code: '1A01', display: 'Intestinal infection due to other Vibrio', system: ICD11_SYSTEM },
  { code: '1A02', display: 'Typhoid fever', system: ICD11_SYSTEM },
  { code: '1A03', display: 'Paratyphoid fever', system: ICD11_SYSTEM },
  { code: '1A07', display: 'Shigellosis', system: ICD11_SYSTEM },
  { code: '1B10', display: 'Tuberculosis of the lung', system: ICD11_SYSTEM },
  { code: '1C62', display: 'Malaria due to Plasmodium falciparum', system: ICD11_SYSTEM },
  { code: '1C81', display: 'HIV disease resulting in infectious or parasitic disease', system: ICD11_SYSTEM },
  { code: '1D80', display: 'Measles', system: ICD11_SYSTEM },
  { code: '1E50', display: 'Meningococcal disease', system: ICD11_SYSTEM },
  { code: '2A00', display: 'Neoplasm of breast', system: ICD11_SYSTEM },
  { code: '5A11', display: 'Type 2 diabetes mellitus', system: ICD11_SYSTEM },
  { code: '5A10', display: 'Type 1 diabetes mellitus', system: ICD11_SYSTEM },
  { code: 'BA00', display: 'Essential hypertension', system: ICD11_SYSTEM },
  { code: 'BA01', display: 'Hypertensive heart disease', system: ICD11_SYSTEM },
  { code: 'BA80', display: 'Ischaemic heart disease', system: ICD11_SYSTEM },
  { code: 'BA81', display: 'Acute myocardial infarction', system: ICD11_SYSTEM },
  { code: 'BD11', display: 'Heart failure', system: ICD11_SYSTEM },
  { code: 'CA07', display: 'Pneumonia', system: ICD11_SYSTEM },
  { code: 'CA08', display: 'Bronchitis', system: ICD11_SYSTEM },
  { code: 'CA20', display: 'Asthma', system: ICD11_SYSTEM },
  { code: 'DA01', display: 'Gastric ulcer', system: ICD11_SYSTEM },
  { code: 'DA02', display: 'Duodenal ulcer', system: ICD11_SYSTEM },
  { code: 'DA90', display: 'Appendicitis', system: ICD11_SYSTEM },
  { code: 'GB61', display: 'Pre-eclampsia', system: ICD11_SYSTEM },
  { code: 'KA00', display: 'Acute kidney failure', system: ICD11_SYSTEM },
  { code: 'MD81', display: 'Fracture of femur', system: ICD11_SYSTEM },
  { code: 'MG30', display: 'Low back pain', system: ICD11_SYSTEM },
  { code: 'NF01', display: 'Sickle cell disease', system: ICD11_SYSTEM },
  { code: '8B11', display: 'Cerebrovascular accident (stroke)', system: ICD11_SYSTEM },
];

const LOINC_CODES: TerminologyEntry[] = [
  { code: '2093-3', display: 'Total Cholesterol', system: LOINC_SYSTEM },
  { code: '2085-9', display: 'HDL Cholesterol', system: LOINC_SYSTEM },
  { code: '2089-1', display: 'LDL Cholesterol', system: LOINC_SYSTEM },
  { code: '2571-8', display: 'Triglycerides', system: LOINC_SYSTEM },
  { code: '2339-0', display: 'Glucose (blood)', system: LOINC_SYSTEM },
  { code: '4548-4', display: 'HbA1c', system: LOINC_SYSTEM },
  { code: '2160-0', display: 'Creatinine (serum)', system: LOINC_SYSTEM },
  { code: '3094-0', display: 'BUN (Blood Urea Nitrogen)', system: LOINC_SYSTEM },
  { code: '718-7', display: 'Hemoglobin', system: LOINC_SYSTEM },
  { code: '4544-3', display: 'Hematocrit', system: LOINC_SYSTEM },
  { code: '6690-2', display: 'WBC (White Blood Cells)', system: LOINC_SYSTEM },
  { code: '777-3', display: 'Platelet Count', system: LOINC_SYSTEM },
  { code: '1742-6', display: 'ALT (Alanine Aminotransferase)', system: LOINC_SYSTEM },
  { code: '1920-8', display: 'AST (Aspartate Aminotransferase)', system: LOINC_SYSTEM },
  { code: '1975-2', display: 'Total Bilirubin', system: LOINC_SYSTEM },
  { code: '2951-2', display: 'Sodium (serum)', system: LOINC_SYSTEM },
  { code: '2823-3', display: 'Potassium (serum)', system: LOINC_SYSTEM },
  { code: '2075-0', display: 'Chloride (serum)', system: LOINC_SYSTEM },
  { code: '8310-5', display: 'Body Temperature', system: LOINC_SYSTEM },
  { code: '8462-4', display: 'Diastolic Blood Pressure', system: LOINC_SYSTEM },
  { code: '8480-6', display: 'Systolic Blood Pressure', system: LOINC_SYSTEM },
  { code: '8867-4', display: 'Heart Rate', system: LOINC_SYSTEM },
  { code: '9279-1', display: 'Respiratory Rate', system: LOINC_SYSTEM },
  { code: '2947-0', display: 'Oxygen Saturation (SpO2)', system: LOINC_SYSTEM },
  { code: '29463-7', display: 'Body Weight', system: LOINC_SYSTEM },
  { code: '8302-2', display: 'Body Height', system: LOINC_SYSTEM },
  { code: '39156-5', display: 'BMI', system: LOINC_SYSTEM },
  { code: '24357-6', display: 'Urinalysis', system: LOINC_SYSTEM },
  { code: '5778-6', display: 'Blood Film (Malaria Parasite)', system: LOINC_SYSTEM },
  { code: '7905-3', display: 'HIV-1 antibody', system: LOINC_SYSTEM },
];

const SNOMED_CODES: TerminologyEntry[] = [
  { code: '27658006', display: 'Amoxicillin', system: SNOMED_SYSTEM },
  { code: '387174006', display: 'Metformin', system: SNOMED_SYSTEM },
  { code: '386864001', display: 'Amlodipine', system: SNOMED_SYSTEM },
  { code: '387207008', display: 'Ibuprofen', system: SNOMED_SYSTEM },
  { code: '387517004', display: 'Paracetamol (Acetaminophen)', system: SNOMED_SYSTEM },
  { code: '373254001', display: 'Omeprazole', system: SNOMED_SYSTEM },
  { code: '372756006', display: 'Atorvastatin', system: SNOMED_SYSTEM },
  { code: '387106007', display: 'Losartan', system: SNOMED_SYSTEM },
  { code: '386983007', display: 'Alprazolam', system: SNOMED_SYSTEM },
  { code: '387104005', display: 'Lisinopril', system: SNOMED_SYSTEM },
  { code: '372584003', display: 'Ciprofloxacin', system: SNOMED_SYSTEM },
  { code: '373270004', display: 'Metronidazole', system: SNOMED_SYSTEM },
  { code: '387170002', display: 'Artemether-Lumefantrine', system: SNOMED_SYSTEM },
  { code: '96253006', display: 'Peanut allergy', system: SNOMED_SYSTEM },
  { code: '91936005', display: 'Penicillin allergy', system: SNOMED_SYSTEM },
  { code: '91935009', display: 'Aspirin allergy', system: SNOMED_SYSTEM },
  { code: '418038007', display: 'Latex allergy', system: SNOMED_SYSTEM },
  { code: '300916003', display: 'Egg allergy', system: SNOMED_SYSTEM },
  { code: '3457005', display: 'Patient referral', system: SNOMED_SYSTEM },
  { code: '108252007', display: 'Laboratory procedure', system: SNOMED_SYSTEM },
];

@Injectable()
export class TerminologyService {
  private readonly codesets = new Map<string, TerminologyEntry[]>([
    ['icd11', ICD11_CODES],
    ['loinc', LOINC_CODES],
    ['snomed', SNOMED_CODES],
  ]);

  search(system: string, query: string, limit = 20): TerminologyEntry[] {
    const codes = this.codesets.get(system);
    if (!codes) return [];

    const q = query.toLowerCase();
    return codes
      .filter((e) => e.code.toLowerCase().includes(q) || e.display.toLowerCase().includes(q))
      .slice(0, limit);
  }

  lookup(system: string, code: string): TerminologyEntry | null {
    const codes = this.codesets.get(system);
    if (!codes) return null;
    return codes.find((e) => e.code === code) ?? null;
  }

  validate(system: string, code: string): { valid: boolean; display?: string } {
    const entry = this.lookup(system, code);
    if (entry) return { valid: true, display: entry.display };
    return { valid: false };
  }

  listSystems(): Array<{ id: string; name: string; uri: string; count: number }> {
    return [
      { id: 'icd11', name: 'ICD-11', uri: ICD11_SYSTEM, count: ICD11_CODES.length },
      { id: 'loinc', name: 'LOINC', uri: LOINC_SYSTEM, count: LOINC_CODES.length },
      { id: 'snomed', name: 'SNOMED CT', uri: SNOMED_SYSTEM, count: SNOMED_CODES.length },
    ];
  }
}
