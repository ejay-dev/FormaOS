/**
 * Audit compliance-004 (2026-05-22) — phase 4 coverage assertion.
 *
 * Asserts that every control declared in the five smaller framework
 * packs (CIS Controls v8, NIST CSF 2.0, GDPR, HIPAA, PCI DSS 4.0)
 * has a registered evaluator. Catches drift between framework-pack
 * JSON manifests and the evaluators directory.
 *
 * Total expected: 18 + 15 + 10 + 10 + 11 = 64 evaluators.
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  clearRegistry,
  hasEvaluator,
  listEvaluators,
} from '@/lib/compliance/evaluators';
import {
  registerAllEvaluators,
  resetRegistrationState,
} from '@/lib/compliance/evaluators/register';
import type { FrameworkSlug } from '@/lib/compliance/evaluators/types';

type PackManifest = {
  framework: { slug: FrameworkSlug; name: string };
  controls: Array<{ control_code: string }>;
};

function loadPack(file: string): PackManifest {
  const path = resolve(process.cwd(), 'framework-packs', file);
  return JSON.parse(readFileSync(path, 'utf-8')) as PackManifest;
}

const PACKS: Array<{ file: string; slug: FrameworkSlug; expected: number }> = [
  { file: 'cis-controls.json', slug: 'cis-controls', expected: 18 },
  { file: 'nist-csf.json', slug: 'nist-csf', expected: 15 },
  { file: 'gdpr.json', slug: 'gdpr', expected: 10 },
  { file: 'hipaa.json', slug: 'hipaa', expected: 10 },
  { file: 'pci-dss.json', slug: 'pci-dss', expected: 11 },
];

describe('compliance-004 phase 4 — remaining packs evaluator coverage', () => {
  beforeAll(() => {
    clearRegistry();
    resetRegistrationState();
    registerAllEvaluators();
  });

  describe.each(PACKS)('$slug pack', ({ file, slug, expected }) => {
    const pack = loadPack(file);
    const controlCodes = pack.controls.map((c) => c.control_code);

    it(`declares ${expected} controls in the manifest`, () => {
      expect(controlCodes).toHaveLength(expected);
    });

    it('registers an evaluator for every declared control', () => {
      const missing = controlCodes.filter((code) => !hasEvaluator(slug, code));
      expect(missing).toEqual([]);
    });

    it(`registers exactly ${expected} evaluators under the ${slug} slug`, () => {
      const registered = listEvaluators(slug).map((m) => m.controlCode);
      expect(registered).toHaveLength(expected);
      // No extras outside the manifest.
      const extras = registered.filter((c) => !controlCodes.includes(c));
      expect(extras).toEqual([]);
    });
  });

  it('totals 64 evaluators across the five new packs', () => {
    const total = PACKS.reduce(
      (sum, p) => sum + listEvaluators(p.slug).length,
      0,
    );
    expect(total).toBe(64);
  });
});
