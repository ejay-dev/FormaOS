import type { createSupabaseAdminClient } from '@/lib/supabase/admin';

export type EvaluationStatus = 'pass' | 'fail' | 'partial' | 'not_evaluated';

export type EvidenceRef = {
  source: string;
  ref: string;
  capturedAt?: string;
};

export type ControlGap = {
  code: string;
  message: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
};

export type ControlResult = {
  controlCode: string;
  status: EvaluationStatus;
  evidenceRefs: EvidenceRef[];
  gaps: ControlGap[];
  confidence: number;
  reason?: string;
  evaluatedAt: string;
};

export type ControlEvaluatorContext = {
  orgId: string;
  db: ReturnType<typeof createSupabaseAdminClient>;
};

export type ControlEvaluator = (
  ctx: ControlEvaluatorContext,
) => Promise<ControlResult>;

export type ControlEvaluatorMeta = {
  framework: 'soc2' | 'iso27001' | 'hipaa' | 'gdpr' | 'pci-dss' | 'nist-csf' | 'cis-controls';
  controlCode: string;
  evaluator: ControlEvaluator;
};
