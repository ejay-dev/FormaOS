export interface Soc2DomainScore {
  domain: string;
  key: string;
  score: number;
  totalControls: number;
  satisfiedControls: number;
  partialControls: number;
  missingControls: number;
}

export interface Soc2ControlResult {
  controlCode: string;
  title: string;
  domain: string;
  riskLevel: string;
  status: 'satisfied' | 'partial' | 'missing' | 'not_applicable';
  score: number;
  evidenceCount: number;
  taskCount: number;
  completedTaskCount: number;
  suggestedEvidenceTypes: string[];
  implementationGuidance: string;
  gaps: string[];
}

export interface Soc2ReadinessResult {
  overallScore: number;
  domainScores: Soc2DomainScore[];
  controlResults: Soc2ControlResult[];
  totalControls: number;
  satisfiedControls: number;
  assessedAt: string;
}

export interface Soc2Milestone {
  id: string;
  milestoneKey: string;
  title: string;
  description: string | null;
  targetDate: string | null;
  completedAt: string | null;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  sortOrder: number;
}

export interface Soc2RemediationAction {
  id: string;
  controlCode: string;
  actionType: string;
  title: string;
  description: string | null;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  linkedTaskId: string | null;
  linkedEvidenceId: string | null;
  priority: 'critical' | 'high' | 'medium' | 'low';
  createdAt: string;
  completedAt: string | null;
}

export interface AutomatedCheckResult {
  checkName: string;
  controlCode: string;
  passed: boolean;
  detail: string;
  category: string;
}

export interface Soc2CertificationReport {
  organizationName: string;
  assessmentDate: string;
  overallScore: number;
  domainScores: Soc2DomainScore[];
  controlResults: Soc2ControlResult[];
  automatedChecks: AutomatedCheckResult[];
  milestones: Soc2Milestone[];
  remediationActions: Soc2RemediationAction[];
  scoreHistory: { date: string; score: number }[];
}
