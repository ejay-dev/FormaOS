/**
 * Feature Benefits Mapping
 * Maps locked features to their specific value propositions
 */

import type { LucideIcon } from 'lucide-react';
import {
  FileCheck,
  Workflow,
  Shield,
  BarChart3,
  Users,
  FileText,
  Zap,
  Target,
  Clock,
  Lock,
  Download,
  Bell,
} from 'lucide-react';

export interface FeatureBenefit {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  benefits: string[];
  useCases: string[];
  requiredPlan: 'basic' | 'pro' | 'enterprise';
  category: FeatureCategory;
}

export type FeatureCategory =
  | 'compliance'
  | 'automation'
  | 'reporting'
  | 'team'
  | 'security'
  | 'integrations';

/**
 * Feature benefits catalog
 */
export const FEATURE_BENEFITS: Record<string, FeatureBenefit> = {
  // Compliance features
  'audit-reports': {
    id: 'audit-reports',
    title: 'Audit-Ready Reports',
    description: 'Generate certification-ready PDF reports for SOC2, ISO27001, NDIS, and HIPAA.',
    icon: FileText,
    benefits: [
      'Export audit-ready documentation in seconds',
      'Pre-formatted for auditor review',
      'Includes evidence summaries and control mapping',
      'Automatic compliance score calculation',
    ],
    useCases: [
      'Preparing for external audits',
      'Sharing compliance status with stakeholders',
      'Board-level reporting',
    ],
    requiredPlan: 'pro',
    category: 'reporting',
  },
  'executive-dashboard': {
    id: 'executive-dashboard',
    title: 'Executive Dashboard',
    description: 'C-level visibility into organization-wide compliance posture.',
    icon: BarChart3,
    benefits: [
      'Real-time compliance posture scoring',
      'Framework coverage tracking',
      'Critical gap identification',
      'Audit readiness forecasting',
    ],
    useCases: [
      'Board presentations',
      'Risk management oversight',
      'Strategic compliance planning',
    ],
    requiredPlan: 'pro',
    category: 'reporting',
  },
  workflows: {
    id: 'workflows',
    title: 'Compliance Workflows',
    description: 'Automate evidence collection, task assignment, and compliance monitoring.',
    icon: Workflow,
    benefits: [
      'Reduce manual compliance work by 60%',
      'Never miss a renewal deadline',
      'Automatic task creation on events',
      'Evidence collection on schedule',
    ],
    useCases: [
      'Automated credential renewal reminders',
      'Scheduled evidence collection',
      'Triggered task assignment',
    ],
    requiredPlan: 'pro',
    category: 'automation',
  },
  'advanced-evidence': {
    id: 'advanced-evidence',
    title: 'Advanced Evidence Vault',
    description: 'Secure evidence management with SHA-256 integrity and audit trails.',
    icon: FileCheck,
    benefits: [
      'Tamper-proof evidence storage',
      'Complete audit trail of changes',
      'Automatic retention policy enforcement',
      'Bulk evidence upload and linking',
    ],
    useCases: [
      'High-security compliance requirements',
      'Regulatory evidence retention',
      'Legal discovery preparation',
    ],
    requiredPlan: 'pro',
    category: 'security',
  },
  'multi-framework': {
    id: 'multi-framework',
    title: 'Multi-Framework Mapping',
    description: 'Map controls across SOC2, ISO27001, HIPAA, and custom frameworks.',
    icon: Target,
    benefits: [
      'Single control satisfies multiple frameworks',
      'Reduce duplicate evidence collection',
      'Unified compliance view',
      'Cross-framework gap analysis',
    ],
    useCases: [
      'Organizations with multiple compliance requirements',
      'Scaling to new certifications',
      'M&A compliance integration',
    ],
    requiredPlan: 'pro',
    category: 'compliance',
  },
  'team-unlimited': {
    id: 'team-unlimited',
    title: 'Unlimited Team Members',
    description: 'Add your entire organization without per-seat costs.',
    icon: Users,
    benefits: [
      'No per-seat pricing limits',
      'Full team collaboration',
      'Role-based access control',
      'Department-level permissions',
    ],
    useCases: [
      'Growing organizations',
      'Enterprise-wide rollout',
      'Cross-functional compliance',
    ],
    requiredPlan: 'enterprise',
    category: 'team',
  },
  'sso-saml': {
    id: 'sso-saml',
    title: 'SSO & SAML Integration',
    description: 'Enterprise-grade identity management with your existing provider.',
    icon: Lock,
    benefits: [
      'Single sign-on convenience',
      'Centralized access control',
      'Automatic user provisioning',
      'Compliance with IT security policies',
    ],
    useCases: [
      'Enterprise security requirements',
      'IT-managed access control',
      'Reducing password fatigue',
    ],
    requiredPlan: 'enterprise',
    category: 'security',
  },
  'api-access': {
    id: 'api-access',
    title: 'API Access',
    description: 'Programmatic access to compliance data for custom integrations.',
    icon: Zap,
    benefits: [
      'Custom reporting and analytics',
      'Integration with internal tools',
      'Automated data synchronization',
      'Build custom compliance workflows',
    ],
    useCases: [
      'Custom dashboards',
      'Data warehouse integration',
      'Automated compliance pipelines',
    ],
    requiredPlan: 'enterprise',
    category: 'integrations',
  },
  'evidence-export': {
    id: 'evidence-export',
    title: 'Evidence Pack Export',
    description: 'Export complete evidence packages as ZIP files for auditors.',
    icon: Download,
    benefits: [
      'One-click auditor packages',
      'Organized folder structure',
      'Includes metadata and summaries',
      'Offline audit support',
    ],
    useCases: [
      'External auditor requests',
      'Regulatory submissions',
      'Compliance documentation backup',
    ],
    requiredPlan: 'pro',
    category: 'reporting',
  },
  'deadline-alerts': {
    id: 'deadline-alerts',
    title: 'Smart Deadline Alerts',
    description: 'Proactive notifications for upcoming compliance deadlines.',
    icon: Bell,
    benefits: [
      'Never miss a compliance deadline',
      'Customizable reminder schedules',
      'Team notification distribution',
      'Calendar integration ready',
    ],
    useCases: [
      'Audit preparation',
      'Certification renewals',
      'Evidence refresh cycles',
    ],
    requiredPlan: 'pro',
    category: 'automation',
  },
  'care-scorecard': {
    id: 'care-scorecard',
    title: 'Care Operations Scorecard',
    description: 'Industry-specific metrics for NDIS, Healthcare, and Aged Care.',
    icon: Shield,
    benefits: [
      'Staff credential monitoring',
      'Care plan review tracking',
      'Incident management insights',
      'Workload distribution analysis',
    ],
    useCases: [
      'Care industry compliance',
      'Staff credential management',
      'Operational efficiency',
    ],
    requiredPlan: 'pro',
    category: 'compliance',
  },
  'time-tracking': {
    id: 'time-tracking',
    title: 'Compliance Time Tracking',
    description: 'Track time spent on compliance activities.',
    icon: Clock,
    benefits: [
      'ROI visibility for compliance work',
      'Resource allocation insights',
      'Audit preparation time tracking',
      'Team productivity metrics',
    ],
    useCases: [
      'Compliance cost analysis',
      'Resource planning',
      'Efficiency improvement',
    ],
    requiredPlan: 'pro',
    category: 'reporting',
  },
};

