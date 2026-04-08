/**
 * =========================================================
 * DEMO SEED DATA SYSTEM
 * =========================================================
 * Generates realistic demo data per industry so new orgs
 * see a populated dashboard on first login.
 *
 * All demo records use is_demo=true flag or demo_ prefixed IDs.
 * A demo banner MUST be shown when demo data is active.
 */

export interface SeedObligation {
  title: string;
  framework: string;
  status: 'overdue' | 'due_soon' | 'on_track' | 'completed' | 'not_started';
  due_date: string;
  owner: string;
  is_demo: boolean;
}

export interface SeedIncident {
  title: string;
  status:
    | 'new'
    | 'under_investigation'
    | 'notified'
    | 'under_review'
    | 'closed';
  severity: 'low' | 'medium' | 'high' | 'critical';
  reported_date: string;
  is_demo: boolean;
}

export interface SeedTask {
  title: string;
  status: 'pending' | 'in_progress' | 'completed';
  due_date: string;
  assignee: string;
  is_demo: boolean;
}

export interface SeedPolicy {
  title: string;
  status: 'published' | 'draft';
  version: string;
  is_demo: boolean;
}

export interface SeedEvidence {
  title: string;
  obligation_title: string;
  type: string;
  is_demo: boolean;
}

export interface SeedStaffRecord {
  name: string;
  check_type: string;
  check_status: 'current' | 'expiring_soon' | 'expired';
  expiry_date: string;
  reference_number: string;
  is_demo: boolean;
}

export interface SeedParticipant {
  name: string;
  identifier: string;
  status: string;
  is_demo: boolean;
}

export interface SeedBreach {
  breach_id: string;
  description: string;
  detected_date: string;
  reported_to_asic: boolean;
  days_open: number;
  status: 'detected' | 'assessed' | 'reported' | 'closed';
  is_demo: boolean;
}

export interface SeedSite {
  name: string;
  status: string;
  is_demo: boolean;
}

export interface IndustrySeedData {
  obligations: SeedObligation[];
  incidents: SeedIncident[];
  tasks: SeedTask[];
  policies: SeedPolicy[];
  evidence: SeedEvidence[];
  staff: SeedStaffRecord[];
  participants: SeedParticipant[];
  breaches: SeedBreach[];
  sites: SeedSite[];
}

// Utility: relative date string from today
function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function daysAgo(days: number): string {
  return daysFromNow(-days);
}

// =========================================================
// BASE SEED (shared by all industries)
// =========================================================
function baseSeed(industry: string): IndustrySeedData {
  return {
    obligations: [
      {
        title: 'Annual Risk Assessment',
        framework: 'General',
        status: 'overdue',
        due_date: daysAgo(15),
        owner: 'Demo Compliance Officer',
        is_demo: true,
      },
      {
        title: 'Staff Training Register Update',
        framework: 'General',
        status: 'due_soon',
        due_date: daysFromNow(7),
        owner: 'Demo HR Manager',
        is_demo: true,
      },
      {
        title: 'Policy Review Cycle',
        framework: 'General',
        status: 'on_track',
        due_date: daysFromNow(45),
        owner: 'Demo Compliance Officer',
        is_demo: true,
      },
      {
        title: 'Incident Register Audit',
        framework: 'General',
        status: 'completed',
        due_date: daysAgo(5),
        owner: 'Demo Quality Lead',
        is_demo: true,
      },
      {
        title: 'Evidence Collection Deadline',
        framework: 'General',
        status: 'due_soon',
        due_date: daysFromNow(3),
        owner: 'Demo Operations Manager',
        is_demo: true,
      },
    ],
    incidents: [
      {
        title: 'Workplace Safety Concern',
        status: 'under_investigation',
        severity: 'medium',
        reported_date: daysAgo(3),
        is_demo: true,
      },
      {
        title: 'Data Access Anomaly',
        status: 'new',
        severity: 'low',
        reported_date: daysAgo(1),
        is_demo: true,
      },
    ],
    tasks: [
      {
        title: 'Review outstanding compliance items',
        status: 'pending',
        due_date: daysFromNow(5),
        assignee: 'Current User',
        is_demo: true,
      },
      {
        title: 'Upload evidence for Q1 audit',
        status: 'in_progress',
        due_date: daysFromNow(10),
        assignee: 'Current User',
        is_demo: true,
      },
      {
        title: 'Schedule team compliance training',
        status: 'pending',
        due_date: daysFromNow(14),
        assignee: 'Current User',
        is_demo: true,
      },
    ],
    policies: [
      {
        title: 'Privacy & Data Protection Policy',
        status: 'published',
        version: 'v2.1',
        is_demo: true,
      },
      {
        title: 'Incident Response Procedure',
        status: 'draft',
        version: 'v0.3',
        is_demo: true,
      },
    ],
    evidence: [
      {
        title: 'Risk Assessment Report Q4',
        obligation_title: 'Annual Risk Assessment',
        type: 'document',
        is_demo: true,
      },
      {
        title: 'Training Completion Certificate',
        obligation_title: 'Staff Training Register Update',
        type: 'certificate',
        is_demo: true,
      },
      {
        title: 'Policy Review Minutes',
        obligation_title: 'Policy Review Cycle',
        type: 'document',
        is_demo: true,
      },
      {
        title: 'Incident Register Export',
        obligation_title: 'Incident Register Audit',
        type: 'report',
        is_demo: true,
      },
      {
        title: 'Evidence Collection Log',
        obligation_title: 'Evidence Collection Deadline',
        type: 'log',
        is_demo: true,
      },
    ],
    staff: [],
    participants: [],
    breaches: [],
    sites: [],
  };
}

