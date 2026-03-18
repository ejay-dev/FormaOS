/**
 * =========================================================
 * ENTERPRISE INDUSTRY ROADMAPS
 * =========================================================
 * Comprehensive onboarding roadmaps tailored to each industry
 * Drives dashboard guidance, checklist generation, and activation flow
 */

export type RoadmapPhase = {
  id: string;
  title: string;
  description: string;
  estimatedDays: number;
  steps: RoadmapStep[];
};

export type RoadmapStep = {
  id: string;
  title: string;
  description: string;
  cta: string;
  ctaHref: string;
  icon: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: 'setup' | 'compliance' | 'operational' | 'readiness';
  automationTrigger?: string;
  estimatedMinutes: number;
};

export type IndustryRoadmap = {
  industryId: string;
  industryName: string;
  icon: string;
  tagline: string;
  phases: RoadmapPhase[];
  keyFrameworks: string[];
  estimatedTimeToOperational: string;
};

/**
 * NDIS / DISABILITY SERVICES ROADMAP
 */
const NDIS_ROADMAP: IndustryRoadmap = {
  industryId: 'ndis',
  industryName: 'NDIS & Disability Services',
  icon: 'Activity',
  tagline: 'NDIS-ready compliance workflows and evidence',
  estimatedTimeToOperational: '7-14 days',
  keyFrameworks: ['Policy pack', 'Evidence vault', 'Automation workflows'],
  phases: [
    {
      id: 'org-setup',
      title: 'Organization Setup',
      description: 'Configure your NDIS provider structure and team',
      estimatedDays: 2,
      steps: [
        {
          id: 'provider-details',
          title: 'Complete Provider Registration Details',
          description:
            'Confirm your organization profile, service scope, and compliance contacts',
          cta: 'Update Organization Profile',
          ctaHref: '/app/settings',
          icon: 'Building2',
          priority: 'critical',
          category: 'setup',
          estimatedMinutes: 15,
        },
        {
          id: 'staff-setup',
          title: 'Add Staff & Service Delivery Team',
          description:
            'Create staff profiles, assign roles, track NDIS worker screening checks',
          cta: 'Manage Team Members',
          ctaHref: '/app/team',
          icon: 'Users',
          priority: 'critical',
          category: 'setup',
          estimatedMinutes: 30,
        },
        {
          id: 'participant-onboarding',
          title: 'Set Up Participant Records System',
          description:
            'Configure participant management, service agreements, and support plans',
          cta: 'Configure Participants',
          ctaHref: '/app/patients',
          icon: 'HeartHandshake',
          priority: 'high',
          category: 'setup',
          estimatedMinutes: 20,
        },
        {
          id: 'location-setup',
          title: 'Register Service Locations or Assets',
          description:
            'Capture service delivery sites or critical assets in registers',
          cta: 'Add to Registers',
          ctaHref: '/app/registers',
          icon: 'MapPin',
          priority: 'high',
          category: 'setup',
          estimatedMinutes: 10,
        },
      ],
    },
    {
      id: 'compliance-setup',
      title: 'Compliance Framework Activation',
      description: 'Enable baseline frameworks and industry policy templates',
      estimatedDays: 3,
      steps: [
        {
          id: 'framework-provision',
          title: 'Activate Baseline Compliance Frameworks',
          description:
            'Enable ISO 27001 / SOC 2 packs and align them to your NDIS operations',
          cta: 'Enable Frameworks',
          ctaHref: '/app/compliance/frameworks',
          icon: 'Shield',
          priority: 'critical',
          category: 'compliance',
          automationTrigger: 'framework_activated',
          estimatedMinutes: 5,
        },
        {
          id: 'credential-register',
          title: 'Set Up Worker Screening Register',
          description:
            'Track NDIS worker screening clearances, WWCC, and qualifications',
          cta: 'Configure Credential Register',
          ctaHref: '/app/registers',
          icon: 'FileCheck',
          priority: 'critical',
          category: 'compliance',
          estimatedMinutes: 20,
        },
        {
          id: 'incident-system',
          title: 'Set Up Incident Response Tasks',
          description:
            'Define incident response tasks, escalation owners, and review cadence',
          cta: 'Create Incident Tasks',
          ctaHref: '/app/tasks',
          icon: 'AlertTriangle',
          priority: 'critical',
          category: 'compliance',
          automationTrigger: 'incident_register_activated',
          estimatedMinutes: 15,
        },
        {
          id: 'policy-library',
          title: 'Review Pre-loaded NDIS Policies',
          description:
            'Review and approve Incident Management, Code of Conduct, Complaints Management policies',
          cta: 'Review Policy Library',
          ctaHref: '/app/policies',
          icon: 'FileText',
          priority: 'high',
          category: 'compliance',
          estimatedMinutes: 45,
        },
      ],
    },
    {
      id: 'operational',
      title: 'Operational Workflows',
      description: 'Deploy day-to-day compliance workflows',
      estimatedDays: 5,
      steps: [
        {
          id: 'incident-logging',
          title: 'Run a Test Incident Workflow',
          description:
            'Create a test incident task to validate your response workflow',
          cta: 'Create Incident Task',
          ctaHref: '/app/tasks',
          icon: 'FileWarning',
          priority: 'high',
          category: 'operational',
          automationTrigger: 'incident_created',
          estimatedMinutes: 10,
        },
        {
          id: 'evidence-capture',
          title: 'Upload First Compliance Evidence',
          description:
            'Store worker screening, insurance certificates, or training records',
          cta: 'Upload Evidence',
          ctaHref: '/app/vault',
          icon: 'Upload',
          priority: 'high',
          category: 'operational',
          automationTrigger: 'evidence_uploaded',
          estimatedMinutes: 10,
        },
        {
          id: 'staff-credential-tracking',
          title: 'Track Staff Credential Expiry',
          description:
            'Enable automation for expiring NDIS worker screening and qualification renewals',
          cta: 'Configure Credential Tracking',
          ctaHref: '/app/workflows',
          icon: 'Clock',
          priority: 'high',
          category: 'operational',
          automationTrigger: 'credential_expiry_enabled',
          estimatedMinutes: 15,
        },
        {
          id: 'participant-workflows',
          title: 'Implement Participant Record Workflows',
          description:
            'Configure service agreement tracking, plan review cycles, and consent management',
          cta: 'Set Up Participant Workflows',
          ctaHref: '/app/workflows',
          icon: 'Workflow',
          priority: 'medium',
          category: 'operational',
          estimatedMinutes: 30,
        },
      ],
    },
    {
      id: 'audit-readiness',
      title: 'Audit Readiness',
      description: 'Prepare for NDIS Commission audits and reviews',
      estimatedDays: 3,
      steps: [
        {
          id: 'compliance-scoring',
          title: 'Review Compliance Overview',
          description:
            'Track compliance progress and open gaps from the dashboard',
          cta: 'View Dashboard',
          ctaHref: '/app',
          icon: 'TrendingUp',
          priority: 'high',
          category: 'readiness',
          estimatedMinutes: 10,
        },
        {
          id: 'evidence-vault',
          title: 'Verify Evidence Vault Coverage',
          description:
            'Ensure all critical controls have supporting evidence uploaded and approved',
          cta: 'Audit Evidence Vault',
          ctaHref: '/app/vault',
          icon: 'Archive',
          priority: 'high',
          category: 'readiness',
          estimatedMinutes: 20,
        },
        {
          id: 'audit-export',
          title: 'Generate Audit Evidence Pack',
          description: 'Export evidence bundles for internal review or auditors',
          cta: 'Generate Export',
          ctaHref: '/app/reports',
          icon: 'Download',
          priority: 'critical',
          category: 'readiness',
          estimatedMinutes: 5,
        },
        {
          id: 'auditor-sharing',
          title: 'Prepare Auditor-Ready Exports',
          description: 'Package evidence for external auditor review',
          cta: 'Open Reports',
          ctaHref: '/app/reports',
          icon: 'Share2',
          priority: 'medium',
          category: 'readiness',
          estimatedMinutes: 5,
        },
      ],
    },
  ],
};

