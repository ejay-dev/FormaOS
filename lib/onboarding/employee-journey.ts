/**
 * =========================================================
 * EMPLOYEE ONBOARDING JOURNEY
 * =========================================================
 *
 * Defines the 5-step employee onboarding experience for
 * invited team members. Industry-aware throughout — support
 * workers, healthcare practitioners, educators, and finance
 * staff all see content relevant to their day-to-day.
 *
 * Steps:
 * 1. Welcome       — Personalised greeting with org context
 * 2. Mission       — What compliance means for *them* (not the org)
 * 3. Tools         — Visual showcase of the 4–5 tools they'll use daily
 * 4. Profile       — Set display name and phone (optional)
 * 5. Ready         — Celebration + smart first-action CTA
 * =========================================================
 */

export const EMPLOYEE_ONBOARDING_STEPS = [
  'welcome',
  'mission',
  'tools',
  'profile',
  'ready',
] as const;

export type EmployeeOnboardingStep = (typeof EMPLOYEE_ONBOARDING_STEPS)[number];

export const TOTAL_EMPLOYEE_STEPS = EMPLOYEE_ONBOARDING_STEPS.length;

// =========================================================
// INDUSTRY CONTENT
// =========================================================

export type IndustryToolCard = {
  icon: string; // lucide icon name
  title: string;
  description: string;
  href: string;
  highlight?: boolean;
};

export type IndustryMissionContent = {
  headline: string;
  subtext: string;
  tagline: string;
  pillars: Array<{
    icon: string;
    title: string;
    body: string;
  }>;
};

export type IndustryContent = {
  industryLabel: string;
  roleLabel: string;
  entityLabel: string; // "client", "participant", "patient", "resident", "child"
  missionContent: IndustryMissionContent;
  tools: IndustryToolCard[];
  readyCTA: {
    primary: { label: string; href: string };
    secondary: { label: string; href: string };
  };
};

