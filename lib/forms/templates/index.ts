import type { FormField, FormSettings } from '../types';

// =========================================================
// FORM TEMPLATES - Pre-built compliance form templates
// =========================================================

export interface FormTemplate {
  id: string;
  name: string;
  description: string;
  category: 'compliance' | 'risk' | 'care' | 'hr' | 'security' | 'custom';
  industry: 'general' | 'healthcare' | 'ndis' | 'fintech' | 'saas';
  fields: FormField[];
  settings: Partial<FormSettings>;
}

// ---- Risk Assessment ----
const riskAssessment: FormTemplate = {
  id: 'tpl-risk-assessment',
  name: 'Risk Assessment',
  description:
    'Structured risk assessment with likelihood/impact matrix and mitigation planning.',
  category: 'risk',
  industry: 'general',
  fields: [
    {
      id: 'risk_title',
      type: 'text',
      label: 'Risk Title',
      order: 0,
      validation: { required: true },
    },
    {
      id: 'risk_category',
      type: 'select',
      label: 'Risk Category',
      order: 1,
      options: [
        { label: 'Operational', value: 'operational' },
        { label: 'Financial', value: 'financial' },
        { label: 'Compliance', value: 'compliance' },
        { label: 'Strategic', value: 'strategic' },
        { label: 'Technology', value: 'technology' },
        { label: 'Reputational', value: 'reputational' },
      ],
      validation: { required: true },
    },
    {
      id: 'risk_description',
      type: 'textarea',
      label: 'Risk Description',
      order: 2,
      validation: { required: true },
    },
    {
      id: 'likelihood',
      type: 'select',
      label: 'Likelihood',
      order: 3,
      options: [
        { label: '1 - Rare', value: '1' },
        { label: '2 - Unlikely', value: '2' },
        { label: '3 - Possible', value: '3' },
        { label: '4 - Likely', value: '4' },
        { label: '5 - Almost Certain', value: '5' },
      ],
      validation: { required: true },
    },
    {
      id: 'impact',
      type: 'select',
      label: 'Impact',
      order: 4,
      options: [
        { label: '1 - Insignificant', value: '1' },
        { label: '2 - Minor', value: '2' },
        { label: '3 - Moderate', value: '3' },
        { label: '4 - Major', value: '4' },
        { label: '5 - Catastrophic', value: '5' },
      ],
      validation: { required: true },
    },
    {
      id: 'existing_controls',
      type: 'textarea',
      label: 'Existing Controls',
      order: 5,
    },
    {
      id: 'mitigation_plan',
      type: 'textarea',
      label: 'Mitigation Plan',
      order: 6,
      validation: { required: true },
    },
    {
      id: 'risk_owner',
      type: 'text',
      label: 'Risk Owner',
      order: 7,
      validation: { required: true },
    },
    {
      id: 'review_date',
      type: 'date',
      label: 'Review Date',
      order: 8,
      validation: { required: true },
    },
  ],
  settings: {
    submitButtonText: 'Submit Assessment',
    requireAuthentication: true,
  },
};

