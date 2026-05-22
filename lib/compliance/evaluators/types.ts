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

/**
 * Framework slug used to key evaluators in the registry. Matches the
 * `slug` from framework-pack JSON manifests (lower-kebab-case) so a
 * framework's pack and its evaluators always line up. The legacy 9
 * SOC2 evaluators were registered under `soc2`; the SOC2-TSC pack
 * (61 controls) is keyed under `soc2-tsc`.
 *
 * Audit compliance-004 (2026-05-22): expanded to cover every active
 * framework pack so subsequent PRs can register evaluators without
 * touching this type.
 */
export type FrameworkSlug =
  | 'soc2'
  | 'soc2-tsc'
  | 'iso27001'
  | 'iso27001-2022'
  | 'hipaa'
  | 'gdpr'
  | 'pci-dss'
  | 'nist-csf'
  | 'cis-controls';

export type ControlEvaluatorMeta = {
  framework: FrameworkSlug;
  controlCode: string;
  evaluator: ControlEvaluator;
};
