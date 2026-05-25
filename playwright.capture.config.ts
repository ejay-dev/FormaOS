/**
 * Playwright config for CAPTURE-ONLY suites — screenshot specs that
 * exist to produce artefacts, not to assert pass/fail. The main config
 * (playwright.config.ts) excludes these via testMatch, so they don't
 * inflate the default test count. This config is opt-in: it ONLY runs
 * the *.capture.ts files.
 *
 * Usage: `playwright test --config playwright.capture.config.ts ...`
 * or via the package.json scripts that target capture files directly.
 */
import { defineConfig } from '@playwright/test';
import baseConfig from './playwright.config';

export default defineConfig({
  ...baseConfig,
  testMatch: '**/*.capture.ts',
});