// =========================================================
// NDIS SEED DATA
// =========================================================
function ndisSeed(): Partial<IndustrySeedData> {
  return {
    obligations: [
      {
        title: 'NDIS Worker Screening \u2014 Review expiry dates',
        framework: 'NDIS Practice Standards',
        status: 'due_soon',
        due_date: daysFromNow(14),
        owner: 'Demo HR Manager',
        is_demo: true,
      },
      {
        title: 'Participant Rights \u2014 Consent review',
        framework: 'NDIS Practice Standards',
        status: 'on_track',
        due_date: daysFromNow(30),
        owner: 'Demo Quality Lead',
        is_demo: true,
      },
      {
        title: 'SIRS Reporting \u2014 Quarterly review',
        framework: 'NDIS Practice Standards',
        status: 'overdue',
        due_date: daysAgo(7),
        owner: 'Demo Operations Manager',
        is_demo: true,
      },
    ],
    participants: [
      {
        name: 'Demo Participant A',
        identifier: 'NDIS-DEMO-001',
        status: 'Active',
        is_demo: true,
      },
      {
        name: 'Demo Participant B',
        identifier: 'NDIS-DEMO-002',
        status: 'Active',
        is_demo: true,
      },
      {
        name: 'Demo Participant C',
        identifier: 'NDIS-DEMO-003',
        status: 'Review',
        is_demo: true,
      },
    ],
    staff: [
      {
        name: 'Demo Worker 1',
        check_type: 'NDIS Worker Screening',
        check_status: 'current',
        expiry_date: daysFromNow(180),
        reference_number: 'WS-DEMO-001',
        is_demo: true,
      },
      {
        name: 'Demo Worker 2',
        check_type: 'NDIS Worker Screening',
        check_status: 'current',
        expiry_date: daysFromNow(90),
        reference_number: 'WS-DEMO-002',
        is_demo: true,
      },
      {
        name: 'Demo Worker 3',
        check_type: 'NDIS Worker Screening',
        check_status: 'expiring_soon',
        expiry_date: daysFromNow(14),
        reference_number: 'WS-DEMO-003',
        is_demo: true,
      },
      {
        name: 'Demo Worker 4',
        check_type: 'NDIS Worker Screening',
        check_status: 'expired',
        expiry_date: daysAgo(10),
        reference_number: 'WS-DEMO-004',
        is_demo: true,
      },
    ],
    incidents: [
      {
        title: 'SIRS Reportable Incident \u2014 Provider notification',
        status: 'notified',
        severity: 'high',
        reported_date: daysAgo(5),
        is_demo: true,
      },
    ],
  };
}

// =========================================================
// HEALTHCARE SEED DATA
// =========================================================
function healthcareSeed(): Partial<IndustrySeedData> {
  return {
    obligations: [
      {
        title: 'AHPRA Registration \u2014 Verify all practitioners',
        framework: 'NSQHS Standards',
        status: 'due_soon',
        due_date: daysFromNow(21),
        owner: 'Demo Practice Manager',
        is_demo: true,
      },
      {
        title: 'Clinical Governance Review',
        framework: 'NSQHS Standards',
        status: 'on_track',
        due_date: daysFromNow(60),
        owner: 'Demo Clinical Lead',
        is_demo: true,
      },
    ],
    staff: [
      {
        name: 'Dr Demo Practitioner 1',
        check_type: 'AHPRA Registration',
        check_status: 'current',
        expiry_date: daysFromNow(365),
        reference_number: 'MED-DEMO-001',
        is_demo: true,
      },
      {
        name: 'Dr Demo Practitioner 2',
        check_type: 'AHPRA Registration',
        check_status: 'current',
        expiry_date: daysFromNow(200),
        reference_number: 'MED-DEMO-002',
        is_demo: true,
      },
      {
        name: 'Dr Demo Practitioner 3',
        check_type: 'AHPRA Registration',
        check_status: 'expiring_soon',
        expiry_date: daysFromNow(20),
        reference_number: 'MED-DEMO-003',
        is_demo: true,
      },
    ],
    incidents: [
      {
        title: 'Adverse Event \u2014 Medication error',
        status: 'under_review',
        severity: 'medium',
        reported_date: daysAgo(2),
        is_demo: true,
      },
    ],
  };
}