// ---- Vendor Questionnaire ----
const vendorQuestionnaire: FormTemplate = {
  id: 'tpl-vendor-questionnaire',
  name: 'Vendor Security Questionnaire',
  description:
    'Due diligence questionnaire for third-party vendors covering data handling and security.',
  category: 'security',
  industry: 'general',
  fields: [
    {
      id: 'vendor_name',
      type: 'text',
      label: 'Vendor Name',
      order: 0,
      validation: { required: true },
    },
    {
      id: 'vendor_contact',
      type: 'email',
      label: 'Vendor Contact Email',
      order: 1,
      validation: { required: true },
    },
    {
      id: 'data_types',
      type: 'textarea',
      label: 'What types of data will be shared with this vendor?',
      order: 2,
      validation: { required: true },
    },
    {
      id: 'data_storage_location',
      type: 'select',
      label: 'Where is data stored?',
      order: 3,
      options: [
        { label: 'Australia', value: 'au' },
        { label: 'United States', value: 'us' },
        { label: 'European Union', value: 'eu' },
        { label: 'Other', value: 'other' },
      ],
      validation: { required: true },
    },
    {
      id: 'encryption_at_rest',
      type: 'radio',
      label: 'Is data encrypted at rest?',
      order: 4,
      options: [
        { label: 'Yes', value: 'yes' },
        { label: 'No', value: 'no' },
        { label: 'Unknown', value: 'unknown' },
      ],
      validation: { required: true },
    },
    {
      id: 'certifications',
      type: 'textarea',
      label: 'Security Certifications (SOC 2, ISO 27001, etc.)',
      order: 5,
    },
    {
      id: 'sub_processors',
      type: 'textarea',
      label: 'List any sub-processors',
      order: 6,
    },
    {
      id: 'breach_history',
      type: 'radio',
      label: 'Any data breaches in the past 3 years?',
      order: 7,
      options: [
        { label: 'Yes', value: 'yes' },
        { label: 'No', value: 'no' },
      ],
      validation: { required: true },
    },
    {
      id: 'breach_details',
      type: 'textarea',
      label: 'Breach Details',
      order: 8,
      helpText: 'If yes, provide details',
      conditionalLogic: [
        {
          fieldId: 'breach_history',
          operator: 'equals',
          value: 'yes',
          action: 'show',
        },
      ],
    },
    { id: 'sla_terms', type: 'textarea', label: 'SLA Terms Summary', order: 9 },
  ],
  settings: {
    submitButtonText: 'Submit Questionnaire',
    requireAuthentication: false,
  },
};

// ---- Access Review ----
const accessReview: FormTemplate = {
  id: 'tpl-access-review',
  name: 'Access Review',
  description:
    'Periodic access review for system and data access verification.',
  category: 'security',
  industry: 'saas',
  fields: [
    {
      id: 'system_name',
      type: 'text',
      label: 'System / Application',
      order: 0,
      validation: { required: true },
    },
    {
      id: 'user_name',
      type: 'text',
      label: 'User Name',
      order: 1,
      validation: { required: true },
    },
    {
      id: 'current_access',
      type: 'select',
      label: 'Current Access Level',
      order: 2,
      options: [
        { label: 'Read Only', value: 'read' },
        { label: 'Read/Write', value: 'write' },
        { label: 'Admin', value: 'admin' },
        { label: 'Super Admin', value: 'super_admin' },
      ],
      validation: { required: true },
    },
    {
      id: 'access_justified',
      type: 'radio',
      label: 'Is this access still justified?',
      order: 3,
      options: [
        { label: 'Yes', value: 'yes' },
        { label: 'No - should be reduced', value: 'reduce' },
        { label: 'No - should be revoked', value: 'revoke' },
      ],
      validation: { required: true },
    },
    {
      id: 'justification',
      type: 'textarea',
      label: 'Justification',
      order: 4,
      validation: { required: true },
    },
    {
      id: 'manager_approval',
      type: 'text',
      label: 'Manager Name (Approver)',
      order: 5,
      validation: { required: true },
    },
    { id: 'review_period', type: 'date', label: 'Next Review Date', order: 6 },
  ],
  settings: { submitButtonText: 'Submit Review', requireAuthentication: true },
};

// ---- Incident Report ----
const incidentReport: FormTemplate = {
  id: 'tpl-incident-report',
  name: 'Incident Report',
  description:
    'Structured incident reporting form for workplace and safety incidents.',
  category: 'compliance',
  industry: 'general',
  fields: [
    {
      id: 'incident_date',
      type: 'date',
      label: 'Date of Incident',
      order: 0,
      validation: { required: true },
    },
    {
      id: 'incident_type',
      type: 'select',
      label: 'Incident Type',
      order: 1,
      options: [
        { label: 'Injury', value: 'injury' },
        { label: 'Near Miss', value: 'near_miss' },
        { label: 'Property Damage', value: 'property' },
        { label: 'Security Breach', value: 'security' },
        { label: 'Complaint', value: 'complaint' },
        { label: 'Other', value: 'other' },
      ],
      validation: { required: true },
    },
    {
      id: 'severity',
      type: 'select',
      label: 'Severity',
      order: 2,
      options: [
        { label: 'Low', value: 'low' },
        { label: 'Medium', value: 'medium' },
        { label: 'High', value: 'high' },
        { label: 'Critical', value: 'critical' },
      ],
      validation: { required: true },
    },
    {
      id: 'location',
      type: 'text',
      label: 'Location',
      order: 3,
      validation: { required: true },
    },
    {
      id: 'description',
      type: 'textarea',
      label: 'Incident Description',
      order: 4,
      validation: { required: true, minLength: 20 },
    },
    {
      id: 'immediate_actions',
      type: 'textarea',
      label: 'Immediate Actions Taken',
      order: 5,
      validation: { required: true },
    },
    { id: 'witnesses', type: 'textarea', label: 'Witnesses (names)', order: 6 },
    {
      id: 'reporter_name',
      type: 'text',
      label: 'Your Name',
      order: 7,
      validation: { required: true },
    },
    {
      id: 'reporter_email',
      type: 'email',
      label: 'Your Email',
      order: 8,
      validation: { required: true },
    },
  ],
  settings: {
    submitButtonText: 'Report Incident',
    requireAuthentication: false,
  },
};