/**
 * HEALTHCARE / MEDICAL PRACTICE ROADMAP
 */
const HEALTHCARE_ROADMAP: IndustryRoadmap = {
  industryId: 'healthcare',
  industryName: 'Healthcare & Allied Health',
  icon: 'Heart',
  tagline: 'Clinical governance and audit-ready operations',
  estimatedTimeToOperational: '5-10 days',
  keyFrameworks: ['ISO 27001', 'HIPAA-style controls', 'Clinical policy pack'],
  phases: [
    {
      id: 'practice-setup',
      title: 'Practice Setup',
      description: 'Configure practice details and clinical team',
      estimatedDays: 1,
      steps: [
        {
          id: 'practice-details',
          title: 'Complete Practice Registration Details',
          description:
            'Confirm practice profile, accreditation contacts, and service scope',
          cta: 'Update Practice Profile',
          ctaHref: '/app/settings',
          icon: 'Building2',
          priority: 'critical',
          category: 'setup',
          estimatedMinutes: 15,
        },
        {
          id: 'clinician-setup',
          title: 'Add Clinicians & Administrative Staff',
          description:
            'Create staff profiles, track AHPRA registrations, professional indemnity insurance',
          cta: 'Manage Clinical Team',
          ctaHref: '/app/team',
          icon: 'Users',
          priority: 'critical',
          category: 'setup',
          estimatedMinutes: 30,
        },
        {
          id: 'location-setup',
          title: 'Register Practice Sites or Assets',
          description:
            'Capture clinics or critical assets used for service delivery',
          cta: 'Add to Registers',
          ctaHref: '/app/registers',
          icon: 'MapPin',
          priority: 'high',
          category: 'setup',
          estimatedMinutes: 10,
        },
      ],
    },
    {
      id: 'clinical-governance',
      title: 'Clinical Governance Setup',
      description: 'Activate baseline frameworks and policies',
      estimatedDays: 2,
      steps: [
        {
          id: 'racgp-framework',
          title: 'Activate Baseline Compliance Frameworks',
          description:
            'Enable ISO 27001 / HIPAA-style controls aligned to clinical workflows',
          cta: 'Enable Frameworks',
          ctaHref: '/app/compliance/frameworks',
          icon: 'Shield',
          priority: 'critical',
          category: 'compliance',
          automationTrigger: 'framework_activated',
          estimatedMinutes: 5,
        },
        {
          id: 'ahpra-tracking',
          title: 'Set Up AHPRA Registration Tracking',
          description:
            'Monitor practitioner registration renewals, conditions, and endorsements',
          cta: 'Configure AHPRA Register',
          ctaHref: '/app/registers',
          icon: 'FileCheck',
          priority: 'critical',
          category: 'compliance',
          estimatedMinutes: 20,
        },
        {
          id: 'incident-system',
          title: 'Set Up Clinical Incident Tasks',
          description:
            'Create incident response tasks, escalation owners, and review cadence',
          cta: 'Create Incident Tasks',
          ctaHref: '/app/tasks',
          icon: 'AlertTriangle',
          priority: 'critical',
          category: 'compliance',
          automationTrigger: 'incident_register_activated',
          estimatedMinutes: 15,
        },
        {
          id: 'policy-library',
          title: 'Review Pre-loaded Clinical Policies',
          description:
            'Review Patient Privacy, Infection Control, and Data Breach Response policies',
          cta: 'Review Policy Library',
          ctaHref: '/app/policies',
          icon: 'FileText',
          priority: 'high',
          category: 'compliance',
          estimatedMinutes: 45,
        },
      ],
    },
    {
      id: 'operational',
      title: 'Operational Workflows',
      description: 'Deploy clinical and administrative workflows',
      estimatedDays: 4,
      steps: [
        {
          id: 'credential-tracking',
          title: 'Enable Credential Expiry Automation',
          description:
            'Auto-alert for expiring AHPRA registrations, CPD requirements, and insurance',
          cta: 'Configure Credential Automation',
          ctaHref: '/app/workflows',
          icon: 'Clock',
          priority: 'high',
          category: 'operational',
          automationTrigger: 'credential_expiry_enabled',
          estimatedMinutes: 15,
        },
        {
          id: 'evidence-capture',
          title: 'Upload First Compliance Evidence',
          description:
            'Store insurance certificates, infection control audits, or training records',
          cta: 'Upload Evidence',
          ctaHref: '/app/vault',
          icon: 'Upload',
          priority: 'high',
          category: 'operational',
          automationTrigger: 'evidence_uploaded',
          estimatedMinutes: 10,
        },
        {
          id: 'quality-improvement',
          title: 'Set Up Quality Improvement Cycles',
          description:
            'Configure clinical audit schedules, patient feedback systems, and review processes',
          cta: 'Configure QI Workflows',
          ctaHref: '/app/workflows',
          icon: 'TrendingUp',
          priority: 'medium',
          category: 'operational',
          estimatedMinutes: 30,
        },
      ],
    },
    {
      id: 'accreditation-readiness',
      title: 'Accreditation Readiness',
      description: 'Prepare for accreditation assessment',
      estimatedDays: 3,
      steps: [
        {
          id: 'compliance-dashboard',
          title: 'Review Compliance Overview',
          description: 'Track compliance progress and open gaps from the dashboard',
          cta: 'View Dashboard',
          ctaHref: '/app',
          icon: 'BarChart',
          priority: 'high',
          category: 'readiness',
          estimatedMinutes: 10,
        },
        {
          id: 'evidence-audit',
          title: 'Verify Evidence Coverage',
          description: 'Ensure critical criteria have supporting evidence',
          cta: 'Audit Evidence Vault',
          ctaHref: '/app/vault',
          icon: 'Archive',
          priority: 'high',
          category: 'readiness',
          estimatedMinutes: 20,
        },
        {
          id: 'accreditation-export',
          title: 'Generate Audit Evidence Pack',
          description: 'Export evidence bundles for internal review or auditors',
          cta: 'Generate Export',
          ctaHref: '/app/reports',
          icon: 'Download',
          priority: 'critical',
          category: 'readiness',
          estimatedMinutes: 5,
        },
      ],
    },
  ],
};