// =========================================================
// AGED CARE SEED DATA
// =========================================================
function agedCareSeed(): Partial<IndustrySeedData> {
  return {
    obligations: [
      {
        title: 'Aged Care Quality Standards \u2014 Self-assessment',
        framework: 'Aged Care Quality Standards',
        status: 'due_soon',
        due_date: daysFromNow(14),
        owner: 'Demo Quality Manager',
        is_demo: true,
      },
      {
        title: 'Star Rating Readiness \u2014 72% complete',
        framework: 'Aged Care Quality Standards',
        status: 'on_track',
        due_date: daysFromNow(45),
        owner: 'Demo Facility Manager',
        is_demo: true,
      },
    ],
    participants: [
      {
        name: 'Demo Resident A',
        identifier: 'RES-DEMO-001',
        status: 'Active',
        is_demo: true,
      },
      {
        name: 'Demo Resident B',
        identifier: 'RES-DEMO-002',
        status: 'Active',
        is_demo: true,
      },
      {
        name: 'Demo Resident C',
        identifier: 'RES-DEMO-003',
        status: 'Active',
        is_demo: true,
      },
      {
        name: 'Demo Resident D',
        identifier: 'RES-DEMO-004',
        status: 'Care Plan Review',
        is_demo: true,
      },
    ],
    incidents: [
      {
        title: 'SIRS Incident \u2014 Fall with injury',
        status: 'notified',
        severity: 'high',
        reported_date: daysAgo(4),
        is_demo: true,
      },
      {
        title: 'SIRS Incident \u2014 Unreasonable use of force allegation',
        status: 'under_investigation',
        severity: 'critical',
        reported_date: daysAgo(8),
        is_demo: true,
      },
    ],
  };
}

// =========================================================
// CHILDCARE SEED DATA
// =========================================================
function childcareSeed(): Partial<IndustrySeedData> {
  return {
    obligations: [
      {
        title: 'NQF Quality Area 1 \u2014 Educational program',
        framework: 'ACECQA NQF',
        status: 'completed',
        due_date: daysAgo(10),
        owner: 'Demo Educational Leader',
        is_demo: true,
      },
      {
        title: 'NQF Quality Area 2 \u2014 Health and safety',
        framework: 'ACECQA NQF',
        status: 'due_soon',
        due_date: daysFromNow(14),
        owner: 'Demo Director',
        is_demo: true,
      },
      {
        title: 'NQF Quality Area 7 \u2014 Governance and leadership',
        framework: 'ACECQA NQF',
        status: 'on_track',
        due_date: daysFromNow(60),
        owner: 'Demo Director',
        is_demo: true,
      },
    ],
    staff: [
      {
        name: 'Demo Educator 1',
        check_type: 'Working with Children Check',
        check_status: 'current',
        expiry_date: daysFromNow(400),
        reference_number: 'WWC-DEMO-001',
        is_demo: true,
      },
      {
        name: 'Demo Educator 2',
        check_type: 'Working with Children Check',
        check_status: 'current',
        expiry_date: daysFromNow(200),
        reference_number: 'WWC-DEMO-002',
        is_demo: true,
      },
      {
        name: 'Demo Educator 3',
        check_type: 'Working with Children Check',
        check_status: 'expiring_soon',
        expiry_date: daysFromNow(21),
        reference_number: 'WWC-DEMO-003',
        is_demo: true,
      },
      {
        name: 'Demo Educator 4',
        check_type: 'Working with Children Check',
        check_status: 'current',
        expiry_date: daysFromNow(300),
        reference_number: 'WWC-DEMO-004',
        is_demo: true,
      },
    ],
    incidents: [
      {
        title: 'Child safety incident \u2014 Playground fall',
        status: 'under_investigation',
        severity: 'medium',
        reported_date: daysAgo(2),
        is_demo: true,
      },
    ],
  };
}