/**
 * Get feature benefit by ID
 */
export function getFeatureBenefit(featureId: string): FeatureBenefit | null {
  return FEATURE_BENEFITS[featureId] || null;
}

/**
 * Get all features for a specific plan level
 */
export function getFeaturesForPlan(
  plan: 'basic' | 'pro' | 'enterprise'
): FeatureBenefit[] {
  const planHierarchy = { basic: 1, pro: 2, enterprise: 3 };
  const planLevel = planHierarchy[plan];

  return Object.values(FEATURE_BENEFITS).filter(
    (feature) => planHierarchy[feature.requiredPlan] <= planLevel
  );
}

/**
 * Get features locked for a specific plan
 */
export function getLockedFeaturesForPlan(
  currentPlan: 'basic' | 'pro' | 'enterprise'
): FeatureBenefit[] {
  const planHierarchy = { basic: 1, pro: 2, enterprise: 3 };
  const currentLevel = planHierarchy[currentPlan];

  return Object.values(FEATURE_BENEFITS).filter(
    (feature) => planHierarchy[feature.requiredPlan] > currentLevel
  );
}

/**
 * Get features by category
 */
export function getFeaturesByCategory(
  category: FeatureCategory
): FeatureBenefit[] {
  return Object.values(FEATURE_BENEFITS).filter(
    (feature) => feature.category === category
  );
}
