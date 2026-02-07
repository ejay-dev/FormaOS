/**
 * Audit Report Types
 * Common types for all audit certification reports
 */

export type ReportType = 'soc2' | 'iso27001' | 'ndis' | 'hipaa';

export interface BaseReportPayload {
  generatedAt: string;
  organizationName: string;
  organizationId: string;
  frameworkCode: string;
  frameworkName: string;
  readinessScore: number;
  controlSummary: ControlSummary;
  evidenceSummary: EvidenceSummary;
  taskSummary: TaskSummary;
  gaps: GapSummary;
}

export interface ControlSummary {
  total: number;
  satisfied: number;
  missing: number;
  partial: number;
}

export interface EvidenceSummary {
  total: number;
  verified: number;
  pending: number;
  rejected: number;
}

export interface TaskSummary {
  total: number;
  completed: number;
  overdue: number;
}

export interface GapSummary {
  missingControls: number;
  partialControls: number;
  criticalGaps: CriticalGap[];
}

export interface CriticalGap {
  controlCode: string;
  controlTitle: string;
  reason: string;
  priority: 'critical' | 'high' | 'medium';
}

// ISO 27001 specific
export interface Iso27001ReportPayload extends BaseReportPayload {
  frameworkCode: 'ISO27001';
  statementOfApplicability: SoaEntry[];
  riskAssessmentSummary: RiskAssessmentSummary;
}

export interface SoaEntry {
  clauseNumber: string;
  controlName: string;
  applicable: boolean;
  justification: string;
  implementationStatus: 'implemented' | 'partial' | 'not_implemented' | 'not_applicable';
  evidenceCount: number;
}

export interface RiskAssessmentSummary {
  totalRisks: number;
  highRisks: number;
  mediumRisks: number;
  lowRisks: number;
  mitigated: number;
}

// NDIS specific
export interface NdisReportPayload extends BaseReportPayload {
  frameworkCode: 'NDIS';
  practiceStandards: NdisPracticeStandard[];
  participantSafetyMetrics: ParticipantSafetyMetrics;
  staffCredentialsSummary: StaffCredentialsSummary;
}

export interface NdisPracticeStandard {
  standardCode: string;
  standardName: string;
  category: string;
  complianceStatus: 'compliant' | 'partial' | 'non_compliant';
  evidenceCount: number;
  lastReviewDate: string | null;
}

export interface ParticipantSafetyMetrics {
  openIncidents: number;
  resolvedLast30Days: number;
  averageResolutionTime: number;
  reportableIncidents: number;
}

export interface StaffCredentialsSummary {
  totalStaff: number;
  compliantStaff: number;
  expiringCredentials: number;
  expiredCredentials: number;
}

// HIPAA specific
export interface HipaaReportPayload extends BaseReportPayload {
  frameworkCode: 'HIPAA';
  privacyRuleCompliance: HipaaRuleCompliance;
  securityRuleCompliance: HipaaRuleCompliance;
  breachNotificationCompliance: HipaaRuleCompliance;
  phiInventorySummary: PhiInventorySummary;
}

export interface HipaaRuleCompliance {
  ruleName: string;
  complianceScore: number;
  satisfiedRequirements: number;
  totalRequirements: number;
  criticalGaps: number;
}

export interface PhiInventorySummary {
  totalSystems: number;
  systemsWithPhi: number;
  encryptedAtRest: number;
  encryptedInTransit: number;
}

// Export options
export interface ReportExportOptions {
  format: 'pdf' | 'json';
  includeEvidence?: boolean;
  includeRecommendations?: boolean;
  coverPage?: boolean;
}