/**
 * FINANCIAL SERVICES ROADMAP
 */
const FINANCIAL_ROADMAP: IndustryRoadmap = {
  industryId: 'financial_services',
  industryName: 'Financial Services',
  icon: 'DollarSign',
  tagline: 'SOC 2, ISO 27001, and financial compliance excellence',
  estimatedTimeToOperational: '14-21 days',
  keyFrameworks: ['ISO 27001', 'SOC 2', 'PCI DSS'],
  phases: [
    {
      id: 'governance-setup',
      title: 'Governance Setup',
      description: 'Establish risk and governance foundations',
      estimatedDays: 5,
      steps: [
        {
          id: 'risk-registers',
          title: 'Create Enterprise Risk Register',
          description:
            'Document operational, financial, cyber, and regulatory risks',
          cta: 'Configure Risk Register',
          ctaHref: '/app/registers',
          icon: 'AlertCircle',
          priority: 'critical',
          category: 'setup',
          estimatedMinutes: 60,
        },
        {
          id: 'vendor-risk',
          title: 'Set Up Third-Party Vendor Risk Register',
          description:
            'Track vendor assessments, contracts, and security posture',
          cta: 'Configure Vendor Register',
          ctaHref: '/app/registers',
          icon: 'Briefcase',
          priority: 'high',
          category: 'setup',
          estimatedMinutes: 45,
        },
        {
          id: 'policy-lifecycle',
          title: 'Activate Policy Lifecycle Management',
          description:
            'Configure review cycles, approval workflows, version control',
          cta: 'Set Up Policy Management',
          ctaHref: '/app/policies',
          icon: 'FileText',
          priority: 'high',
          category: 'setup',
          estimatedMinutes: 30,
        },
      ],
    },
    {
      id: 'security-controls',
      title: 'Security Control Activation',
      description: 'Deploy ISO 27001 and SOC 2 frameworks',
      estimatedDays: 7,
      steps: [
        {
          id: 'iso27001-framework',
          title: 'Activate ISO 27001 Framework',
          description: 'Provision ISO 27001 controls across core security domains',
          cta: 'Activate ISO 27001',
          ctaHref: '/app/compliance/frameworks',
          icon: 'Shield',
          priority: 'critical',
          category: 'compliance',
          automationTrigger: 'framework_activated',
          estimatedMinutes: 5,
        },
        {
          id: 'soc2-framework',
          title: 'Activate SOC 2 Type II Framework',
          description:
            'Enable Trust Service Criteria across security and availability domains',
          cta: 'Activate SOC 2',
          ctaHref: '/app/compliance/frameworks',
          icon: 'ShieldCheck',
          priority: 'critical',
          category: 'compliance',
          automationTrigger: 'framework_activated',
          estimatedMinutes: 5,
        },
        {
          id: 'evidence-capture',
          title: 'Configure Evidence Collection Automation',
          description:
            'Auto-capture logs, change records, access reviews, security scans',
          cta: 'Configure Evidence Automation',
          ctaHref: '/app/workflows',
          icon: 'Zap',
          priority: 'high',
          category: 'compliance',
          automationTrigger: 'evidence_automation_enabled',
          estimatedMinutes: 45,
        },
      ],
    },
    {
      id: 'monitoring',
      title: 'Automation & Monitoring',
      description: 'Enable continuous compliance intelligence',
      estimatedDays: 5,
      steps: [
        {
          id: 'evidence-expiry',
          title: 'Enable Evidence Expiry Tracking',
          description:
            'Auto-alert when evidence > 90 days old, trigger renewal tasks',
          cta: 'Configure Expiry Automation',
          ctaHref: '/app/workflows',
          icon: 'Clock',
          priority: 'high',
          category: 'operational',
          automationTrigger: 'evidence_expiry_enabled',
          estimatedMinutes: 15,
        },
        {
          id: 'control-monitoring',
          title: 'Activate Control Failure Alerts',
          description:
            'Escalate non-compliant controls, auto-create remediation tasks',
          cta: 'Configure Control Monitoring',
          ctaHref: '/app/workflows',
          icon: 'AlertTriangle',
          priority: 'critical',
          category: 'operational',
          automationTrigger: 'control_failure_enabled',
          estimatedMinutes: 20,
        },
        {
          id: 'compliance-intelligence',
          title: 'Review Compliance Activity',
          description:
            'Monitor audit activity, remediation tasks, and control changes',
          cta: 'Open Audit Log',
          ctaHref: '/app/audit',
          icon: 'BarChart',
          priority: 'medium',
          category: 'operational',
          estimatedMinutes: 10,
        },
      ],
    },
    {
      id: 'certification-readiness',
      title: 'Certification Readiness',
      description: 'Prepare for external audits and certifications',
      estimatedDays: 4,
      steps: [
        {
          id: 'compliance-dashboard',
          title: 'Review Compliance Overview',
          description:
            'Track compliance progress and open gaps from the dashboard',
          cta: 'View Dashboard',
          ctaHref: '/app',
          icon: 'TrendingUp',
          priority: 'high',
          category: 'readiness',
          estimatedMinutes: 15,
        },
        {
          id: 'audit-export',
          title: 'Generate Audit Evidence Pack',
          description: 'Export evidence bundles for internal review or auditors',
          cta: 'Generate Export',
          ctaHref: '/app/reports',
          icon: 'Download',
          priority: 'critical',
          category: 'readiness',
          estimatedMinutes: 5,
        },
        {
          id: 'auditor-portal',
          title: 'Prepare Auditor-Ready Exports',
          description: 'Package evidence for external auditor review',
          cta: 'Open Reports',
          ctaHref: '/app/reports',
          icon: 'Share2',
          priority: 'high',
          category: 'readiness',
          estimatedMinutes: 10,
        },
      ],
    },
  ],
};

