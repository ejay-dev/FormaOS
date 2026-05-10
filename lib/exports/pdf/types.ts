export type PageSize = 'A4' | 'LETTER';

export type BoardPackPdfInput = {
  kind: 'board-pack';
  pageSize?: PageSize;
  orgName: string;
  generatedAt: string;
  classification?: string;
  dateRange: { from: string; to: string };
  sections: Array<{
    title: string;
    type:
      | 'summary'
      | 'scorecard'
      | 'risk_register'
      | 'gaps'
      | 'audit_readiness'
      | 'incidents'
      | 'remediation'
      | 'appendix';
    data: unknown;
  }>;
};

export type PostureReportPdfInput = {
  kind: 'posture-report';
  pageSize?: PageSize;
  orgName: string;
  generatedAt: string;
  frameworks: Array<{
    code: string;
    name: string;
    score: number;
    totalControls: number;
    satisfiedControls: number;
    partialControls: number;
    notAssessedControls: number;
  }>;
  topGaps: Array<{
    controlCode: string;
    title: string;
    framework: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }>;
  notes?: string;
};

export type AuditExtractPdfInput = {
  kind: 'audit-extract';
  pageSize?: PageSize;
  orgName: string;
  generatedAt: string;
  range: { from: string; to: string };
  entries: Array<{
    occurredAt: string;
    actor: string;
    action: string;
    target?: string;
    detail?: string;
  }>;
};

export type ExportSpec =
  | BoardPackPdfInput
  | PostureReportPdfInput
  | AuditExtractPdfInput;
