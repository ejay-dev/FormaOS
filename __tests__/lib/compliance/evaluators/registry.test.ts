import {
  clearRegistry,
  evaluateControl,
  getEvaluator,
  hasEvaluator,
  listEvaluators,
  registerEvaluator,
} from '@/lib/compliance/evaluators';
import type {
  ControlEvaluator,
  ControlEvaluatorContext,
  ControlResult,
} from '@/lib/compliance/evaluators';

const makeCtx = (orgId = 'org-123'): ControlEvaluatorContext => ({
  orgId,
  db: {} as ControlEvaluatorContext['db'],
});

const passEvaluator: ControlEvaluator = async () => ({
  controlCode: 'CC6.1',
  status: 'pass',
  evidenceRefs: [{ source: 'test', ref: 'fixture' }],
  gaps: [],
  confidence: 0.95,
  evaluatedAt: new Date().toISOString(),
});

describe('compliance evaluator registry', () => {
  beforeEach(() => {
    clearRegistry();
  });

  it('registers and retrieves an evaluator by framework + code', () => {
    registerEvaluator({
      framework: 'soc2',
      controlCode: 'CC6.1',
      evaluator: passEvaluator,
    });
    expect(hasEvaluator('soc2', 'CC6.1')).toBe(true);
    expect(getEvaluator('soc2', 'CC6.1')).toBe(passEvaluator);
  });

  it('returns null when looking up an unregistered evaluator', () => {
    expect(hasEvaluator('soc2', 'CC9.99')).toBe(false);
    expect(getEvaluator('soc2', 'CC9.99')).toBeNull();
  });

  it('namespaces evaluators per framework so codes can collide across frameworks', () => {
    const isoEvaluator: ControlEvaluator = async () => ({
      controlCode: 'A.5.1',
      status: 'partial',
      evidenceRefs: [],
      gaps: [],
      confidence: 0.5,
      evaluatedAt: new Date().toISOString(),
    });
    registerEvaluator({
      framework: 'soc2',
      controlCode: 'A.5.1',
      evaluator: passEvaluator,
    });
    registerEvaluator({
      framework: 'iso27001',
      controlCode: 'A.5.1',
      evaluator: isoEvaluator,
    });
    expect(getEvaluator('soc2', 'A.5.1')).toBe(passEvaluator);
    expect(getEvaluator('iso27001', 'A.5.1')).toBe(isoEvaluator);
  });

  it('listEvaluators filters by framework when given one', () => {
    registerEvaluator({
      framework: 'soc2',
      controlCode: 'CC6.1',
      evaluator: passEvaluator,
    });
    registerEvaluator({
      framework: 'iso27001',
      controlCode: 'A.8.1',
      evaluator: passEvaluator,
    });
    expect(listEvaluators().length).toBe(2);
    expect(listEvaluators('soc2').map((m) => m.controlCode)).toEqual(['CC6.1']);
    expect(listEvaluators('iso27001').map((m) => m.controlCode)).toEqual([
      'A.8.1',
    ]);
  });

  it('evaluateControl runs the registered evaluator', async () => {
    registerEvaluator({
      framework: 'soc2',
      controlCode: 'CC6.1',
      evaluator: passEvaluator,
    });
    const result = await evaluateControl('soc2', 'CC6.1', makeCtx());
    expect(result.status).toBe('pass');
    expect(result.controlCode).toBe('CC6.1');
    expect(result.confidence).toBeGreaterThan(0.9);
  });

  it('evaluateControl returns not_evaluated for unregistered controls (never PASS by default)', async () => {
    const result: ControlResult = await evaluateControl(
      'soc2',
      'CC9.99',
      makeCtx(),
    );
    expect(result.status).toBe('not_evaluated');
    expect(result.confidence).toBe(0);
    expect(result.reason).toMatch(/no evaluator/i);
  });
});