/**
 * SAAS / TECHNOLOGY ROADMAP
 */
const SAAS_ROADMAP: IndustryRoadmap = {
  industryId: 'saas_technology',
  industryName: 'SaaS & Technology',
  icon: 'Code',
  tagline: 'Security-first compliance for modern tech companies',
  estimatedTimeToOperational: '10-14 days',
  keyFrameworks: ['SOC 2', 'ISO 27001', 'GDPR'],
  phases: [
    {
      id: 'security-foundation',
      title: 'Security Foundation',
      description: 'Establish core security controls',
      estimatedDays: 3,
      steps: [
        {
          id: 'soc2-activation',
          title: 'Activate SOC 2 Framework',
          description:
            'Enable Trust Service Criteria for security, availability, confidentiality',
          cta: 'Activate SOC 2',
          ctaHref: '/app/compliance/frameworks',
          icon: 'Shield',
          priority: 'critical',
          category: 'setup',
          automationTrigger: 'framework_activated',
          estimatedMinutes: 5,
        },
        {
          id: 'iso27001-activation',
          title: 'Activate ISO 27001 Framework',
          description:
            'Provision information security management system controls',
          cta: 'Activate ISO 27001',
          ctaHref: '/app/compliance/frameworks',
          icon: 'ShieldCheck',
          priority: 'critical',
          category: 'setup',
          automationTrigger: 'framework_activated',
          estimatedMinutes: 5,
        },
        {
          id: 'devops-workflows',
          title: 'Configure DevOps Security Workflows',
          description:
            'Track change management, deployment gates, access controls',
          cta: 'Set Up DevOps Compliance',
          ctaHref: '/app/workflows',
          icon: 'GitBranch',
          priority: 'high',
          category: 'setup',
          estimatedMinutes: 45,
        },
      ],
    },
    {
      id: 'evidence-automation',
      title: 'Evidence Automation',
      description: 'Auto-capture compliance evidence',
      estimatedDays: 4,
      steps: [
        {
          id: 'change-management',
          title: 'Enable Change Management Logging',
          description:
            'Auto-capture deployment logs, change approvals, rollback events',
          cta: 'Configure Change Logging',
          ctaHref: '/app/workflows',
          icon: 'FileText',
          priority: 'high',
          category: 'operational',
          automationTrigger: 'change_logging_enabled',
          estimatedMinutes: 30,
        },
        {
          id: 'access-control',
          title: 'Automate Access Control Reviews',
          description:
            'Quarterly access audits, privilege escalation tracking, offboarding verification',
          cta: 'Configure Access Reviews',
          ctaHref: '/app/workflows',
          icon: 'Users',
          priority: 'high',
          category: 'operational',
          automationTrigger: 'access_review_enabled',
          estimatedMinutes: 45,
        },
        {
          id: 'vendor-security',
          title: 'Track Vendor Security Assessments',
          description:
            'Auto-request vendor security questionnaires, SOC 2 reports, penetration tests',
          cta: 'Configure Vendor Tracking',
          ctaHref: '/app/registers',
          icon: 'Briefcase',
          priority: 'medium',
          category: 'operational',
          estimatedMinutes: 30,
        },
      ],
    },
    {
      id: 'customer-trust',
      title: 'Customer Trust Enablement',
      description: 'Build customer-facing trust infrastructure',
      estimatedDays: 4,
      steps: [
        {
          id: 'trust-reporting',
          title: 'Generate Customer Trust Reports',
          description:
            'Create compliance summaries for customer security reviews',
          cta: 'Open Reports',
          ctaHref: '/app/reports',
          icon: 'FileCheck',
          priority: 'high',
          category: 'readiness',
          estimatedMinutes: 20,
        },
        {
          id: 'compliance-dashboards',
          title: 'Review Compliance Dashboards',
          description:
            'Track compliance progress and open gaps from the dashboard',
          cta: 'View Dashboard',
          ctaHref: '/app',
          icon: 'BarChart',
          priority: 'medium',
          category: 'readiness',
          estimatedMinutes: 30,
        },
        {
          id: 'security-posture',
          title: 'Generate Security Posture Summary',
          description:
            'Executive summary of frameworks and control coverage',
          cta: 'Open Reports',
          ctaHref: '/app/reports',
          icon: 'Award',
          priority: 'high',
          category: 'readiness',
          estimatedMinutes: 10,
        },
      ],
    },
    {
      id: 'certification',
      title: 'SOC 2 Certification',
      description: 'Prepare for Type II audit',
      estimatedDays: 3,
      steps: [
        {
          id: 'audit-readiness',
          title: 'Review SOC 2 Control Coverage',
          description:
            'Validate SOC 2 coverage and track gaps in the framework library',
          cta: 'View Frameworks',
          ctaHref: '/app/compliance/frameworks',
          icon: 'CheckCircle',
          priority: 'critical',
          category: 'readiness',
          estimatedMinutes: 5,
        },
        {
          id: 'audit-export',
          title: 'Generate Audit Evidence Pack',
          description: 'Export evidence bundles for internal review or auditors',
          cta: 'Generate Export',
          ctaHref: '/app/reports',
          icon: 'Download',
          priority: 'critical',
          category: 'readiness',
          estimatedMinutes: 5,
        },
        {
          id: 'auditor-portal',
          title: 'Prepare Auditor-Ready Exports',
          description:
            'Package evidence for external auditor review',
          cta: 'Open Reports',
          ctaHref: '/app/reports',
          icon: 'Share2',
          priority: 'high',
          category: 'readiness',
          estimatedMinutes: 10,
        },
      ],
    },
  ],
};

/**
 * ENTERPRISE / MULTI-SITE ROADMAP
 */