// ---- Policy Acknowledgment ----
const policyAcknowledgment: FormTemplate = {
  id: 'tpl-policy-acknowledgment',
  name: 'Policy Acknowledgment',
  description:
    'Confirm staff have read and understood an organizational policy.',
  category: 'hr',
  industry: 'general',
  fields: [
    {
      id: 'policy_name',
      type: 'text',
      label: 'Policy Name',
      order: 0,
      validation: { required: true },
    },
    { id: 'policy_version', type: 'text', label: 'Policy Version', order: 1 },
    {
      id: 'full_name',
      type: 'text',
      label: 'Full Name',
      order: 2,
      validation: { required: true },
    },
    {
      id: 'read_confirmed',
      type: 'checkbox',
      label: 'I confirm I have read and understood this policy',
      order: 3,
      validation: { required: true },
    },
    {
      id: 'questions',
      type: 'textarea',
      label: 'Questions or Clarifications Needed',
      order: 4,
      helpText: 'Leave blank if none',
    },
    {
      id: 'acknowledged_date',
      type: 'date',
      label: 'Date',
      order: 5,
      validation: { required: true },
    },
  ],
  settings: { submitButtonText: 'Acknowledge', requireAuthentication: true },
};

// ---- Staff Training Record ----
const staffTrainingRecord: FormTemplate = {
  id: 'tpl-staff-training',
  name: 'Staff Training Record',
  description: 'Record staff training completion and assessment results.',
  category: 'hr',
  industry: 'general',
  fields: [
    {
      id: 'staff_name',
      type: 'text',
      label: 'Staff Member Name',
      order: 0,
      validation: { required: true },
    },
    {
      id: 'training_module',
      type: 'text',
      label: 'Training Module',
      order: 1,
      validation: { required: true },
    },
    {
      id: 'completion_date',
      type: 'date',
      label: 'Completion Date',
      order: 2,
      validation: { required: true },
    },
    {
      id: 'assessment_score',
      type: 'number',
      label: 'Assessment Score (%)',
      order: 3,
      validation: { min: 0, max: 100 },
    },
    { id: 'trainer_name', type: 'text', label: 'Trainer Name', order: 4 },
    {
      id: 'certificate_upload',
      type: 'file',
      label: 'Upload Certificate',
      order: 5,
    },
    { id: 'notes', type: 'textarea', label: 'Additional Notes', order: 6 },
  ],
  settings: {
    submitButtonText: 'Record Training',
    requireAuthentication: true,
  },
};

