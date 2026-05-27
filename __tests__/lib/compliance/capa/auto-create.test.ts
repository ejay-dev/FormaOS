/** @jest-environment node */
/**
 * Audit 2026-05-27 (Tier 2.A) — CAPA auto-creation tests.
 *
 * Pure-function shape; no Supabase. Drives the title/description/severity
 * mapping and the dedupe logic against in-memory fixtures.
 */

import {
  buildCapaInputs,
  dedupeAgainstExisting,
  CAPA_SOURCE_TYPE,
  type FailingControl,
} from '@/lib/compliance/capa/auto-create';
import type { ControlResult } from '@/lib/compliance/evaluators/types';

function failingResult(opts: Partial<ControlResult> = {}): ControlResult {
  return {
    controlCode: 'TEST',
    status: 'fail',
    evidenceRefs: [],
    gaps: [],
    confidence: 0.7,
    reason: 'something is wrong',
    evaluatedAt: '2026-05-27T00:00:00Z',
    ...opts,
  };
}

function failure(opts: Partial<FailingControl> & { controlId: string }): FailingControl {
  return {
    controlCode: opts.controlCode ?? 'NDIS-1.3',
    controlTitle: 'controlTitle' in opts ? opts.controlTitle : 'Privacy and dignity',
    frameworkSlug: 'frameworkSlug' in opts ? opts.frameworkSlug : 'ndis',
    result: opts.result ?? failingResult(),
    controlId: opts.controlId,
  };
}

describe('buildCapaInputs()', () => {
  it('drops non-fail evaluator results', () => {
    const out = buildCapaInputs({
      orgId: 'org-1',
      createdBy: null,
      failures: [
        failure({ controlId: 'c-1', result: failingResult({ status: 'partial' }) }),
        failure({ controlId: 'c-2', result: failingResult({ status: 'pass' }) }),
        failure({ controlId: 'c-3', result: failingResult({ status: 'not_evaluated' }) }),
      ],
    });
    expect(out).toHaveLength(0);
  });

  it('emits one CapaInputRow per failing control', () => {
    const out = buildCapaInputs({
      orgId: 'org-1',
      createdBy: 'user-7',
      failures: [
        failure({ controlId: 'c-1' }),
        failure({ controlId: 'c-2', controlCode: 'NDIS-2.6' }),
      ],
    });
    expect(out).toHaveLength(2);
    expect(out[0].source_type).toBe(CAPA_SOURCE_TYPE);
    expect(out[0].source_id).toBe('c-1');
    expect(out[0].organization_id).toBe('org-1');
    expect(out[0].created_by).toBe('user-7');
    expect(out[0].status).toBe('open');
    expect(out[0].type).toBe('compliance_finding');
  });

  it('derives severity from the first gap', () => {
    const out = buildCapaInputs({
      orgId: 'org-1',
      createdBy: null,
      failures: [
        failure({
          controlId: 'c-1',
          result: failingResult({
            gaps: [
              { code: 'critical_thing', message: 'breach', severity: 'critical' },
              { code: 'low_thing', message: 'minor', severity: 'low' },
            ],
          }),
        }),
      ],
    });
    expect(out[0].severity).toBe('critical');
    expect(out[0].priority).toBe('critical');
  });

  it('defaults severity to medium when no gaps present', () => {
    const out = buildCapaInputs({
      orgId: 'org-1',
      createdBy: null,
      failures: [failure({ controlId: 'c-1', result: failingResult({ gaps: [] }) })],
    });
    expect(out[0].severity).toBe('medium');
  });

  it('caps title at 180 chars with an ellipsis', () => {
    const longReason = 'x'.repeat(500);
    const out = buildCapaInputs({
      orgId: 'org-1',
      createdBy: null,
      failures: [
        failure({
          controlId: 'c-1',
          controlCode: 'NDIS-3.4',
          result: failingResult({ reason: longReason }),
        }),
      ],
    });
    expect(out[0].title.length).toBeLessThanOrEqual(180);
    expect(out[0].title.endsWith('…')).toBe(true);
    expect(out[0].title.startsWith('NDIS NDIS-3.4: ')).toBe(true);
  });

  it('builds a multi-line description with framework, gaps, and remediation prompt', () => {
    const out = buildCapaInputs({
      orgId: 'org-1',
      createdBy: null,
      failures: [
        failure({
          controlId: 'c-1',
          controlCode: 'NDIS-1.3',
          controlTitle: 'Privacy and dignity',
          frameworkSlug: 'ndis',
          result: failingResult({
            reason: 'No privacy policy on file.',
            gaps: [
              { code: 'no_privacy_policy', message: 'Tag the privacy policy.', severity: 'high' },
            ],
          }),
        }),
      ],
    });
    expect(out[0].description).toContain('Framework: NDIS');
    expect(out[0].description).toContain('Control: NDIS-1.3 — Privacy and dignity');
    expect(out[0].description).toContain('Finding: No privacy policy on file.');
    expect(out[0].description).toContain('- no_privacy_policy [high]: Tag the privacy policy.');
    expect(out[0].description).toContain('Auto-opened by FormaOS compliance evaluator');
  });

  it('handles missing framework slug + control title gracefully', () => {
    const out = buildCapaInputs({
      orgId: 'org-1',
      createdBy: null,
      failures: [
        failure({
          controlId: 'c-1',
          frameworkSlug: null,
          controlTitle: null,
          result: failingResult({ reason: undefined }),
        }),
      ],
    });
    expect(out[0].title).toBe('Compliance NDIS-1.3');
    expect(out[0].description).toContain('Control: NDIS-1.3');
    expect(out[0].description).not.toContain('Framework:');
  });
});

describe('dedupeAgainstExisting()', () => {
  function input(source_id: string) {
    return {
      organization_id: 'org-1',
      type: 'compliance_finding' as const,
      source_type: CAPA_SOURCE_TYPE,
      source_id,
      title: 't',
      description: 'd',
      severity: 'medium' as const,
      priority: 'medium' as const,
      status: 'open' as const,
      created_by: null,
    };
  }

  it('drops candidates whose (source_type, source_id) is already on file', () => {
    const survivors = dedupeAgainstExisting(
      [input('c-1'), input('c-2'), input('c-3')],
      [
        { source_type: CAPA_SOURCE_TYPE, source_id: 'c-2' },
        { source_type: CAPA_SOURCE_TYPE, source_id: 'c-3' },
      ],
    );
    expect(survivors.map((s) => s.source_id)).toEqual(['c-1']);
  });

  it('ignores existing rows with a different source_type', () => {
    const survivors = dedupeAgainstExisting(
      [input('c-1')],
      [{ source_type: 'manual', source_id: 'c-1' }],
    );
    expect(survivors).toHaveLength(1);
  });

  it('returns empty when every candidate is already present', () => {
    const survivors = dedupeAgainstExisting(
      [input('c-1'), input('c-2')],
      [
        { source_type: CAPA_SOURCE_TYPE, source_id: 'c-1' },
        { source_type: CAPA_SOURCE_TYPE, source_id: 'c-2' },
      ],
    );
    expect(survivors).toHaveLength(0);
  });

  it('returns all candidates when existing list is empty', () => {
    const survivors = dedupeAgainstExisting(
      [input('c-1'), input('c-2')],
      [],
    );
    expect(survivors).toHaveLength(2);
  });
});