const ENTERPRISE_ROADMAP: IndustryRoadmap = {
  industryId: 'enterprise',
  industryName: 'Enterprise Multi-Site',
  icon: 'Building',
  tagline: 'Enterprise governance and scalable compliance operations',
  estimatedTimeToOperational: '21-30 days',
  keyFrameworks: ['Framework library', 'Policy governance', 'Audit exports'],
  phases: [
    {
      id: 'hierarchy-setup',
      title: 'Organization Hierarchy',
      description: 'Structure enterprise governance and accountability',
      estimatedDays: 7,
      steps: [
        {
          id: 'department-creation',
          title: 'Assign Departments & Owners',
          description:
            'Capture departments and accountability in team profiles',
          cta: 'Manage People',
          ctaHref: '/app/people',
          icon: 'Building2',
          priority: 'critical',
          category: 'setup',
          estimatedMinutes: 60,
        },
        {
          id: 'multi-site-governance',
          title: 'Confirm Organization Governance',
          description:
            'Review org settings, compliance contacts, and governance details',
          cta: 'Review Settings',
          ctaHref: '/app/settings',
          icon: 'Network',
          priority: 'critical',
          category: 'setup',
          estimatedMinutes: 90,
        },
        {
          id: 'business-unit-linking',
          title: 'Invite Cross-Functional Teams',
          description: 'Bring business units into a shared compliance workspace',
          cta: 'Invite Teams',
          ctaHref: '/app/team',
          icon: 'Link',
          priority: 'high',
          category: 'setup',
          estimatedMinutes: 45,
        },
      ],
    },
    {
      id: 'cross-framework',
      title: 'Cross-Framework Compliance',
      description: 'Activate frameworks and compare coverage',
      estimatedDays: 7,
      steps: [
        {
          id: 'shared-controls',
          title: 'Activate Framework Library',
          description:
            'Enable core frameworks and review mapped controls',
          cta: 'View Frameworks',
          ctaHref: '/app/compliance/frameworks',
          icon: 'Layers',
          priority: 'critical',
          category: 'compliance',
          estimatedMinutes: 120,
        },
        {
          id: 'control-deduplication',
          title: 'Review Control Overlap',
          description:
            'Identify overlapping controls and reduce duplicate evidence',
          cta: 'Review Mappings',
          ctaHref: '/app/compliance/frameworks',
          icon: 'Combine',
          priority: 'high',
          category: 'compliance',
          automationTrigger: 'deduplication_enabled',
          estimatedMinutes: 30,
        },
        {
          id: 'multi-site-dashboards',
          title: 'Review Compliance Overview',
          description:
            'Track compliance progress and open gaps from the dashboard',
          cta: 'View Dashboard',
          ctaHref: '/app',
          icon: 'LayoutDashboard',
          priority: 'high',
          category: 'compliance',
          estimatedMinutes: 45,
        },
      ],
    },
    {
      id: 'executive-governance',
      title: 'Executive Governance',
      description: 'Executive visibility into compliance posture',
      estimatedDays: 10,
      steps: [
        {
          id: 'cross-site-scoring',
          title: 'Review Compliance Scoring',
          description:
            'Track compliance scores and trends from the dashboard',
          cta: 'View Dashboard',
          ctaHref: '/app',
          icon: 'TrendingUp',
          priority: 'critical',
          category: 'operational',
          automationTrigger: 'cross_site_scoring_enabled',
          estimatedMinutes: 60,
        },
        {
          id: 'risk-intelligence',
          title: 'Review Audit Activity',
          description:
            'Monitor audit events, control changes, and remediation tasks',
          cta: 'Open Audit Log',
          ctaHref: '/app/audit',
          icon: 'AlertTriangle',
          priority: 'high',
          category: 'operational',
          estimatedMinutes: 30,
        },
        {
          id: 'board-reporting',
          title: 'Generate Executive Summaries',
          description:
            'Export summaries for leadership and stakeholder updates',
          cta: 'Open Reports',
          ctaHref: '/app/reports',
          icon: 'FileText',
          priority: 'high',
          category: 'operational',
          estimatedMinutes: 45,
        },
      ],
    },
    {
      id: 'enterprise-readiness',
      title: 'Enterprise Audit Readiness',
      description: 'Prepare for enterprise audits and reviews',
      estimatedDays: 6,
      steps: [
        {
          id: 'consolidated-evidence',
          title: 'Centralize Evidence Vault',
          description: 'Maintain a single source of truth for audit evidence',
          cta: 'View Evidence Vault',
          ctaHref: '/app/vault',
          icon: 'Archive',
          priority: 'critical',
          category: 'readiness',
          estimatedMinutes: 20,
        },
        {
          id: 'enterprise-audit-export',
          title: 'Generate Audit Evidence Pack',
          description:
            'Export evidence bundles for internal review or auditors',
          cta: 'Generate Export',
          ctaHref: '/app/reports',
          icon: 'Download',
          priority: 'critical',
          category: 'readiness',
          estimatedMinutes: 10,
        },
        {
          id: 'executive-dashboard',
          title: 'Review Executive Dashboard',
          description:
            'Summarize enterprise compliance posture for leadership',
          cta: 'View Dashboard',
          ctaHref: '/app',
          icon: 'BarChart',
          priority: 'high',
          category: 'readiness',
          estimatedMinutes: 15,
        },
      ],
    },
  ],
};

/**
 * AGED CARE ROADMAP
 */
