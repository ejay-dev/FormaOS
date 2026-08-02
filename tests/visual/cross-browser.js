/**
 * Cross-browser visual verification wrapper.
 *
 * This replaces the old BackstopJS helper with a thin Playwright launcher
 * around the existing screenshot-capture spec.
 *
 * Audit 2026-08-03 — three defects fixed:
 *
 *  1. `generateReferences()` and `approveAll()` were aliases for
 *     `runCrossBrowserTests()`. There is no baseline store, no image diff and
 *     no approval step anywhere in this repo — playwright.capture.config.ts
 *     says the capture specs "exist to produce artefacts, not to assert
 *     pass/fail". Both functions have been REMOVED rather than left implying
 *     a reference workflow that does not exist. Nothing imported them.
 *     (package.json still aliases `test:visual:approve` and
 *     `test:visual:reference` to `npm run test:visual`; those aliases are
 *     equally misleading and should be dropped — outside this file.)
 *
 *  2. The spec path was `e2e/marketing-screenshots.spec.ts`, which does not
 *     exist — the file is `e2e/marketing-screenshots.capture.ts`, and the
 *     main playwright.config.ts only matches `**\/*.spec.ts`, so every
 *     invocation died with "no tests found". Now points at the capture file
 *     via playwright.capture.config.ts, and asserts up front that the spec
 *     is still there.
 *
 *  3. Exit status alone was the only check, so a run that matched tests but
 *     wrote no screenshots counted as success. Each project run now verifies
 *     that PNGs were actually written during that run.
 */

const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const CAPTURE_SPEC = 'e2e/marketing-screenshots.capture.ts';
const CAPTURE_CONFIG = 'playwright.capture.config.ts';
const SCREENSHOT_DIR = path.join(process.cwd(), 'screenshots', 'marketing');

const browsers = [
  { name: 'chromium', project: 'chromium' },
  { name: 'firefox', project: 'firefox' },
  { name: 'webkit', project: 'webkit' },
];

const mobileDevices = ['Mobile Chrome', 'Mobile Safari'];

function countFreshScreenshots(since) {
  if (!fs.existsSync(SCREENSHOT_DIR)) return 0;
  return fs.readdirSync(SCREENSHOT_DIR).filter((entry) => {
    if (!entry.endsWith('.png')) return false;
    const stat = fs.statSync(path.join(SCREENSHOT_DIR, entry));
    return stat.mtimeMs >= since;
  }).length;
}

function runPlaywright(project) {
  if (!fs.existsSync(path.join(process.cwd(), CAPTURE_SPEC))) {
    throw new Error(
      `Visual capture spec not found: ${CAPTURE_SPEC}. ` +
        'Update tests/visual/cross-browser.js if the spec was renamed — ' +
        'a missing spec makes Playwright exit "no tests found", not a pass.',
    );
  }

  const args = [
    'playwright',
    'test',
    '--config',
    CAPTURE_CONFIG,
    CAPTURE_SPEC,
    '--project',
    project,
    '--reporter=list',
  ];

  // 1s of slack: some filesystems report mtime at second granularity, so a
  // file written in the same second as `startedAt` must still count.
  const startedAt = Date.now() - 1000;

  const result = spawnSync('npx', args, {
    stdio: 'inherit',
    env: {
      ...process.env,
      PLAYWRIGHT_REUSE_SERVER: process.env.PLAYWRIGHT_REUSE_SERVER ?? 'true',
    },
  });

  if (result.status !== 0) {
    throw new Error(`Playwright visual verification failed for project: ${project}`);
  }

  const captured = countFreshScreenshots(startedAt);
  if (captured === 0) {
    throw new Error(
      `Playwright reported success for project "${project}" but wrote no ` +
        `screenshots to ${SCREENSHOT_DIR}. The capture ran zero routes.`,
    );
  }

  return captured;
}

async function runCrossBrowserTests() {
  const captured = {};

  for (const browser of browsers) {
    captured[browser.project] = runPlaywright(browser.project);
  }

  for (const project of mobileDevices) {
    captured[project] = runPlaywright(project);
  }

  return captured;
}

module.exports = {
  browsers,
  mobileDevices,
  runCrossBrowserTests,
  SCREENSHOT_DIR,
};

if (require.main === module) {
  runCrossBrowserTests()
    .then((captured) => {
      for (const [project, count] of Object.entries(captured)) {
        console.log(`${project}: ${count} screenshots captured`);
      }
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