// ---- Care Assessment (NDIS) ----
const careAssessment: FormTemplate = {
  id: 'tpl-care-assessment',
  name: 'Care Needs Assessment',
  description:
    'Participant care needs assessment form for NDIS and disability services.',
  category: 'care',
  industry: 'ndis',
  fields: [
    {
      id: 'participant_name',
      type: 'text',
      label: 'Participant Name',
      order: 0,
      validation: { required: true },
    },
    {
      id: 'assessment_type',
      type: 'select',
      label: 'Assessment Type',
      order: 1,
      options: [
        { label: 'Initial Assessment', value: 'initial' },
        { label: 'Plan Review', value: 'review' },
        { label: 'Change of Circumstances', value: 'change' },
      ],
      validation: { required: true },
    },
    {
      id: 'daily_living',
      type: 'select',
      label: 'Daily Living Support Needs',
      order: 2,
      options: [
        { label: 'Independent', value: 'independent' },
        { label: 'Minimal Support', value: 'minimal' },
        { label: 'Moderate Support', value: 'moderate' },
        { label: 'High Support', value: 'high' },
        { label: 'Very High Support', value: 'very_high' },
      ],
      validation: { required: true },
    },
    {
      id: 'community_access',
      type: 'select',
      label: 'Community Access Support',
      order: 3,
      options: [
        { label: 'Independent', value: 'independent' },
        { label: 'Minimal Support', value: 'minimal' },
        { label: 'Moderate Support', value: 'moderate' },
        { label: 'High Support', value: 'high' },
      ],
      validation: { required: true },
    },
    {
      id: 'goals',
      type: 'textarea',
      label: 'Participant Goals',
      order: 4,
      validation: { required: true },
    },
    { id: 'risk_factors', type: 'textarea', label: 'Risk Factors', order: 5 },
    {
      id: 'support_needs',
      type: 'textarea',
      label: 'Detailed Support Needs',
      order: 6,
      validation: { required: true },
    },
    {
      id: 'assessor_name',
      type: 'text',
      label: 'Assessor Name',
      order: 7,
      validation: { required: true },
    },
    {
      id: 'assessment_date',
      type: 'date',
      label: 'Assessment Date',
      order: 8,
      validation: { required: true },
    },
  ],
  settings: {
    submitButtonText: 'Submit Assessment',
    requireAuthentication: true,
  },
};

// ---- Compliance Checklist ----
const complianceChecklist: FormTemplate = {
  id: 'tpl-compliance-checklist',
  name: 'Compliance Checklist',
  description: 'Control-by-control compliance assessment checklist.',
  category: 'compliance',
  industry: 'general',
  fields: [
    {
      id: 'control_reference',
      type: 'text',
      label: 'Control Reference',
      order: 0,
      validation: { required: true },
    },
    {
      id: 'control_title',
      type: 'text',
      label: 'Control Title',
      order: 1,
      validation: { required: true },
    },
    {
      id: 'compliance_status',
      type: 'select',
      label: 'Compliance Status',
      order: 2,
      options: [
        { label: 'Compliant', value: 'compliant' },
        { label: 'Partially Compliant', value: 'partial' },
        { label: 'Non-Compliant', value: 'non_compliant' },
        { label: 'Not Applicable', value: 'na' },
      ],
      validation: { required: true },
    },
    {
      id: 'evidence_reference',
      type: 'text',
      label: 'Evidence Reference',
      order: 3,
    },
    { id: 'notes', type: 'textarea', label: 'Notes / Observations', order: 4 },
    {
      id: 'assessor',
      type: 'text',
      label: 'Assessor',
      order: 5,
      validation: { required: true },
    },
    {
      id: 'assessment_date',
      type: 'date',
      label: 'Assessment Date',
      order: 6,
      validation: { required: true },
    },
  ],
  settings: {
    submitButtonText: 'Save Assessment',
    requireAuthentication: true,
    allowMultipleSubmissions: true,
  },
};

// ---- Template Registry ----
export const FORM_TEMPLATES: FormTemplate[] = [
  riskAssessment,
  vendorQuestionnaire,
  accessReview,
  incidentReport,
  policyAcknowledgment,
  staffTrainingRecord,
  careAssessment,
  complianceChecklist,
];

export function getTemplatesByCategory(category?: string): FormTemplate[] {
  if (!category) return FORM_TEMPLATES;
  return FORM_TEMPLATES.filter((t) => t.category === category);
}

export function getTemplatesByIndustry(industry?: string): FormTemplate[] {
  if (!industry) return FORM_TEMPLATES;
  return FORM_TEMPLATES.filter(
    (t) => t.industry === industry || t.industry === 'general',
  );
}

export function getTemplateById(id: string): FormTemplate | undefined {
  return FORM_TEMPLATES.find((t) => t.id === id);
}