const AGED_CARE_ROADMAP: IndustryRoadmap = {
  industryId: 'aged_care',
  industryName: 'Aged Care Residential',
  icon: 'Heart',
  tagline: 'Audit-ready aged care operations',
  estimatedTimeToOperational: '7-14 days',
  keyFrameworks: ['ISO 27001', 'Clinical policy pack', 'Evidence vault'],
  phases: [
    {
      id: 'facility-setup',
      title: 'Facility Setup',
      description: 'Configure aged care facility details and team',
      estimatedDays: 2,
      steps: [
        {
          id: 'provider-details',
          title: 'Complete Provider Registration Details',
          description:
            'Confirm facility profile, accreditation contacts, and service scope',
          cta: 'Update Provider Profile',
          ctaHref: '/app/settings',
          icon: 'Building2',
          priority: 'critical',
          category: 'setup',
          estimatedMinutes: 15,
        },
        {
          id: 'staff-setup',
          title: 'Add Staff & Clinical Team',
          description:
            'Create staff profiles, track qualifications, police checks, and training',
          cta: 'Manage Team Members',
          ctaHref: '/app/team',
          icon: 'Users',
          priority: 'critical',
          category: 'setup',
          estimatedMinutes: 30,
        },
        {
          id: 'resident-system',
          title: 'Set Up Resident Care Management',
          description:
            'Add resident records, care plans, and service agreements',
          cta: 'Manage Residents',
          ctaHref: '/app/patients',
          icon: 'HeartHandshake',
          priority: 'high',
          category: 'setup',
          estimatedMinutes: 20,
        },
      ],
    },
    {
      id: 'quality-standards',
      title: 'Compliance Activation',
      description: 'Activate baseline frameworks and policies',
      estimatedDays: 3,
      steps: [
        {
          id: 'quality-framework',
          title: 'Activate Baseline Compliance Frameworks',
          description: 'Enable ISO 27001 / HIPAA-style controls and map to care workflows',
          cta: 'Enable Frameworks',
          ctaHref: '/app/compliance/frameworks',
          icon: 'Shield',
          priority: 'critical',
          category: 'compliance',
          automationTrigger: 'framework_activated',
          estimatedMinutes: 5,
        },
        {
          id: 'sirs-reporting',
          title: 'Set Up Incident Response Tasks',
          description:
            'Create incident response tasks, escalation owners, and review cadence',
          cta: 'Create Incident Tasks',
          ctaHref: '/app/tasks',
          icon: 'AlertTriangle',
          priority: 'critical',
          category: 'compliance',
          automationTrigger: 'sirs_activated',
          estimatedMinutes: 20,
        },
        {
          id: 'clinical-governance',
          title: 'Set Up Clinical Governance Workflows',
          description:
            'Configure care quality reviews, medication checks, and oversight workflows',
          cta: 'Configure Workflows',
          ctaHref: '/app/workflows',
          icon: 'Stethoscope',
          priority: 'critical',
          category: 'compliance',
          estimatedMinutes: 30,
        },
        {
          id: 'policy-library',
          title: 'Review Pre-loaded Aged Care Policies',
          description:
            'Review Dignity & Choice, Clinical Governance, SIRS policies',
          cta: 'Review Policy Library',
          ctaHref: '/app/policies',
          icon: 'FileText',
          priority: 'high',
          category: 'compliance',
          estimatedMinutes: 45,
        },
      ],
    },
    {
      id: 'operational',
      title: 'Operational Workflows',
      description: 'Deploy aged care compliance workflows',
      estimatedDays: 5,
      steps: [
        {
          id: 'staff-rosters',
          title: 'Configure Staff Roster Compliance',
          description:
            'Track staffing levels, skill mix, and regulatory requirements',
          cta: 'Set Up Roster Monitoring',
          ctaHref: '/app/workflows',
          icon: 'Calendar',
          priority: 'high',
          category: 'operational',
          estimatedMinutes: 30,
        },
        {
          id: 'food-safety',
          title: 'Enable Food Safety Auditing',
          description:
            'Track kitchen audits, temperature logs, and HACCP compliance',
          cta: 'Configure Food Safety',
          ctaHref: '/app/workflows',
          icon: 'Utensils',
          priority: 'high',
          category: 'operational',
          estimatedMinutes: 25,
        },
        {
          id: 'evidence-capture',
          title: 'Upload First Compliance Evidence',
          description:
            'Store staff qualifications, care plans, or audit reports',
          cta: 'Upload Evidence',
          ctaHref: '/app/vault',
          icon: 'Upload',
          priority: 'high',
          category: 'operational',
          automationTrigger: 'evidence_uploaded',
          estimatedMinutes: 10,
        },
      ],
    },
    {
      id: 'audit-readiness',
      title: 'Audit Readiness',
      description: 'Prepare for Quality Commission assessments',
      estimatedDays: 3,
      steps: [
        {
          id: 'compliance-dashboard',
          title: 'Review Compliance Overview',
          description: 'Track compliance progress and open gaps from the dashboard',
          cta: 'View Dashboard',
          ctaHref: '/app',
          icon: 'BarChart',
          priority: 'high',
          category: 'readiness',
          estimatedMinutes: 10,
        },
        {
          id: 'audit-export',
          title: 'Generate Audit Evidence Pack',
          description:
            'Export evidence bundles for internal review or auditors',
          cta: 'Generate Export',
          ctaHref: '/app/reports',
          icon: 'Download',
          priority: 'critical',
          category: 'readiness',
          estimatedMinutes: 5,
        },
      ],
    },
  ],
};

/**
 * CHILDCARE / EARLY LEARNING ROADMAP
 */
