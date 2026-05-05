#!/usr/bin/env node

import pa11y from 'pa11y';
import { mkdirSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const baseUrl = (process.env.A11Y_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
const routes = (process.env.A11Y_ROUTES || '/,/pricing,/product,/security,/contact')
  .split(',')
  .map((route) => route.trim())
  .filter(Boolean);
const outputDir = path.join(process.cwd(), 'artifacts', 'qa', 'a11y');
const failures = [];
const pa11yResults = [];

mkdirSync(outputDir, { recursive: true });

function run(command, args, env = {}) {
  return spawnSync(command, args, {
    stdio: 'inherit',
    env: {
      ...process.env,
      ...env,
    },
  });
}

async function assertReachable() {
  try {
    const response = await fetch(baseUrl, {
      headers: { 'User-Agent': 'formaos-a11y-quality-gate' },
    });
    if (response.status >= 500) {
      failures.push(`${baseUrl} returned ${response.status}`);
    }
  } catch (error) {
    failures.push(
      `${baseUrl} is not reachable. Start FormaOS first or set A11Y_BASE_URL to a live deployment. ${error.message}`,
    );
  }
}

await assertReachable();
if (failures.length > 0) {
  for (const failure of failures) console.error(`FAIL ${failure}`);
  process.exit(1);
}

console.log('Running Playwright Axe accessibility smoke...');
const axe = run('npx', [
  'playwright',
  'test',
  'e2e/a11y-smoke.spec.ts',
  '--reporter=list',
  '--workers=1',
], {
  PLAYWRIGHT_BASE_URL: baseUrl,
  PW_SKIP_WEBSERVER: '1',
});
if (axe.status !== 0) failures.push(`Axe/Playwright exited with ${axe.status}`);

for (const route of routes) {
  const url = `${baseUrl}${route === '/' ? '' : route}`;
  console.log(`Running Pa11y for ${url}`);
  try {
    const result = await pa11y(url, {
      standard: 'WCAG2AA',
      level: 'error',
      timeout: 30000,
      wait: 1000,
      chromeLaunchConfig: {
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      },
    });
    pa11yResults.push(result);
    const errors = result.issues.filter((issue) => issue.type === 'error');
    if (errors.length > 0) {
      failures.push(`Pa11y found ${errors.length} error(s) on ${url}`);
    }
  } catch (error) {
    failures.push(`Pa11y failed for ${url}: ${error.message}`);
  }
}

writeFileSync(
  path.join(outputDir, 'pa11y.json'),
  `${JSON.stringify({ generatedAt: new Date().toISOString(), baseUrl, routes, pa11yResults }, null, 2)}\n`,
);

console.log('Running Lighthouse public route audit...');
const lighthouse = run('npm', ['run', 'test:lighthouse:public'], {
  LIGHTHOUSE_BASE_URL: baseUrl,
});
if (lighthouse.status !== 0) failures.push(`Lighthouse exited with ${lighthouse.status}`);

if (failures.length > 0) {
  console.error('A11y quality gate failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`A11y quality gate passed. Pa11y report written to ${outputDir}`);
