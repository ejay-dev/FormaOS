/**
 * Audit compliance-004 (2026-05-22) — phase 1.
 *
 * End-to-end tests for the per-control evaluator framework:
 *  - registry register + lookup round-trip
 *  - `runControlEvaluation` returns not_evaluated when no evaluator
 *    is registered (formerly described as "manual" in the spec —
 *    aligns with the existing `EvaluationStatus` union which
 *    contains `not_evaluated`, not `manual`)
 *  - `runControlEvaluation` catches throws and returns a contained
 *    error result (no crash)
 *  - bootstrap (`registerAllEvaluators`) wires the existing legacy
 *    SOC2 evaluators plus the phase-1 SOC2-TSC evaluators
 *  - one end-to-end test that injects a fake evaluator and asserts
 *    `runControlEvaluation` invokes it with the supplied context
 */

import {
  clearRegistry,
  getEvaluator,
  hasEvaluator,
  listEvaluators,
  registerEvaluator,
} from '@/lib/compliance/evaluators';
import { runControlEvaluation } from '@/lib/compliance/evaluators/run-control';
import {
  REGISTERED_EVALUATOR_KEYS,
  registerAllEvaluators,
  resetRegistrationState,
} from '@/lib/compliance/evaluators/register';
import type {
  ControlEvaluator,
  ControlEvaluatorContext,
  ControlResult,
  FrameworkSlug,
} from '@/lib/compliance/evaluators/types';

function fakeCtx(orgId = 'org-test'): ControlEvaluatorContext {
  return {
    orgId,
    // Tests that exercise the runner don't touch the DB — we hand it
    // a sentinel object and rely on the registered evaluator to be a
    // pure function of the context. Cast through unknown so the
    // sentinel doesn't have to implement the SupabaseClient surface.
    db: { __sentinel: true } as unknown as ControlEvaluatorContext['db'],
  };
}

