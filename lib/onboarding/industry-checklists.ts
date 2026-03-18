/**
 * =========================================================
 * INDUSTRY-SPECIFIC CHECKLIST GENERATOR
 * =========================================================
 * Generates dynamic onboarding checklists based on selected industry
 * Integrates with automation triggers and progress tracking
 */

import {
  getRoadmapForIndustry,
  type IndustryRoadmap,
  type RoadmapStep,
} from './industry-roadmaps';

export type ChecklistItem = {
  id: string;
  label: string;
  description: string;
  href: string;
  category: 'setup' | 'compliance' | 'operational' | 'readiness';
  priority: 'critical' | 'high' | 'medium' | 'low';
  estimatedMinutes: number;
  automationTrigger?: string;
  completionKey: string; // Used to check if completed
  completionCheck: (counts: ChecklistCompletionCounts) => boolean;
};

export type ChecklistCompletionCounts = {
  tasks: number;
  evidence: number;
  members: number;
  complianceChecks: number;
  reports: number;
  frameworks: number;
  policies: number;
  incidents: number;
  registers: number;
  workflows: number;
  patients: number;
  orgProfileComplete: boolean;
};

/**
 * Generate checklist items for a specific industry
 */
export function generateIndustryChecklist(industryId: string): ChecklistItem[] {
  const roadmap = getRoadmapForIndustry(industryId);

  // Get critical and high priority steps from first 2 phases
  const prioritySteps: RoadmapStep[] = [];

  for (const phase of roadmap.phases.slice(0, 2)) {
    const criticalSteps = phase.steps.filter((s) => s.priority === 'critical');
    const highSteps = phase.steps.filter((s) => s.priority === 'high');
    prioritySteps.push(...criticalSteps, ...highSteps);
  }

  // Convert roadmap steps to checklist items with completion logic
  const checklistItems: ChecklistItem[] = prioritySteps
    .slice(0, 8) // Limit to 8 items for focused onboarding
    .map((step) => ({
      id: step.id,
      label: step.title,
      description: step.description,
      href: step.ctaHref,
      category: step.category,
      priority: step.priority,
      estimatedMinutes: step.estimatedMinutes,
      automationTrigger: step.automationTrigger,
      completionKey: getCompletionKeyForStep(step),
      completionCheck: getCompletionCheckForStep(step),
    }));

  return checklistItems;
}

/**
 * Determine completion key based on step characteristics
 */
function getCompletionKeyForStep(step: RoadmapStep): string {
  // Map step IDs to completion keys
  const stepToKey: Record<string, string> = {
    'provider-details': 'orgProfile',
    'practice-details': 'orgProfile',
    'service-details': 'orgProfile',
    'organization-details': 'orgProfile',
    'org-details': 'orgProfile',
    'multi-site-governance': 'orgProfile',
    'department-creation': 'members',
    'business-unit-linking': 'members',
    'staff-setup': 'members',
    'team-setup': 'members',
    'clinician-setup': 'members',
    'educator-setup': 'members',
    'participant-onboarding': 'patients',
    'resident-system': 'patients',
    'child-enrollment': 'patients',
    'client-system': 'patients',
    'location-setup': 'registers',
    'framework-provision': 'frameworks',
    'framework-activation': 'frameworks',
    'racgp-framework': 'frameworks',
    'soc2-activation': 'frameworks',
    'iso27001-activation': 'frameworks',
    'iso27001-framework': 'frameworks',
    'soc2-framework': 'frameworks',
    'nqf-framework': 'frameworks',
    'quality-framework': 'frameworks',
    'shared-controls': 'frameworks',
    'policy-library': 'policies',
    'policy-lifecycle': 'policies',
    'evidence-capture': 'evidence',
    'evidence-vault': 'evidence',
    'consolidated-evidence': 'evidence',
    'incident-system': 'incidents',
    'incident-logging': 'incidents',
    'sirs-reporting': 'incidents',
    'credential-register': 'registers',
    'wwcc-tracking': 'registers',
    'ahpra-tracking': 'registers',
    'clearance-tracking': 'registers',
    'risk-registers': 'registers',
    'vendor-risk': 'registers',
    'vendor-security': 'registers',
    'compliance-scoring': 'complianceChecks',
    'compliance-dashboard': 'complianceChecks',
    'compliance-review': 'complianceChecks',
    'compliance-dashboards': 'complianceChecks',
    'compliance-intelligence': 'complianceChecks',
    'multi-site-dashboards': 'complianceChecks',
    'cross-site-scoring': 'complianceChecks',
    'risk-intelligence': 'complianceChecks',
    'executive-dashboard': 'complianceChecks',
    'control-deduplication': 'complianceChecks',
    'audit-export': 'reports',
    'accreditation-export': 'reports',
    'enterprise-audit-export': 'reports',
    'auditor-sharing': 'reports',
    'auditor-portal': 'reports',
    'board-reporting': 'reports',
    'trust-reporting': 'reports',
    'security-posture': 'reports',
    'qip-review': 'reports',
    'audit-readiness': 'reports',
    'staff-credential-tracking': 'workflows',
    'credential-tracking': 'workflows',
    'participant-workflows': 'workflows',
    'quality-improvement': 'workflows',
    'evidence-expiry': 'workflows',
    'control-monitoring': 'workflows',
    'devops-workflows': 'workflows',
    'change-management': 'workflows',
    'access-control': 'workflows',
    'staff-rosters': 'workflows',
    'food-safety': 'workflows',
    'evacuation-plans': 'workflows',
    'program-monitoring': 'workflows',
    'automation-setup': 'workflows',
  };

  return stepToKey[step.id] || 'tasks';
}

