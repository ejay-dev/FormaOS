/**
 * Audit compliance-004 — phase 3.
 *
 * Coverage test for the ISO/IEC 27001:2022 Annex A evaluator pack.
 * Asserts that every control listed in framework-packs/iso27001-2022.json
 * has a corresponding evaluator registered, that every evaluator file
 * exports a default `meta` shape pointing at the right framework slug
 * and a matching control code, and that the registry contains all 93
 * controls after bootstrap.
 */

import fs from 'fs';
import path from 'path';
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

const FRAMEWORK_SLUG = 'iso27001-2022';
const PACK_PATH = path.join(
  process.cwd(),
  'framework-packs',
  'iso27001-2022.json',
);
const EVAL_DIR = path.join(
  process.cwd(),
  'lib',
  'compliance',
  'evaluators',
  'iso27001-2022',
);

type Pack = {
  framework: { slug: string };
  controls: Array<{ control_code: string }>;
};

describe('compliance-004 — ISO/IEC 27001:2022 pack coverage', () => {
  beforeEach(() => {
    clearRegistry();
    resetRegistrationState();
  });

  it('the framework pack reports 93 controls', () => {
    const pack = JSON.parse(fs.readFileSync(PACK_PATH, 'utf8')) as Pack;
    expect(pack.framework.slug).toBe(FRAMEWORK_SLUG);
    expect(pack.controls.length).toBe(93);
  });

  it('every control in the pack has an evaluator file on disk', () => {
    const pack = JSON.parse(fs.readFileSync(PACK_PATH, 'utf8')) as Pack;
    const fileSet = new Set(
      fs
        .readdirSync(EVAL_DIR)
        .filter((f) => f.endsWith('.ts') && f !== '_shared.ts')
        .map((f) => f.replace(/\.ts$/, '')),
    );
    const missing = pack.controls
      .map((c) => c.control_code)
      .filter((code) => !fileSet.has(code));
    expect(missing).toEqual([]);
  });

  it('every evaluator file exports a meta with the right framework + code', async () => {
    const files = fs
      .readdirSync(EVAL_DIR)
      .filter((f) => f.endsWith('.ts') && f !== '_shared.ts');

    for (const file of files) {
      const code = file.replace(/\.ts$/, '');
      const mod = require(`@/lib/compliance/evaluators/iso27001-2022/${code}`);
      const meta = mod.meta as ControlEvaluatorMeta | undefined;
      expect(meta).toBeDefined();
      expect(meta?.framework).toBe(FRAMEWORK_SLUG);
      expect(meta?.controlCode).toBe(code);
      expect(typeof meta?.evaluator).toBe('function');
    }
  });

  it('registerAllEvaluators wires every iso27001-2022 control', () => {
    registerAllEvaluators();
    const pack = JSON.parse(fs.readFileSync(PACK_PATH, 'utf8')) as Pack;

    const missing: string[] = [];
    for (const c of pack.controls) {
      if (!hasEvaluator(FRAMEWORK_SLUG, c.control_code)) {
        missing.push(c.control_code);
      }
    }
    expect(missing).toEqual([]);

    const registered = listEvaluators(FRAMEWORK_SLUG);
    expect(registered.length).toBe(93);

    // No accidental cross-pack registration — every entry under the
    // iso27001-2022 slug points at the iso27001-2022 framework.
    for (const m of registered) {
      expect(m.framework).toBe(FRAMEWORK_SLUG);
    }
  });

  it('control codes are partitioned across the four Annex A themes', () => {
    registerAllEvaluators();
    const codes = listEvaluators(FRAMEWORK_SLUG).map((m) => m.controlCode);

    const a5 = codes.filter((c) => c.startsWith('A.5.'));
    const a6 = codes.filter((c) => c.startsWith('A.6.'));
    const a7 = codes.filter((c) => c.startsWith('A.7.'));
    const a8 = codes.filter((c) => c.startsWith('A.8.'));

    expect(a5.length).toBe(37);
    expect(a6.length).toBe(8);
    expect(a7.length).toBe(14);
    expect(a8.length).toBe(34);
    expect(a5.length + a6.length + a7.length + a8.length).toBe(93);
  });
});
