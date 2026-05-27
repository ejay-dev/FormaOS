/**
 * Compliance health aggregation. Pure functions that take per-control
 * evaluation rows and framework metadata and roll them up into the
 * shape the /app/compliance/health page renders.
 *
 * Kept side-effect-free so jest can drive every shape from in-memory
 * fixtures without a Supabase client. Database wiring lives in
 * lib/compliance/health/fetch.ts.
 */

export type HealthStatus = 'pass' | 'partial' | 'fail' | 'not_evaluated';

export type RiskLevel = 'critical' | 'high' | 'medium' | 'low';

export type EvaluationRow = {
  framework_id: string;
  control_key: string | null;
  status: string | null;
  last_evaluated_at: string | null;
  /** Pulled from framework_controls.default_risk_level via join. */
  risk_level?: string | null;
  /** framework_controls.title via join. */
  control_title?: string | null;
};

export type FrameworkMeta = {
  id: string;
  slug: string;
  name: string;
};

export type StatusCounts = {
  pass: number;
  partial: number;
  fail: number;
  not_evaluated: number;
};

export type FrameworkHealth = {
  framework_id: string;
  slug: string;
  name: string;
  status_counts: StatusCounts;
  total: number;
  /**
   * Per-framework score in [0, 1]. (pass + 0.5*partial) / total.
   * Frameworks with zero controls score 0 so they're visibly empty rather
   * than hiding behind a misleading 100%.
   */
  score: number;
  /** Most-recent last_evaluated_at across this framework's per-control rows. */
  last_evaluated_at: string | null;
};

export type OutstandingControl = {
  framework_id: string;
  framework_slug: string;
  framework_name: string;
  control_key: string;
  control_title: string | null;
  status: 'partial' | 'fail';
  risk_level: RiskLevel;
  /** Sort key used to pick the top N. Higher = more urgent. */
  urgency_score: number;
};

export type OverallHealth = {
  /** Overall compliance score in [0, 1]. Weighted mean of per-framework scores. */
  score: number;
  framework_count: number;
  total: number;
  status_counts: StatusCounts;
};

export type HealthAggregate = {
  overall: OverallHealth;
  frameworks: FrameworkHealth[];
  outstanding: OutstandingControl[];
};

const RISK_WEIGHT: Record<RiskLevel, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

const STATUS_WEIGHT: Record<'fail' | 'partial', number> = {
  fail: 4,
  partial: 2,
};

function normaliseStatus(value: string | null): HealthStatus {
  if (value === 'pass' || value === 'partial' || value === 'fail') return value;
  return 'not_evaluated';
}

function normaliseRisk(value: string | null | undefined): RiskLevel {
  switch ((value ?? '').toLowerCase()) {
    case 'critical':
      return 'critical';
    case 'high':
      return 'high';
    case 'medium':
      return 'medium';
    case 'low':
      return 'low';
    default:
      // Unknown / missing risk levels are downgraded to medium so they
      // don't drown out the truly-critical findings but also aren't
      // hidden entirely.
      return 'medium';
  }
}

function pickLater(
  a: string | null,
  b: string | null | undefined,
): string | null {
  if (!a) return b ?? null;
  if (!b) return a;
  return a > b ? a : b;
}

/**
 * Score a single framework. Exposed so the snapshot-row builder can reuse
 * the same definition that the dashboard renders.
 */
export function scoreFramework(counts: StatusCounts, total: number): number {
  if (total <= 0) return 0;
  return (counts.pass + 0.5 * counts.partial) / total;
}

export type AggregateInput = {
  rows: EvaluationRow[];
  frameworks: FrameworkMeta[];
  /** Default 10 — the dashboard shows the top 10 outstanding controls. */
  topN?: number;
};

export function aggregateHealth(input: AggregateInput): HealthAggregate {
  const { rows, frameworks, topN = 10 } = input;
  const frameworkById = new Map(frameworks.map((f) => [f.id, f]));

  const byFramework = new Map<
    string,
    {
      meta: FrameworkMeta;
      counts: StatusCounts;
      total: number;
      lastEvaluatedAt: string | null;
    }
  >();
  for (const meta of frameworks) {
    byFramework.set(meta.id, {
      meta,
      counts: { pass: 0, partial: 0, fail: 0, not_evaluated: 0 },
      total: 0,
      lastEvaluatedAt: null,
    });
  }

  const outstanding: OutstandingControl[] = [];

  for (const row of rows) {
    const fw = byFramework.get(row.framework_id);
    if (!fw) continue;
    const status = normaliseStatus(row.status);
    fw.counts[status] += 1;
    fw.total += 1;
    fw.lastEvaluatedAt = pickLater(fw.lastEvaluatedAt, row.last_evaluated_at);

    if ((status === 'partial' || status === 'fail') && row.control_key) {
      const risk = normaliseRisk(row.risk_level);
      outstanding.push({
        framework_id: row.framework_id,
        framework_slug: fw.meta.slug,
        framework_name: fw.meta.name,
        control_key: row.control_key,
        control_title: row.control_title ?? null,
        status,
        risk_level: risk,
        urgency_score: STATUS_WEIGHT[status] * RISK_WEIGHT[risk],
      });
    }
  }

  const frameworkHealth: FrameworkHealth[] = Array.from(byFramework.values())
    .map((entry) => ({
      framework_id: entry.meta.id,
      slug: entry.meta.slug,
      name: entry.meta.name,
      status_counts: entry.counts,
      total: entry.total,
      score: scoreFramework(entry.counts, entry.total),
      last_evaluated_at: entry.lastEvaluatedAt,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  // Overall score is a weighted mean by control count so a 200-control
  // framework outweighs a 5-control framework — matches how auditors
  // think about posture.
  let weightedSum = 0;
  let weightSum = 0;
  const overallCounts: StatusCounts = {
    pass: 0,
    partial: 0,
    fail: 0,
    not_evaluated: 0,
  };
  let total = 0;
  let frameworkCount = 0;

  for (const f of frameworkHealth) {
    if (f.total === 0) continue;
    frameworkCount += 1;
    weightedSum += f.score * f.total;
    weightSum += f.total;
    total += f.total;
    overallCounts.pass += f.status_counts.pass;
    overallCounts.partial += f.status_counts.partial;
    overallCounts.fail += f.status_counts.fail;
    overallCounts.not_evaluated += f.status_counts.not_evaluated;
  }

  const overall: OverallHealth = {
    score: weightSum > 0 ? weightedSum / weightSum : 0,
    framework_count: frameworkCount,
    total,
    status_counts: overallCounts,
  };

  // Sort outstanding by urgency desc, then by status (fail before partial),
  // then alphabetically by control_key for deterministic ordering when
  // many controls share the same urgency.
  outstanding.sort((a, b) => {
    if (a.urgency_score !== b.urgency_score) return b.urgency_score - a.urgency_score;
    if (a.status !== b.status) return a.status === 'fail' ? -1 : 1;
    return a.control_key.localeCompare(b.control_key);
  });

  // Drop framework entries we don't have metadata for (defensive — the
  // join in fetch.ts would normally guarantee it).
  for (const row of outstanding) {
    if (!frameworkById.has(row.framework_id)) {
      row.framework_name = row.framework_slug.toUpperCase();
    }
  }

  return {
    overall,
    frameworks: frameworkHealth,
    outstanding: outstanding.slice(0, topN),
  };
}