/**
 * Generate completion check function based on step
 */
function getCompletionCheckForStep(
  step: RoadmapStep,
): (counts: ChecklistCompletionCounts) => boolean {
  const key = getCompletionKeyForStep(step);

  return (counts: ChecklistCompletionCounts) => {
    switch (key) {
      case 'orgProfile':
        return Boolean(counts.orgProfileComplete);
      case 'members':
        return counts.members > 1; // At least 2 team members
      case 'patients':
        return counts.patients >= 1; // At least 1 participant/patient record
      case 'frameworks':
        return counts.frameworks >= 1; // At least 1 framework activated
      case 'policies':
        return counts.policies >= 3; // At least 3 policies reviewed
      case 'evidence':
        return counts.evidence >= 1; // At least 1 evidence uploaded
      case 'incidents':
        return counts.incidents >= 1; // At least 1 incident logged (test)
      case 'registers':
        return counts.registers >= 1; // At least 1 register configured
      case 'complianceChecks':
        return counts.complianceChecks >= 1; // Compliance evaluated
      case 'reports':
        return counts.reports >= 1; // At least 1 report generated
      case 'workflows':
        return counts.workflows >= 1; // At least 1 workflow configured
      case 'tasks':
      default:
        return counts.tasks >= 3; // At least 3 tasks created
    }
  };
}

/**
 * Get checklist progress
 */
export function getChecklistProgress(
  checklist: ChecklistItem[],
  counts: ChecklistCompletionCounts,
): {
  completedCount: number;
  totalCount: number;
  progress: number;
  completedItems: string[];
  pendingItems: string[];
} {
  const completedItems: string[] = [];
  const pendingItems: string[] = [];

  for (const item of checklist) {
    if (item.completionCheck(counts)) {
      completedItems.push(item.id);
    } else {
      pendingItems.push(item.id);
    }
  }

  const completedCount = completedItems.length;
  const totalCount = checklist.length;
  const progress =
    totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  return {
    completedCount,
    totalCount,
    progress,
    completedItems,
    pendingItems,
  };
}

/**
 * Get completed roadmap steps based on completion counts
 */
export function getCompletedRoadmapSteps(
  roadmap: IndustryRoadmap,
  counts: ChecklistCompletionCounts,
): string[] {
  const completed: string[] = [];

  for (const phase of roadmap.phases) {
    for (const step of phase.steps) {
      const isComplete = getCompletionCheckForStep(step)(counts);
      if (isComplete) {
        completed.push(step.id);
      }
    }
  }

  return completed;
}

/**
 * Get next recommended action
 */
export function getNextAction(
  checklist: ChecklistItem[],
  counts: ChecklistCompletionCounts,
): ChecklistItem | null {
  // Find first incomplete item
  const incompleteItem = checklist.find(
    (item) => !item.completionCheck(counts),
  );
  return incompleteItem || null;
}

/**
 * Get items by category
 */
export function getItemsByCategory(
  checklist: ChecklistItem[],
  category: ChecklistItem['category'],
): ChecklistItem[] {
  return checklist.filter((item) => item.category === category);
}

/**
 * Get items by priority
 */
export function getItemsByPriority(
  checklist: ChecklistItem[],
  priority: ChecklistItem['priority'],
): ChecklistItem[] {
  return checklist.filter((item) => item.priority === priority);
}

