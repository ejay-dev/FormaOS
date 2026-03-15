import type { PermissionKey } from '@/app/app/actions/rbac';

export interface PromptTemplate {
  id: string;
  label: string;
  description: string;
  icon: string;
  systemPromptSuffix: string;
  requiredPermission: PermissionKey;
}

export const PROMPT_TEMPLATES: PromptTemplate[] = [
  {
    id: 'compliance_question',
    label: 'Compliance Q&A',
    description: 'Ask general compliance questions about your organization\'s posture.',
    icon: 'MessageSquare',
    systemPromptSuffix:
      'Answer compliance questions accurately based on the organization\'s current compliance posture. Reference specific controls, evidence, and policies. Be precise and actionable.',
    requiredPermission: 'VIEW_CONTROLS',
  },
  {
    id: 'draft_policy',
    label: 'Draft Policy',
    description: 'Generate professional, auditor-ready policy documents.',
    icon: 'FileText',
    systemPromptSuffix:
      'Help draft compliance policies. Generate professional, auditor-ready policy documents. Include sections for Purpose, Scope, Policy Statements, Roles & Responsibilities, Review Schedule. Tailor to the organization\'s enabled frameworks.',
    requiredPermission: 'EDIT_CONTROLS',
  },
  {
    id: 'evidence_suggestion',
    label: 'Evidence Guidance',
    description: 'Get suggestions for evidence artifacts that satisfy compliance controls.',
    icon: 'ClipboardCheck',
    systemPromptSuffix:
      'Suggest specific evidence artifacts that would satisfy the referenced compliance controls. Explain what auditors look for, what format is ideal, and how to gather each artifact.',
    requiredPermission: 'VIEW_CONTROLS',
  },
  {
    id: 'gap_analysis',
    label: 'Gap Analysis',
    description: 'Analyze compliance gaps and get prioritized remediation steps.',
    icon: 'BarChart3',
    systemPromptSuffix:
      'Analyze compliance gaps and recommend prioritized remediation steps. Focus on the highest-risk gaps first. Provide concrete action items with estimated effort.',
    requiredPermission: 'EDIT_CONTROLS',
  },
  {
    id: 'implementation_guidance',
    label: 'Implementation Guidance',
    description: 'Get step-by-step instructions for implementing compliance controls.',
    icon: 'Wrench',
    systemPromptSuffix:
      'Provide detailed implementation guidance for the referenced compliance controls. Include step-by-step instructions, tool recommendations, and common pitfalls.',
    requiredPermission: 'VIEW_CONTROLS',
  },
];