const CHILDCARE_ROADMAP: IndustryRoadmap = {
  industryId: 'childcare',
  industryName: 'Childcare / Early Learning',
  icon: 'Baby',
  tagline: 'Quality standards and evidence-ready operations',
  estimatedTimeToOperational: '5-10 days',
  keyFrameworks: ['ISO 27001', 'Childcare policy pack', 'Evidence vault'],
  phases: [
    {
      id: 'service-setup',
      title: 'Service Setup',
      description: 'Configure childcare service details',
      estimatedDays: 2,
      steps: [
        {
          id: 'service-details',
          title: 'Complete Service Registration Details',
          description:
            'Confirm service profile, licensing contacts, and operating scope',
          cta: 'Update Service Profile',
          ctaHref: '/app/settings',
          icon: 'Building2',
          priority: 'critical',
          category: 'setup',
          estimatedMinutes: 15,
        },
        {
          id: 'educator-setup',
          title: 'Add Educators & Staff',
          description:
            'Create educator profiles, track WWCC, qualifications, and ratios',
          cta: 'Manage Educators',
          ctaHref: '/app/team',
          icon: 'Users',
          priority: 'critical',
          category: 'setup',
          estimatedMinutes: 30,
        },
        {
          id: 'child-enrollment',
          title: 'Set Up Child Enrollment System',
          description:
            'Configure child records, emergency contacts, and medical information',
          cta: 'Configure Enrollments',
          ctaHref: '/app/patients',
          icon: 'Baby',
          priority: 'high',
          category: 'setup',
          estimatedMinutes: 20,
        },
      ],
    },
    {
      id: 'nqf-compliance',
      title: 'Compliance Setup',
      description: 'Activate baseline frameworks and policies',
      estimatedDays: 2,
      steps: [
        {
          id: 'nqf-framework',
          title: 'Activate Baseline Compliance Frameworks',
          description: 'Enable ISO 27001 / GDPR packs aligned to childcare operations',
          cta: 'Enable Frameworks',
          ctaHref: '/app/compliance/frameworks',
          icon: 'Shield',
          priority: 'critical',
          category: 'compliance',
          automationTrigger: 'framework_activated',
          estimatedMinutes: 5,
        },
        {
          id: 'wwcc-tracking',
          title: 'Set Up WWCC Register',
          description:
            'Track Working with Children Checks for all educators and staff',
          cta: 'Configure WWCC Register',
          ctaHref: '/app/registers',
          icon: 'FileCheck',
          priority: 'critical',
          category: 'compliance',
          estimatedMinutes: 20,
        },
        {
          id: 'policy-library',
          title: 'Review Pre-loaded NQF Policies',
          description:
            'Review Child Protection, Delivery & Collection, Sun Protection policies',
          cta: 'Review Policy Library',
          ctaHref: '/app/policies',
          icon: 'FileText',
          priority: 'high',
          category: 'compliance',
          estimatedMinutes: 45,
        },
      ],
    },
    {
      id: 'operational',
      title: 'Operational Workflows',
      description: 'Deploy childcare compliance workflows',
      estimatedDays: 3,
      steps: [
        {
          id: 'evacuation-plans',
          title: 'Configure Emergency Response Workflows',
          description:
            'Track drills, emergency procedures, and review cadence',
          cta: 'Set Up Workflows',
          ctaHref: '/app/workflows',
          icon: 'AlertTriangle',
          priority: 'critical',
          category: 'operational',
          estimatedMinutes: 30,
        },
        {
          id: 'evidence-capture',
          title: 'Upload First Compliance Evidence',
          description:
            'Store WWCC, qualifications, or evacuation drill records',
          cta: 'Upload Evidence',
          ctaHref: '/app/vault',
          icon: 'Upload',
          priority: 'high',
          category: 'operational',
          automationTrigger: 'evidence_uploaded',
          estimatedMinutes: 10,
        },
      ],
    },
    {
      id: 'qip-readiness',
      title: 'QIP & Assessment Readiness',
      description: 'Prepare for regulatory assessments',
      estimatedDays: 3,
      steps: [
        {
          id: 'qip-review',
          title: 'Review Improvement Progress',
          description:
            'Track improvement actions and evidence readiness progress',
          cta: 'Open Reports',
          ctaHref: '/app/reports',
          icon: 'TrendingUp',
          priority: 'high',
          category: 'readiness',
          estimatedMinutes: 20,
        },
        {
          id: 'audit-export',
          title: 'Generate Assessment Pack',
          description:
            'Export complete evidence bundle for regulatory assessment',
          cta: 'Generate Export',
          ctaHref: '/app/reports',
          icon: 'Download',
          priority: 'critical',
          category: 'readiness',
          estimatedMinutes: 5,
        },
      ],
    },
  ],
};

/**
 * COMMUNITY SERVICES ROADMAP
 */
const COMMUNITY_SERVICES_ROADMAP: IndustryRoadmap = {
  industryId: 'community_services',
  industryName: 'Community Services',
  icon: 'Users',
  tagline: 'Service quality and compliance across programs and teams',
  estimatedTimeToOperational: '7-10 days',
  keyFrameworks: ['ISO 27001', 'Policy pack', 'Evidence vault'],
  phases: [
    {
      id: 'program-setup',
      title: 'Program Setup',
      description: 'Configure community service programs',
      estimatedDays: 2,
      steps: [
        {
          id: 'organization-details',
          title: 'Complete Organization Details',
          description:
            'Enter organization ABN, funding bodies, and program registrations',
          cta: 'Configure Organization',
          ctaHref: '/app/settings',
          icon: 'Building2',
          priority: 'critical',
          category: 'setup',
          estimatedMinutes: 15,
        },
        {
          id: 'staff-setup',
          title: 'Add Staff & Volunteers',
          description:
            'Create team profiles, track clearances, qualifications, and training',
          cta: 'Manage Team',
          ctaHref: '/app/team',
          icon: 'Users',
          priority: 'critical',
          category: 'setup',
          estimatedMinutes: 30,
        },
        {
          id: 'client-system',
          title: 'Set Up Client Management',
          description:
            'Configure client records, service agreements, and outcomes tracking',
          cta: 'Configure Client System',
          ctaHref: '/app/patients',
          icon: 'UserCheck',
          priority: 'high',
          category: 'setup',
          estimatedMinutes: 20,
        },
      ],
    },
    {
      id: 'compliance-setup',
      title: 'Compliance Setup',
      description: 'Activate baseline frameworks and policies',
      estimatedDays: 2,
      steps: [
        {
          id: 'quality-framework',
          title: 'Activate Baseline Compliance Frameworks',
          description: 'Enable ISO 27001 / GDPR packs aligned to service delivery',
          cta: 'Enable Frameworks',
          ctaHref: '/app/compliance/frameworks',
          icon: 'Shield',
          priority: 'critical',
          category: 'compliance',
          automationTrigger: 'framework_activated',
          estimatedMinutes: 5,
        },
        {
          id: 'clearance-tracking',
          title: 'Set Up Clearance Register',
          description: 'Track WWCC, police checks, and volunteer screening',
          cta: 'Configure Clearance Register',
          ctaHref: '/app/registers',
          icon: 'FileCheck',
          priority: 'critical',
          category: 'compliance',
          estimatedMinutes: 20,
        },
        {
          id: 'policy-library',
          title: 'Review Pre-loaded Service Policies',
          description:
            'Review Client Rights, Privacy, and Service Delivery policies',
          cta: 'Review Policy Library',
          ctaHref: '/app/policies',
          icon: 'FileText',
          priority: 'high',
          category: 'compliance',
          estimatedMinutes: 30,
        },
      ],
    },
    {
      id: 'operational',
      title: 'Operational Workflows',
      description: 'Deploy service delivery workflows',
      estimatedDays: 3,
      steps: [
        {
          id: 'program-monitoring',
          title: 'Configure Program Outcome Tracking',
          description:
            'Track service delivery, client outcomes, and program effectiveness',
          cta: 'Set Up Outcome Tracking',
          ctaHref: '/app/workflows',
          icon: 'Target',
          priority: 'high',
          category: 'operational',
          estimatedMinutes: 30,
        },
        {
          id: 'evidence-capture',
          title: 'Upload First Compliance Evidence',
          description:
            'Store clearances, service agreements, or outcome reports',
          cta: 'Upload Evidence',
          ctaHref: '/app/vault',
          icon: 'Upload',
          priority: 'high',
          category: 'operational',
          automationTrigger: 'evidence_uploaded',
          estimatedMinutes: 10,
        },
      ],
    },
    {
      id: 'audit-readiness',
      title: 'Audit Readiness',
      description: 'Prepare for funding body and regulatory audits',
      estimatedDays: 3,
      steps: [
        {
          id: 'compliance-dashboard',
          title: 'Review Compliance Overview',
          description: 'Track compliance progress and open gaps from the dashboard',
          cta: 'View Dashboard',
          ctaHref: '/app',
          icon: 'BarChart',
          priority: 'high',
          category: 'readiness',
          estimatedMinutes: 10,
        },
        {
          id: 'audit-export',
          title: 'Generate Compliance Pack',
          description:
            'Export complete evidence bundle for funding body or audit',
          cta: 'Generate Export',
          ctaHref: '/app/reports',
          icon: 'Download',
          priority: 'critical',
          category: 'readiness',
          estimatedMinutes: 5,
        },
      ],
    },
  ],
};

