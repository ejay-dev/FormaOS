/** @jest-environment node */

/**
 * Acceptance tests for Blocker 4 — CI gates must block.
 *
 * These tests parse the workflow YAMLs as plain text (no yaml dependency
 * needed for the assertions we're making) and assert two properties:
 *
 *   1. The "Extended Quality Validation" job has no
 *      `continue-on-error: true` line, and neither does the
 *      "Full E2E test suite" step inside it.
 *   2. `--max-warnings` is below the legacy 350 ceiling that was
 *      hiding regressions.
 *
 * Pre-fix these tests fail. Post-fix they pass.
 */

import fs from 'fs';
import path from 'path';

const REPO_ROOT = path.resolve(__dirname, '..', '..');

function readWorkflow(name: string): string {
  return fs.readFileSync(
    path.join(REPO_ROOT, '.github', 'workflows', name),
    'utf8',
  );
}

describe('Blocker 4: CI gates must block', () => {
  describe('deployment-gates.yml', () => {
    const yaml = readWorkflow('deployment-gates.yml');

    it('does not mark the extended_quality_validation job as continue-on-error', () => {
      const jobStart = yaml.indexOf('extended_quality_validation:');
      expect(jobStart).toBeGreaterThan(-1);

      // Slice from the job header to the next top-level job header, then
      // assert no `continue-on-error: true` appears at the job level.
      // (Step-level uses are scoped further; we assert the job header
      // does not carry the bypass.)
      const slice = yaml.slice(jobStart, jobStart + 800);
      expect(slice).not.toMatch(
        /^\s{4}continue-on-error:\s*true/m,
      );
    });

    it('does not let the Full E2E test suite step swallow failures', () => {
      const stepIdx = yaml.indexOf('Full E2E test suite');
      expect(stepIdx).toBeGreaterThan(-1);
      // Bound the slice to the current step: stop at the next `- name:` so
      // we don't catch settings on the *next* step.
      const tail = yaml.slice(stepIdx);
      const nextStepIdx = tail.indexOf('- name:', 1);
      const slice = nextStepIdx > 0 ? tail.slice(0, nextStepIdx) : tail;
      // Match only YAML keys, not prose in comments that happen to use the words.
      expect(slice).not.toMatch(/^\s+continue-on-error:\s*true/m);
    });

    it('uses a tightened ESLint warning ceiling (< 350)', () => {
      const match = yaml.match(/--max-warnings\s+(\d+)/);
      expect(match).not.toBeNull();
      const value = Number(match![1]);
      expect(value).toBeLessThan(350);
    });
  });

  describe('qa-pipeline.yml', () => {
    const yaml = readWorkflow('qa-pipeline.yml');

    it('uses a tightened ESLint warning ceiling (< 350)', () => {
      const match = yaml.match(/--max-warnings\s+(\d+)/);
      expect(match).not.toBeNull();
      const value = Number(match![1]);
      expect(value).toBeLessThan(350);
    });
  });

  describe('check-env.js', () => {
    const script = fs.readFileSync(
      path.join(REPO_ROOT, 'scripts', 'check-env.js'),
      'utf8',
    );

    it('does not short-circuit strict env checks in CI by default', () => {
      // The bypass must be guarded by an explicit opt-out env var, not
      // simply by `GITHUB_ACTIONS=true`.
      expect(script).toMatch(/CHECK_ENV_SKIP_IN_CI/);

      // The pre-fix code had this exact early-exit: a strict-mode
      // GitHub-Actions short-circuit with no env-var gate. If that
      // pattern reappears verbatim, this test fails.
      expect(script).not.toMatch(
        /if\s*\(\s*strictValidation\s*&&\s*isGitHubActions\s*&&\s*!isVercelBuild\s*\)\s*\{\s*\n\s*console\.log\([^)]*Skipping strict env check/,
      );
    });
  });
});
