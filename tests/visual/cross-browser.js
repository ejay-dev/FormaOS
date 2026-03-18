/**
 * Cross-browser visual verification wrapper.
 *
 * This replaces the old BackstopJS helper with a thin Playwright launcher
 * around the existing screenshot-capture spec.
 */

const { spawnSync } = require('node:child_process');

const browsers = [
  { name: 'chromium', project: 'chromium' },
  { name: 'firefox', project: 'firefox' },
  { name: 'webkit', project: 'webkit' },
];

const mobileDevices = ['Mobile Chrome', 'Mobile Safari'];

function runPlaywright(project) {
  const args = [
    'playwright',
    'test',
    'e2e/marketing-screenshots.spec.ts',
    '--project',
    project,
    '--reporter=list',
  ];

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
}

async function runCrossBrowserTests() {
  for (const browser of browsers) {
    runPlaywright(browser.project);
  }

  for (const project of mobileDevices) {
    runPlaywright(project);
  }
}

async function generateReferences() {
  await runCrossBrowserTests();
}

async function approveAll() {
  await runCrossBrowserTests();
}

module.exports = {
  approveAll,
  browsers,
  generateReferences,
  mobileDevices,
  runCrossBrowserTests,
};

if (require.main === module) {
  runCrossBrowserTests().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