/**
 * DEFAULT/OTHER SERVICES ROADMAP
 */
const DEFAULT_ROADMAP: IndustryRoadmap = {
  industryId: 'other',
  industryName: 'Other Regulated Services',
  icon: 'Settings',
  tagline: 'Flexible compliance infrastructure for regulated industries',
  estimatedTimeToOperational: '10-14 days',
  keyFrameworks: ['ISO 27001', 'SOC 2', 'GDPR'],
  phases: [
    {
      id: 'setup',
      title: 'Organization Setup',
      description: 'Configure your organization structure',
      estimatedDays: 2,
      steps: [
        {
          id: 'org-details',
          title: 'Complete Organization Details',
          description:
            'Enter organization name, industry details, and regulatory requirements',
          cta: 'Configure Organization',
          ctaHref: '/app/settings',
          icon: 'Building2',
          priority: 'critical',
          category: 'setup',
          estimatedMinutes: 15,
        },
        {
          id: 'team-setup',
          title: 'Add Team Members',
          description: 'Invite your compliance and operations team',
          cta: 'Manage Team',
          ctaHref: '/app/team',
          icon: 'Users',
          priority: 'critical',
          category: 'setup',
          estimatedMinutes: 20,
        },
      ],
    },
    {
      id: 'framework-setup',
      title: 'Framework Setup',
      description: 'Activate relevant compliance frameworks',
      estimatedDays: 3,
      steps: [
        {
          id: 'framework-selection',
          title: 'Select Compliance Frameworks',
          description:
            'Choose from ISO 27001, SOC 2, GDPR, or custom frameworks',
          cta: 'Select Frameworks',
          ctaHref: '/app/compliance/frameworks',
          icon: 'Shield',
          priority: 'critical',
          category: 'compliance',
          estimatedMinutes: 15,
        },
        {
          id: 'policy-library',
          title: 'Review Pre-loaded Policies',
          description: 'Review and customize policy templates',
          cta: 'Review Policy Library',
          ctaHref: '/app/policies',
          icon: 'FileText',
          priority: 'high',
          category: 'compliance',
          estimatedMinutes: 30,
        },
      ],
    },
    {
      id: 'operational',
      title: 'Operational Setup',
      description: 'Deploy compliance workflows',
      estimatedDays: 5,
      steps: [
        {
          id: 'evidence-capture',
          title: 'Upload First Evidence',
          description: 'Store compliance artifacts in the evidence vault',
          cta: 'Upload Evidence',
          ctaHref: '/app/vault',
          icon: 'Upload',
          priority: 'high',
          category: 'operational',
          estimatedMinutes: 10,
        },
        {
          id: 'automation-setup',
          title: 'Configure Automation',
          description: 'Enable evidence expiry tracking and compliance alerts',
          cta: 'Configure Automation',
          ctaHref: '/app/workflows',
          icon: 'Zap',
          priority: 'high',
          category: 'operational',
          estimatedMinutes: 20,
        },
      ],
    },
    {
      id: 'readiness',
      title: 'Audit Readiness',
      description: 'Prepare for compliance audits',
      estimatedDays: 4,
      steps: [
        {
          id: 'compliance-review',
          title: 'Review Compliance Status',
          description: 'Monitor compliance scores and identify gaps',
          cta: 'View Dashboard',
          ctaHref: '/app',
          icon: 'BarChart',
          priority: 'high',
          category: 'readiness',
          estimatedMinutes: 15,
        },
        {
          id: 'audit-export',
          title: 'Generate Audit Package',
          description: 'Export evidence bundle for external auditors',
          cta: 'Generate Export',
          ctaHref: '/app/reports',
          icon: 'Download',
          priority: 'critical',
          category: 'readiness',
          estimatedMinutes: 5,
        },
      ],
    },
  ],
};

/**
 * ROADMAP REGISTRY
 * Maps industry IDs to their respective roadmaps
 */
export const INDUSTRY_ROADMAPS: Record<string, IndustryRoadmap> = {
  ndis: NDIS_ROADMAP,
  healthcare: HEALTHCARE_ROADMAP,
  aged_care: AGED_CARE_ROADMAP,
  childcare: CHILDCARE_ROADMAP,
  community_services: COMMUNITY_SERVICES_ROADMAP,
  financial_services: FINANCIAL_ROADMAP,
  saas_technology: SAAS_ROADMAP,
  enterprise: ENTERPRISE_ROADMAP,
  other: DEFAULT_ROADMAP,
};

/**
 * Get roadmap for a given industry
 */
export function getRoadmapForIndustry(industryId: string): IndustryRoadmap {
  return INDUSTRY_ROADMAPS[industryId] ?? DEFAULT_ROADMAP;
}

/**
 * Get all available industries
 */
export function getAllIndustries(): IndustryRoadmap[] {
  return Object.values(INDUSTRY_ROADMAPS);
}

/**
 * Calculate total steps across all phases
 */
export function getTotalSteps(roadmap: IndustryRoadmap): number {
  return roadmap.phases.reduce((total, phase) => total + phase.steps.length, 0);
}

/**
 * Calculate total estimated time in days
 */
export function getTotalEstimatedDays(roadmap: IndustryRoadmap): number {
  return roadmap.phases.reduce(
    (total, phase) => total + phase.estimatedDays,
    0,
  );
}

/**
 * Get steps by category
 */
export function getStepsByCategory(
  roadmap: IndustryRoadmap,
  category: RoadmapStep['category'],
): RoadmapStep[] {
  return roadmap.phases.flatMap((phase) =>
    phase.steps.filter((step) => step.category === category),
  );
}

/**
 * Get steps by priority
 */
export function getStepsByPriority(
  roadmap: IndustryRoadmap,
  priority: RoadmapStep['priority'],
): RoadmapStep[] {
  return roadmap.phases.flatMap((phase) =>
    phase.steps.filter((step) => step.priority === priority),
  );
}