const INDUSTRY_MAP: Record<string, IndustryContent> = {
  ndis: {
    industryLabel: 'NDIS',
    roleLabel: 'Support Worker',
    entityLabel: 'participant',
    missionContent: {
      headline: 'Your work keeps participants living their best lives.',
      subtext:
        'Every visit, every note, every credential you maintain is a layer of protection — for participants and for you. FormaOS makes sure nothing falls through the cracks.',
      tagline: 'Compliance is care.',
      pillars: [
        {
          icon: 'ClipboardCheck',
          title: 'Document every service',
          body: 'Progress notes and visit records create the evidence trail the NDIS Commission expects. If it is not documented, it did not happen.',
        },
        {
          icon: 'UserCheck',
          title: 'Keep credentials current',
          body: 'Your NDIS Worker Screening Check, First Aid, and any training certificates need to stay valid. FormaOS tracks expiry dates and alerts you before they lapse.',
        },
        {
          icon: 'ShieldAlert',
          title: 'Report serious incidents',
          body: 'SIRS notifications must reach the NDIS Commission within strict timeframes. Your organisation handles this — but your notes are the source of truth.',
        },
      ],
    },
    tools: [
      {
        icon: 'NotebookPen',
        title: 'Progress Notes',
        description:
          'Record every support session. Write, review, and submit notes linked to participants.',
        href: '/app/progress-notes',
        highlight: true,
      },
      {
        icon: 'Calendar',
        title: 'My Visits',
        description:
          'View your scheduled service delivery sessions and mark them complete.',
        href: '/app/visits',
        highlight: true,
      },
      {
        icon: 'Users',
        title: 'My Participants',
        description:
          'Access participant details, care plans, and service history.',
        href: '/app/participants',
      },
      {
        icon: 'CheckSquare',
        title: 'My Tasks',
        description:
          'Stay on top of compliance tasks assigned to you by your coordinator.',
        href: '/app/tasks',
      },
      {
        icon: 'Lock',
        title: 'Evidence Vault',
        description:
          'Upload and store your credentials, certificates, and training records.',
        href: '/app/vault',
      },
    ],
    readyCTA: {
      primary: {
        label: 'Write your first progress note',
        href: '/app/progress-notes',
      },
      secondary: { label: 'View my tasks', href: '/app/tasks' },
    },
  },

  healthcare: {
    industryLabel: 'Healthcare',
    roleLabel: 'Practitioner',
    entityLabel: 'patient',
    missionContent: {
      headline: 'Safe, documented, defensible care — every time.',
      subtext:
        'Clinical compliance protects patients and protects your registration. FormaOS gives you one place to manage your credentials, clinical notes, and required documentation.',
      tagline: 'Documentation is patient safety.',
      pillars: [
        {
          icon: 'FileText',
          title: 'Clinical documentation',
          body: 'Every clinical encounter needs to be documented accurately and promptly. Your notes form the clinical record and support continuity of care.',
        },
        {
          icon: 'UserCheck',
          title: 'Practitioner credentials',
          body: 'AHPRA registration, CPD requirements, and specialist certifications all have expiry dates. FormaOS tracks them so you never practise with a lapsed credential.',
        },
        {
          icon: 'ShieldCheck',
          title: 'NSQHS compliance',
          body: "The National Safety and Quality Health Standards define minimum safe care. Your documentation and incident reporting feed directly into your organisation's NSQHS accreditation.",
        },
      ],
    },
    tools: [
      {
        icon: 'Stethoscope',
        title: 'Clinical Notes',
        description:
          'Document patient encounters, treatment plans, and clinical observations.',
        href: '/app/progress-notes',
        highlight: true,
      },
      {
        icon: 'Calendar',
        title: 'Appointments',
        description:
          'Manage your patient appointments and appointment outcomes.',
        href: '/app/visits',
        highlight: true,
      },
      {
        icon: 'HeartPulse',
        title: 'My Patients',
        description:
          'Access patient records, care plans, and clinical history.',
        href: '/app/participants',
      },
      {
        icon: 'CheckSquare',
        title: 'My Tasks',
        description:
          'Compliance tasks assigned to you — training, policy acknowledgements, reviews.',
        href: '/app/tasks',
      },
      {
        icon: 'Lock',
        title: 'Evidence Vault',
        description:
          'Store your AHPRA certificate, CPD logs, and training records securely.',
        href: '/app/vault',
      },
    ],
    readyCTA: {
      primary: { label: 'Start a clinical note', href: '/app/progress-notes' },
      secondary: { label: 'View my tasks', href: '/app/tasks' },
    },
  },

  aged_care: {
    industryLabel: 'Aged Care',
    roleLabel: 'Care Worker',
    entityLabel: 'resident',
    missionContent: {
      headline: 'Dignity, safety, and documented care.',
      subtext:
        "You are on the front line of aged care delivery. The Aged Care Quality Standards require that every resident's care is planned, delivered, and documented to a high standard. FormaOS is how your team proves it.",
      tagline: 'Quality care deserves quality records.',
      pillars: [
        {
          icon: 'NotebookPen',
          title: 'Care documentation',
          body: "Progress notes and service logs show that care plans are being followed. They are your organisation's audit evidence and a resident's continuous care record.",
        },
        {
          icon: 'UserCheck',
          title: 'Staff credentials',
          body: 'Working with Older People screening, first aid, and manual handling are all tracked here. Expired credentials are flagged before they become compliance issues.',
        },
        {
          icon: 'Star',
          title: 'Star Ratings',
          body: "The Australian Government publishes Star Ratings for aged care providers. Your documentation quality directly influences your organisation's rating.",
        },
      ],
    },
    tools: [
      {
        icon: 'NotebookPen',
        title: 'Progress Notes',
        description:
          'Document care delivery for each resident. Link notes to care plans.',
        href: '/app/progress-notes',
        highlight: true,
      },
      {
        icon: 'Calendar',
        title: 'Service Logs',
        description:
          'Log your care service sessions and confirm completion of rostered care.',
        href: '/app/visits',
        highlight: true,
      },
      {
        icon: 'Home',
        title: 'My Residents',
        description:
          'Access resident profiles, care plans, and service history.',
        href: '/app/participants',
      },
      {
        icon: 'CheckSquare',
        title: 'My Tasks',
        description:
          'Mandatory training, policy sign-offs, and care-related compliance tasks.',
        href: '/app/tasks',
      },
      {
        icon: 'Lock',
        title: 'Evidence Vault',
        description:
          'Upload credentials, certificates, and required workforce documentation.',
        href: '/app/vault',
      },
    ],
    readyCTA: {
      primary: { label: 'Write a progress note', href: '/app/progress-notes' },
      secondary: { label: 'View my tasks', href: '/app/tasks' },
    },
  },

  childcare: {
    industryLabel: 'Childcare',
    roleLabel: 'Educator',
    entityLabel: 'child',
    missionContent: {
      headline: 'Safe environments start with prepared educators.',
      subtext:
        "National Quality Framework standards set the bar for children's safety, wellbeing, and learning. Your documentation, credentials, and incident reporting are how your service demonstrates it meets those standards.",
      tagline: 'Every record protects a child.',
      pillars: [
        {
          icon: 'ClipboardCheck',
          title: 'Observation & documentation',
          body: 'NQF Area 1 requires evidence of educational programming. Your notes and observations show how the educational program is delivered and improved.',
        },
        {
          icon: 'UserCheck',
          title: 'Educator credentials',
          body: 'Working With Children Checks, First Aid, Anaphylaxis, and Asthma training must be current. FormaOS tracks expiry dates for all educators in your service.',
        },
        {
          icon: 'Shield',
          title: 'Child safety',
          body: 'NQF Area 2 is non-negotiable. Safety checks, risk assessments, and incident records show your service operates a safe physical and emotional environment.',
        },
      ],
    },
    tools: [
      {
        icon: 'NotebookPen',
        title: 'Progress Notes',
        description:
          'Document observations, learning outcomes, and program delivery.',
        href: '/app/progress-notes',
        highlight: true,
      },
      {
        icon: 'Shield',
        title: 'Safety Checks',
        description:
          'Complete and record safety checks, risk assessments, and incident reports.',
        href: '/app/registers',
        highlight: true,
      },
      {
        icon: 'Baby',
        title: 'My Children',
        description:
          'Access child enrolment records, authorisations, and learning documentation.',
        href: '/app/participants',
      },
      {
        icon: 'CheckSquare',
        title: 'My Tasks',
        description:
          'Compliance tasks — training completions, policy acknowledgements, assessments.',
        href: '/app/tasks',
      },
      {
        icon: 'Lock',
        title: 'Evidence Vault',
        description:
          'Store your WWCC, first aid, and all required educator certifications.',
        href: '/app/vault',
      },
    ],
    readyCTA: {
      primary: {
        label: 'Write an observation note',
        href: '/app/progress-notes',
      },
      secondary: { label: 'View my tasks', href: '/app/tasks' },
    },
  },

  community_services: {
    industryLabel: 'Community Services',
    roleLabel: 'Support Worker',
    entityLabel: 'client',
    missionContent: {
      headline: 'Consistent, documented support for every client.',
      subtext:
        'Community services compliance means showing up — in person and on paper. Your service notes, credentials, and task completions demonstrate that your organisation delivers to the standard it promises.',
      tagline: 'Documentation closes the loop.',
      pillars: [
        {
          icon: 'NotebookPen',
          title: 'Service delivery notes',
          body: 'Every service session should be documented. Notes tie back to care plans, funding agreements, and outcome measurements.',
        },
        {
          icon: 'UserCheck',
          title: 'Worker credentials',
          body: 'Police checks, WWCC, first aid, and role-specific training all have expiry dates. FormaOS keeps you notified before anything lapses.',
        },
        {
          icon: 'ClipboardCheck',
          title: 'Task completion',
          body: 'Your coordinator assigns compliance tasks — training, policy sign-offs, assessments. Completing them on time is part of your role.',
        },
      ],
    },
    tools: [
      {
        icon: 'NotebookPen',
        title: 'Progress Notes',
        description:
          'Document your support sessions and link notes to client records.',
        href: '/app/progress-notes',
        highlight: true,
      },
      {
        icon: 'Calendar',
        title: 'My Sessions',
        description:
          'View your service delivery schedule and log session completion.',
        href: '/app/visits',
        highlight: true,
      },
      {
        icon: 'Users',
        title: 'My Clients',
        description:
          'Access client profiles, support plans, and service history.',
        href: '/app/participants',
      },
      {
        icon: 'CheckSquare',
        title: 'My Tasks',
        description:
          'Training completions, policy acknowledgements, and assigned compliance work.',
        href: '/app/tasks',
      },
      {
        icon: 'Lock',
        title: 'Evidence Vault',
        description:
          'Store your credentials and certifications for credential verification.',
        href: '/app/vault',
      },
    ],
    readyCTA: {
      primary: { label: 'Write a progress note', href: '/app/progress-notes' },
      secondary: { label: 'View my tasks', href: '/app/tasks' },
    },
  },

  financial_services: {
    industryLabel: 'Financial Services',
    roleLabel: 'Team Member',
    entityLabel: 'client',
    missionContent: {
      headline: 'Regulated work needs documented decisions.',
      subtext:
        'In financial services, compliance is not optional and regulators expect evidence. FormaOS gives you a clear view of the tasks, policies, and evidence requirements that apply to your role.',
      tagline: 'If it is not documented, it did not happen.',
      pillars: [
        {
          icon: 'CheckSquare',
          title: 'Assigned compliance tasks',
          body: 'Your manager will assign compliance tasks to your account — policy reviews, training completions, risk assessments. These have deadlines and must be completed and evidenced.',
        },
        {
          icon: 'FileText',
          title: 'Policy acknowledgements',
          body: 'Regulatory policies must be formally acknowledged. When a policy is updated, you will receive a task to review and sign off on the new version.',
        },
        {
          icon: 'Lock',
          title: 'Evidence submission',
          body: 'Regulators require evidence that controls are operating. When you complete training or a review, upload the evidence to the vault so auditors can verify it.',
        },
      ],
    },
    tools: [
      {
        icon: 'CheckSquare',
        title: 'My Tasks',
        description:
          'Compliance tasks assigned by your compliance team — with due dates and priorities.',
        href: '/app/tasks',
        highlight: true,
      },
      {
        icon: 'FileText',
        title: 'Policies',
        description:
          'Read and acknowledge the policies that apply to your role.',
        href: '/app/policies',
        highlight: true,
      },
      {
        icon: 'Lock',
        title: 'Evidence Vault',
        description:
          'Upload evidence of training completions, attestations, and reviews.',
        href: '/app/vault',
      },
      {
        icon: 'FormInput',
        title: 'Forms',
        description:
          'Complete compliance forms — risk self-assessments, disclosures, attestations.',
        href: '/app/forms',
      },
      {
        icon: 'AlertTriangle',
        title: 'Incident Reports',
        description:
          'Report compliance incidents, near-misses, or breaches quickly.',
        href: '/app/incidents',
      },
    ],
    readyCTA: {
      primary: { label: 'View my compliance tasks', href: '/app/tasks' },
      secondary: { label: 'Read my policies', href: '/app/policies' },
    },
  },

  saas_technology: {
    industryLabel: 'Technology',
    roleLabel: 'Team Member',
    entityLabel: 'user',
    missionContent: {
      headline: "Security and compliance is everyone's job.",
      subtext:
        "From SOC 2 to ISO 27001, your organisation's security posture depends on every team member following policies and completing assigned control tasks. FormaOS makes your role in that clear.",
      tagline: 'Controls only work if everyone plays their part.',
      pillars: [
        {
          icon: 'ShieldCheck',
          title: 'Security controls',
          body: 'Access reviews, security training, and policy acknowledgements are assigned to individuals. Your completion status feeds directly into audit evidence.',
        },
        {
          icon: 'FileText',
          title: 'Policy compliance',
          body: 'Security policies — acceptable use, data handling, incident response — must be reviewed and acknowledged. FormaOS notifies you when policies are updated.',
        },
        {
          icon: 'Lock',
          title: 'Evidence collection',
          body: 'Auditors need evidence that controls are operating. Upload screenshots, completion certificates, and attestations to the Evidence Vault.',
        },
      ],
    },
    tools: [
      {
        icon: 'CheckSquare',
        title: 'My Tasks',
        description:
          'Security and compliance tasks assigned to you — access reviews, training, attestations.',
        href: '/app/tasks',
        highlight: true,
      },
      {
        icon: 'FileText',
        title: 'Policies',
        description:
          'Read and acknowledge security and compliance policies for your role.',
        href: '/app/policies',
        highlight: true,
      },
      {
        icon: 'Lock',
        title: 'Evidence Vault',
        description:
          'Upload evidence of training completions, certifications, and control testing.',
        href: '/app/vault',
      },
      {
        icon: 'FormInput',
        title: 'Forms',
        description:
          'Complete security questionnaires, risk self-assessments, and attestations.',
        href: '/app/forms',
      },
      {
        icon: 'AlertTriangle',
        title: 'Incident Reports',
        description:
          'Report security incidents, near-misses, or suspicious activity.',
        href: '/app/incidents',
      },
    ],
    readyCTA: {
      primary: { label: 'View my tasks', href: '/app/tasks' },
      secondary: { label: 'Read my policies', href: '/app/policies' },
    },
  },
};