// =========================================================
// FINANCIAL SERVICES SEED DATA
// =========================================================
function financialServicesSeed(): Partial<IndustrySeedData> {
  return {
    obligations: [
      {
        title: 'AFS Licence \u2014 Annual compliance certificate',
        framework: 'ASIC AFS',
        status: 'due_soon',
        due_date: daysFromNow(30),
        owner: 'Demo Compliance Officer',
        is_demo: true,
      },
      {
        title: 'AUSTRAC AML/CTF \u2014 Program review',
        framework: 'AUSTRAC AML/CTF',
        status: 'on_track',
        due_date: daysFromNow(60),
        owner: 'Demo AML Officer',
        is_demo: true,
      },
      {
        title: 'AFCA Membership \u2014 Annual reporting',
        framework: 'ASIC AFS',
        status: 'overdue',
        due_date: daysAgo(5),
        owner: 'Demo Compliance Officer',
        is_demo: true,
      },
    ],
    breaches: [
      {
        breach_id: 'BR-DEMO-001',
        description: 'Late lodgement of financial statements',
        detected_date: daysAgo(12),
        reported_to_asic: false,
        days_open: 12,
        status: 'assessed',
        is_demo: true,
      },
    ],
  };
}

// =========================================================
// CONSTRUCTION SEED DATA
// =========================================================
function constructionSeed(): Partial<IndustrySeedData> {
  return {
    obligations: [
      {
        title: 'WHS Induction \u2014 All site workers',
        framework: 'WHS Act',
        status: 'due_soon',
        due_date: daysFromNow(7),
        owner: 'Demo Site Manager',
        is_demo: true,
      },
      {
        title: 'Safe Work Method Statements \u2014 Review',
        framework: 'WHS Act',
        status: 'on_track',
        due_date: daysFromNow(30),
        owner: 'Demo WHS Officer',
        is_demo: true,
      },
    ],
    sites: [
      { name: 'Demo Site Alpha', status: 'Active', is_demo: true },
      { name: 'Demo Site Beta', status: 'Active', is_demo: true },
    ],
    staff: [
      {
        name: 'Demo Contractor 1',
        check_type: 'Site Induction',
        check_status: 'current',
        expiry_date: daysFromNow(90),
        reference_number: 'IND-DEMO-001',
        is_demo: true,
      },
      {
        name: 'Demo Contractor 2',
        check_type: 'Site Induction',
        check_status: 'current',
        expiry_date: daysFromNow(60),
        reference_number: 'IND-DEMO-002',
        is_demo: true,
      },
      {
        name: 'Demo Contractor 3',
        check_type: 'Site Induction',
        check_status: 'expiring_soon',
        expiry_date: daysFromNow(7),
        reference_number: 'IND-DEMO-003',
        is_demo: true,
      },
      {
        name: 'Demo Contractor 4',
        check_type: 'Site Induction',
        check_status: 'expired',
        expiry_date: daysAgo(14),
        reference_number: 'IND-DEMO-004',
        is_demo: true,
      },
    ],
    incidents: [
      {
        title: 'Near miss \u2014 Falling object',
        status: 'under_investigation',
        severity: 'high',
        reported_date: daysAgo(1),
        is_demo: true,
      },
    ],
  };
}

// =========================================================
// MAIN GENERATOR
// =========================================================
function mergeSeed(
  base: IndustrySeedData,
  industry: Partial<IndustrySeedData>,
): IndustrySeedData {
  return {
    obligations: [...base.obligations, ...(industry.obligations ?? [])],
    incidents: [...base.incidents, ...(industry.incidents ?? [])],
    tasks: [...base.tasks, ...(industry.tasks ?? [])],
    policies: [...base.policies, ...(industry.policies ?? [])],
    evidence: [...base.evidence, ...(industry.evidence ?? [])],
    staff: [...base.staff, ...(industry.staff ?? [])],
    participants: [...base.participants, ...(industry.participants ?? [])],
    breaches: [...base.breaches, ...(industry.breaches ?? [])],
    sites: [...base.sites, ...(industry.sites ?? [])],
  };
}

const INDUSTRY_SEED_FN: Record<string, () => Partial<IndustrySeedData>> = {
  ndis: ndisSeed,
  healthcare: healthcareSeed,
  aged_care: agedCareSeed,
  childcare: childcareSeed,
  financial_services: financialServicesSeed,
  construction: constructionSeed,
};

export function generateSeedData(industry: string): IndustrySeedData {
  const base = baseSeed(industry);
  const industryFn = INDUSTRY_SEED_FN[industry];
  if (!industryFn) return base;
  return mergeSeed(base, industryFn());
}

export const SUPPORTED_SEED_INDUSTRIES = Object.keys(INDUSTRY_SEED_FN);