/**
 * Estimate time to completion
 */
export function estimateTimeToCompletion(
  checklist: ChecklistItem[],
  counts: ChecklistCompletionCounts,
): number {
  let totalMinutes = 0;

  for (const item of checklist) {
    if (!item.completionCheck(counts)) {
      totalMinutes += item.estimatedMinutes;
    }
  }

  return totalMinutes;
}

/**
 * Get completion status summary
 */
export function getCompletionSummary(
  checklist: ChecklistItem[],
  counts: ChecklistCompletionCounts,
): {
  byCategory: Record<string, { completed: number; total: number }>;
  byPriority: Record<string, { completed: number; total: number }>;
  overallProgress: number;
} {
  const byCategory: Record<string, { completed: number; total: number }> = {
    setup: { completed: 0, total: 0 },
    compliance: { completed: 0, total: 0 },
    operational: { completed: 0, total: 0 },
    readiness: { completed: 0, total: 0 },
  };

  const byPriority: Record<string, { completed: number; total: number }> = {
    critical: { completed: 0, total: 0 },
    high: { completed: 0, total: 0 },
    medium: { completed: 0, total: 0 },
    low: { completed: 0, total: 0 },
  };

  for (const item of checklist) {
    const isComplete = item.completionCheck(counts);

    // Category stats
    byCategory[item.category].total++;
    if (isComplete) {
      byCategory[item.category].completed++;
    }

    // Priority stats
    byPriority[item.priority].total++;
    if (isComplete) {
      byPriority[item.priority].completed++;
    }
  }

  const { progress } = getChecklistProgress(checklist, counts);

  return {
    byCategory,
    byPriority,
    overallProgress: progress,
  };
}

/**
 * GENERIC FALLBACK CHECKLIST
 * Used when no industry is selected or for 'other' industry
 */
export function getGenericChecklist(): ChecklistItem[] {
  return [
    {
      id: 'team-invite',
      label: 'Invite your first team member',
      description: 'Bring your compliance team into FormaOS',
      href: '/app/team',
      category: 'setup',
      priority: 'high',
      estimatedMinutes: 5,
      completionKey: 'members',
      completionCheck: (counts) => counts.members > 1,
    },
    {
      id: 'framework-selection',
      label: 'Activate a compliance framework',
      description: 'Choose ISO 27001, SOC 2, GDPR, or another framework',
      href: '/app/compliance/frameworks',
      category: 'compliance',
      priority: 'critical',
      estimatedMinutes: 10,
      completionKey: 'frameworks',
      completionCheck: (counts) => counts.frameworks >= 1,
      automationTrigger: 'framework_activated',
    },
    {
      id: 'first-task',
      label: 'Create your first compliance task',
      description: 'Add a compliance requirement and assign an owner',
      href: '/app/tasks',
      category: 'operational',
      priority: 'high',
      estimatedMinutes: 10,
      completionKey: 'tasks',
      completionCheck: (counts) => counts.tasks >= 1,
    },
    {
      id: 'first-evidence',
      label: 'Upload first compliance evidence',
      description: 'Store a compliance artifact in the evidence vault',
      href: '/app/vault',
      category: 'operational',
      priority: 'high',
      estimatedMinutes: 10,
      completionKey: 'evidence',
      completionCheck: (counts) => counts.evidence >= 1,
      automationTrigger: 'evidence_uploaded',
    },
    {
      id: 'policy-review',
      label: 'Review pre-loaded policies',
      description: 'Customize and approve policies from your template library',
      href: '/app/policies',
      category: 'compliance',
      priority: 'medium',
      estimatedMinutes: 30,
      completionKey: 'policies',
      completionCheck: (counts) => counts.policies >= 1,
    },
    {
      id: 'compliance-check',
      label: 'Review compliance dashboard',
      description: 'Check live compliance scores and identify gaps',
      href: '/app',
      category: 'readiness',
      priority: 'high',
      estimatedMinutes: 10,
      completionKey: 'complianceChecks',
      completionCheck: (counts) => counts.complianceChecks >= 1,
    },
    {
      id: 'first-report',
      label: 'Generate your first audit report',
      description: 'Export a compliance snapshot for stakeholders',
      href: '/app/reports',
      category: 'readiness',
      priority: 'medium',
      estimatedMinutes: 5,
      completionKey: 'reports',
      completionCheck: (counts) => counts.reports >= 1,
    },
  ];
}