// Default content for industries without specific content
const DEFAULT_INDUSTRY_CONTENT: IndustryContent = {
  industryLabel: 'Organisation',
  roleLabel: 'Team Member',
  entityLabel: 'client',
  missionContent: {
    headline: 'Compliance works when everyone is part of it.',
    subtext:
      "Your assigned tasks, policy acknowledgements, and documentation are the building blocks of your organisation's compliance programme. FormaOS gives you a clear view of what you need to do and when.",
    tagline: 'Your contribution matters.',
    pillars: [
      {
        icon: 'CheckSquare',
        title: 'Complete assigned tasks',
        body: 'Your compliance manager will assign tasks to your account. These have deadlines and completion is tracked for audit purposes.',
      },
      {
        icon: 'FileText',
        title: 'Acknowledge policies',
        body: 'When policies are updated, you will receive a notification to read and formally acknowledge the new version.',
      },
      {
        icon: 'Lock',
        title: 'Upload evidence',
        body: 'Training certificates, attestations, and other evidence documents should be uploaded to the Evidence Vault for audit readiness.',
      },
    ],
  },
  tools: [
    {
      icon: 'CheckSquare',
      title: 'My Tasks',
      description:
        'Compliance tasks assigned to you — with due dates, priorities, and instructions.',
      href: '/app/tasks',
      highlight: true,
    },
    {
      icon: 'Lock',
      title: 'Evidence Vault',
      description:
        'Upload and manage your compliance evidence, certificates, and documents.',
      href: '/app/vault',
      highlight: true,
    },
    {
      icon: 'FileText',
      title: 'Policies',
      description: 'Read and acknowledge the policies that apply to your role.',
      href: '/app/policies',
    },
    {
      icon: 'FormInput',
      title: 'Forms',
      description:
        'Complete compliance forms and self-assessments assigned by your team.',
      href: '/app/forms',
    },
    {
      icon: 'AlertTriangle',
      title: 'Incidents',
      description:
        'Report compliance incidents or near-misses quickly and accurately.',
      href: '/app/incidents',
    },
  ],
  readyCTA: {
    primary: { label: 'View my tasks', href: '/app/tasks' },
    secondary: { label: 'Go to dashboard', href: '/app' },
  },
};