describe('compliance-004 — evaluator framework', () => {
  beforeEach(() => {
    clearRegistry();
    resetRegistrationState();
  });

  describe('registry register + lookup', () => {
    it('registers and retrieves an evaluator by (framework, code)', () => {
      const evaluator: ControlEvaluator = async () => ({
        controlCode: 'CC6.1',
        status: 'pass',
        evidenceRefs: [],
        gaps: [],
        confidence: 1,
        evaluatedAt: new Date().toISOString(),
      });
      registerEvaluator({
        framework: 'soc2',
        controlCode: 'CC6.1',
        evaluator,
      });
      expect(hasEvaluator('soc2', 'CC6.1')).toBe(true);
      expect(getEvaluator('soc2', 'CC6.1')).toBe(evaluator);
    });

    it('namespaces (framework, code) so packs can share a control code', () => {
      const a: ControlEvaluator = async () => ({
        controlCode: 'CC6.1',
        status: 'pass',
        evidenceRefs: [],
        gaps: [],
        confidence: 1,
        evaluatedAt: new Date().toISOString(),
      });
      const b: ControlEvaluator = async () => ({
        controlCode: 'CC6.1',
        status: 'fail',
        evidenceRefs: [],
        gaps: [],
        confidence: 1,
        evaluatedAt: new Date().toISOString(),
      });
      registerEvaluator({ framework: 'soc2', controlCode: 'CC6.1', evaluator: a });
      registerEvaluator({ framework: 'soc2-tsc', controlCode: 'CC6.1', evaluator: b });
      expect(getEvaluator('soc2', 'CC6.1')).toBe(a);
      expect(getEvaluator('soc2-tsc', 'CC6.1')).toBe(b);
    });
  });

  describe('runControlEvaluation', () => {
    it('returns not_evaluated when no evaluator is registered (never silently passes)', async () => {
      const result = await runControlEvaluation(fakeCtx(), 'soc2', 'CC9.99');
      expect(result.status).toBe('not_evaluated');
      expect(result.confidence).toBe(0);
      expect(result.reason).toMatch(/no automated evaluator/i);
      expect(result.gaps[0].code).toBe('no_evaluator_registered');
    });

    it('catches throws and returns a contained not_evaluated result', async () => {
      const exploder: ControlEvaluator = async () => {
        throw new Error('database is offline');
      };
      registerEvaluator({
        framework: 'soc2',
        controlCode: 'CC6.1',
        evaluator: exploder,
      });
      const result = await runControlEvaluation(fakeCtx(), 'soc2', 'CC6.1');
      expect(result.status).toBe('not_evaluated');
      expect(result.confidence).toBe(0);
      expect(result.reason).toContain('database is offline');
      expect(result.gaps[0].code).toBe('evaluator_threw');
    });

    it('invokes the registered evaluator with the supplied context (end-to-end)', async () => {
      const calls: ControlEvaluatorContext[] = [];
      const fake: ControlEvaluator = async (ctx) => {
        calls.push(ctx);
        return {
          controlCode: 'CC3.2',
          status: 'partial',
          evidenceRefs: [{ source: 'fixture', ref: 'r1' }],
          gaps: [{ code: 'fixture_gap', message: 'fixture', severity: 'low' }],
          confidence: 0.7,
          reason: 'fixture-run',
          evaluatedAt: new Date().toISOString(),
        };
      };
      registerEvaluator({
        framework: 'soc2-tsc',
        controlCode: 'CC3.2',
        evaluator: fake,
      });

      const ctx = fakeCtx('org-end-to-end');
      const result: ControlResult = await runControlEvaluation(
        ctx,
        'soc2-tsc',
        'CC3.2',
      );

      expect(calls).toHaveLength(1);
      expect(calls[0].orgId).toBe('org-end-to-end');
      expect(calls[0].db).toBe(ctx.db);
      expect(result.status).toBe('partial');
      expect(result.reason).toBe('fixture-run');
      expect(result.evidenceRefs).toHaveLength(1);
    });
  });

  describe('registerAllEvaluators bootstrap', () => {
    it('registers the legacy SOC2 evaluators plus the full SOC2-TSC pack', () => {
      registerAllEvaluators();
      for (const key of REGISTERED_EVALUATOR_KEYS) {
        const [framework, code] = key.split('/');
        expect(
          hasEvaluator(framework as FrameworkSlug, code),
        ).toBe(true);
      }
      // Phase 2 lifts SOC2-TSC to 61 controls; the registry also
      // carries the legacy `soc2` pack and downstream packs
      // (ISO27001-2022, CIS, NIST CSF, GDPR, HIPAA, PCI-DSS).
      expect(listEvaluators().length).toBe(REGISTERED_EVALUATOR_KEYS.length);
      expect(REGISTERED_EVALUATOR_KEYS.length).toBeGreaterThanOrEqual(70);
      expect(REGISTERED_EVALUATOR_KEYS).toEqual(
        expect.arrayContaining([
          'soc2/CC6.1',
          'soc2/CC7.4',
          'soc2-tsc/CC1.1',
          'soc2-tsc/CC3.2',
          'soc2-tsc/CC2.1',
          'soc2-tsc/A1.2',
          'soc2-tsc/C1.2',
          'soc2-tsc/P8.1',
        ]),
      );
    });

    it('is idempotent on repeated invocations', () => {
      registerAllEvaluators();
      const after1 = listEvaluators().length;
      registerAllEvaluators();
      expect(listEvaluators().length).toBe(after1);
    });

    it('partitions evaluators by framework slug', () => {
      registerAllEvaluators();
      const soc2 = listEvaluators('soc2').map((m) => m.controlCode);
      const tsc = listEvaluators('soc2-tsc').map((m) => m.controlCode);
      expect(soc2.length).toBe(9);
      // SOC2-TSC pack has 61 controls (full coverage as of phase 2).
      expect(tsc.length).toBe(61);
      // The TSC pack reuses several legacy `soc2` codes (CC6.1-3, 6.6-7,
      // 7.1-4) under its own framework slug. The packs share control
      // codes by design; the (framework, code) key keeps them isolated.
      const sharedCodes = ['CC6.1', 'CC6.2', 'CC6.3', 'CC6.6', 'CC6.7', 'CC7.1', 'CC7.2', 'CC7.3', 'CC7.4'];
      for (const code of sharedCodes) {
        expect(soc2).toContain(code);
        expect(tsc).toContain(code);
      }
    });
  });
});
