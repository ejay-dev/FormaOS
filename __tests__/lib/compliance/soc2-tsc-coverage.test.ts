/**
 * Audit compliance-004 (2026-05-22) — phase 2.
 *
 * Coverage gate for the SOC2-TSC framework pack:
 *  - every control declared in framework-packs/soc2-tsc.json must have
 *    a registered evaluator (or this test fails naming the missing
 *    control codes — so a future control-pack edit cannot silently
 *    drop automated coverage)
 *  - every registered SOC2-TSC evaluator file exports a default
 *    `evaluate` function plus `meta` of the expected shape
 *
 * Per-evaluator unit testing is covered by the framework runner test
 * (`evaluator-framework.test.ts`) plus the legacy `__tests__/.../soc2`
 * suite — this test is purely a coverage gate.
 */

import fs from 'node:fs';
import path from 'node:path';

import {
  clearRegistry,
  hasEvaluator,
  listEvaluators,
} from '@/lib/compliance/evaluators';
import {
  registerAllEvaluators,
  resetRegistrationState,
} from '@/lib/compliance/evaluators/register';
import type { ControlEvaluatorMeta } from '@/lib/compliance/evaluators/types';

type ControlEntry = {
  control_code: string;
  domain?: string;
};

type FrameworkPack = {
  framework?: { slug?: string };
  controls: ControlEntry[];
};

const PACK_PATH = path.resolve(
  __dirname,
  '..',
  '..',
  '..',
  'framework-packs',
  'soc2-tsc.json',
);

function loadPack(): FrameworkPack {
  const raw = fs.readFileSync(PACK_PATH, 'utf8');
  return JSON.parse(raw) as FrameworkPack;
}

describe('SOC2-TSC pack — automated-evaluator coverage gate', () => {
  beforeEach(() => {
    clearRegistry();
    resetRegistrationState();
    registerAllEvaluators();
  });

  it('declares the soc2-tsc framework slug', () => {
    const pack = loadPack();
    expect(pack.framework?.slug).toBe('soc2-tsc');
  });

  it('has a registered evaluator for every control in the pack', () => {
    const pack = loadPack();
    expect(pack.controls.length).toBeGreaterThan(0);

    const missing = pack.controls
      .map((c) => c.control_code)
      .filter((code) => !hasEvaluator('soc2-tsc', code));

    if (missing.length > 0) {
      throw new Error(
        `SOC2-TSC pack has ${pack.controls.length} controls but the following ${missing.length} are not registered: ${missing.join(', ')}. Add evaluators in lib/compliance/evaluators/soc2-tsc/ and wire them through register.ts.`,
      );
    }

    expect(missing).toEqual([]);
  });

  it('matches the pack control count exactly (no extras, no gaps)', () => {
    const pack = loadPack();
    const tsc = listEvaluators('soc2-tsc');
    const registered = new Set(tsc.map((m) => m.controlCode));
    const declared = new Set(pack.controls.map((c) => c.control_code));

    const extras = [...registered].filter((c) => !declared.has(c));
    const gaps = [...declared].filter((c) => !registered.has(c));

    expect({ extras, gaps }).toEqual({ extras: [], gaps: [] });
    expect(tsc.length).toBe(pack.controls.length);
  });

  it('each registered SOC2-TSC evaluator carries a callable evaluate function', () => {
    const tsc = listEvaluators('soc2-tsc');
    expect(tsc.length).toBeGreaterThanOrEqual(60);
    for (const meta of tsc) {
      assertWellFormedMeta(meta);
    }
  });
});

function assertWellFormedMeta(meta: ControlEvaluatorMeta): void {
  expect(meta).toBeDefined();
  expect(meta.framework).toBe('soc2-tsc');
  expect(typeof meta.controlCode).toBe('string');
  expect(meta.controlCode.length).toBeGreaterThan(0);
  expect(typeof meta.evaluator).toBe('function');
}