export function getIndustryContent(
  industry: string | null | undefined,
): IndustryContent {
  if (!industry) return DEFAULT_INDUSTRY_CONTENT;
  return INDUSTRY_MAP[industry] ?? DEFAULT_INDUSTRY_CONTENT;
}

// =========================================================
// STEP HELPERS
// =========================================================

export function getStepIndex(step: EmployeeOnboardingStep): number {
  return EMPLOYEE_ONBOARDING_STEPS.indexOf(step);
}

export function getNextStep(
  step: EmployeeOnboardingStep,
): EmployeeOnboardingStep | null {
  const idx = getStepIndex(step);
  if (idx === -1 || idx >= EMPLOYEE_ONBOARDING_STEPS.length - 1) return null;
  return EMPLOYEE_ONBOARDING_STEPS[idx + 1];
}

export function getPrevStep(
  step: EmployeeOnboardingStep,
): EmployeeOnboardingStep | null {
  const idx = getStepIndex(step);
  if (idx <= 0) return null;
  return EMPLOYEE_ONBOARDING_STEPS[idx - 1];
}

export function stepToQueryParam(step: EmployeeOnboardingStep): string {
  return String(getStepIndex(step) + 1);
}

export function queryParamToStep(
  param: string | null | undefined,
): EmployeeOnboardingStep {
  const num = Number.parseInt(param ?? '1', 10);
  const idx = Number.isNaN(num)
    ? 0
    : Math.max(0, Math.min(num - 1, TOTAL_EMPLOYEE_STEPS - 1));
  return EMPLOYEE_ONBOARDING_STEPS[idx];
}
