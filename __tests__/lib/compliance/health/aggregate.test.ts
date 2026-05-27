/** @jest-environment node */
/**
 * Audit 2026-05-27 (Tier 2.C) — compliance health aggregation tests.
 *
 * Pure-function shape; no Supabase. Drives the dashboard's overall score,
 * per-framework breakdown, and top-N outstanding ranking against a small
 * in-memory fixture.
 */

import {
  aggregateHealth,
  scoreFramework,
  type EvaluationRow,
  type FrameworkMeta,
} from '@/lib/compliance/health/aggregate';

const FRAMEWORKS: FrameworkMeta[] = [
  { id: 'fw-soc2', slug: 'soc2', name: 'SOC 2' },
  { id: 'fw-ndis', slug: 'ndis', name: 'NDIS' },
];

function row(
  framework_id: string,
  control_key: string,
  status: string,
  opts: Partial<EvaluationRow> = {},
): EvaluationRow {
  return {
    framework_id,
    control_key,
    status,
    last_evaluated_at: opts.last_evaluated_at ?? '2026-05-26T00:00:00Z',
    risk_level: opts.risk_level ?? 'medium',
    control_title: opts.control_title ?? `Control ${control_key}`,
  };
}

describe('scoreFramework()', () => {
  it('returns 0 for zero-control frameworks (visibly empty rather than misleading 100%)', () => {
    expect(scoreFramework({ pass: 0, partial: 0, fail: 0, not_evaluated: 0 }, 0)).toBe(0);
  });

  it('counts partial as half a pass', () => {
    expect(
      scoreFramework({ pass: 4, partial: 2, fail: 0, not_evaluated: 0 }, 6),
    ).toBeCloseTo((4 + 1) / 6, 4);
  });

  it('treats not_evaluated as 0 (manual attestation does not satisfy the score)', () => {
    expect(
      scoreFramework({ pass: 5, partial: 0, fail: 0, not_evaluated: 5 }, 10),
    ).toBeCloseTo(0.5, 4);
  });
});

describe('aggregateHealth()', () => {
  it('rolls per-framework status counts into the overall view', () => {
    const result = aggregateHealth({
      rows: [
        row('fw-soc2', 'CC1.1', 'pass'),
        row('fw-soc2', 'CC1.2', 'pass'),
        row('fw-soc2', 'CC2.1', 'partial'),
        row('fw-ndis', 'NDIS-1.1', 'pass'),
        row('fw-ndis', 'NDIS-1.5', 'fail', { risk_level: 'critical' }),
      ],
      frameworks: FRAMEWORKS,
    });

    expect(result.overall.framework_count).toBe(2);
    expect(result.overall.total).toBe(5);
    expect(result.overall.status_counts).toEqual({
      pass: 3,
      partial: 1,
      fail: 1,
      not_evaluated: 0,
    });
    // SOC2 score: (2 + 0.5)/3 = 0.833; NDIS: 1/2 = 0.5
    // Weighted by total controls: (0.833*3 + 0.5*2) / 5 = 3.5/5 = 0.7
    expect(result.overall.score).toBeCloseTo(0.7, 4);
  });

  it('returns frameworks sorted alphabetically', () => {
    const result = aggregateHealth({
      rows: [row('fw-soc2', 'CC1.1', 'pass'), row('fw-ndis', 'NDIS-1.1', 'pass')],
      frameworks: FRAMEWORKS,
    });
    expect(result.frameworks.map((f) => f.slug)).toEqual(['ndis', 'soc2']);
  });

  it('puts fail before partial when urgency scores tie, then alphabetises', () => {
    const result = aggregateHealth({
      rows: [
        row('fw-soc2', 'CC1.1', 'partial', { risk_level: 'critical' }),
        row('fw-soc2', 'CC2.1', 'fail', { risk_level: 'medium' }),
        row('fw-soc2', 'CC3.1', 'pass'),
      ],
      frameworks: FRAMEWORKS,
    });
    // partial × critical = 2 × 4 = 8; fail × medium = 4 × 2 = 8 — tied.
    // Tie-break: fail first.
    expect(result.outstanding[0].control_key).toBe('CC2.1');
    expect(result.outstanding[0].status).toBe('fail');
    expect(result.outstanding[1].status).toBe('partial');
  });

  it('clamps outstanding to topN', () => {
    const rows = Array.from({ length: 20 }, (_, i) =>
      row('fw-soc2', `CTRL-${String(i).padStart(2, '0')}`, 'fail', {
        risk_level: 'high',
      }),
    );
    const result = aggregateHealth({ rows, frameworks: FRAMEWORKS, topN: 5 });
    expect(result.outstanding).toHaveLength(5);
  });

  it('treats unknown risk levels as medium so they neither dominate nor disappear', () => {
    const result = aggregateHealth({
      rows: [
        row('fw-soc2', 'X1', 'fail', { risk_level: 'unknown' }),
        row('fw-soc2', 'X2', 'fail', { risk_level: 'low' }),
      ],
      frameworks: FRAMEWORKS,
    });
    // medium (2) > low (1) — X1 should rank higher.
    expect(result.outstanding[0].control_key).toBe('X1');
  });

  it('omits pass rows from outstanding', () => {
    const result = aggregateHealth({
      rows: [
        row('fw-soc2', 'CC1.1', 'pass'),
        row('fw-soc2', 'CC1.2', 'partial'),
      ],
      frameworks: FRAMEWORKS,
    });
    expect(result.outstanding.map((c) => c.control_key)).toEqual(['CC1.2']);
  });

  it('omits not_evaluated rows from outstanding (handled by manual-attestation flow)', () => {
    const result = aggregateHealth({
      rows: [
        row('fw-ndis', 'NDIS-1.2', 'not_evaluated'),
        row('fw-ndis', 'NDIS-1.5', 'fail'),
      ],
      frameworks: FRAMEWORKS,
    });
    expect(result.outstanding.map((c) => c.control_key)).toEqual(['NDIS-1.5']);
  });

  it('skips orphan rows whose framework_id has no metadata', () => {
    const result = aggregateHealth({
      rows: [
        row('fw-orphan', 'X1', 'fail'),
        row('fw-soc2', 'CC1.1', 'pass'),
      ],
      frameworks: FRAMEWORKS,
    });
    expect(result.overall.total).toBe(1);
    expect(result.outstanding).toHaveLength(0);
  });

  it('reports the most recent last_evaluated_at per framework', () => {
    const result = aggregateHealth({
      rows: [
        row('fw-soc2', 'CC1.1', 'pass', {
          last_evaluated_at: '2026-05-01T00:00:00Z',
        }),
        row('fw-soc2', 'CC1.2', 'pass', {
          last_evaluated_at: '2026-05-20T00:00:00Z',
        }),
        row('fw-soc2', 'CC1.3', 'pass', {
          last_evaluated_at: '2026-05-10T00:00:00Z',
        }),
      ],
      frameworks: FRAMEWORKS,
    });
    const soc2 = result.frameworks.find((f) => f.slug === 'soc2');
    expect(soc2?.last_evaluated_at).toBe('2026-05-20T00:00:00Z');
  });

  it('emits all four status counts even when one band is empty', () => {
    const result = aggregateHealth({
      rows: [row('fw-soc2', 'CC1.1', 'pass')],
      frameworks: FRAMEWORKS,
    });
    const soc2 = result.frameworks.find((f) => f.slug === 'soc2');
    expect(soc2?.status_counts).toEqual({
      pass: 1,
      partial: 0,
      fail: 0,
      not_evaluated: 0,
    });
  });
});
