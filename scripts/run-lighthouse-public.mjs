#!/usr/bin/env node

import { mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const baseUrl = (process.env.LIGHTHOUSE_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
const routes = ['/', '/pricing', '/contact', '/changelog', '/security', '/trust'];
const outputDir = path.join(process.cwd(), '.lighthouseci', 'public');

mkdirSync(outputDir, { recursive: true });

const failures = [];

for (const route of routes) {
  const label = route === '/' ? 'home' : route.slice(1).replace(/\//g, '-');
  const url = `${baseUrl}${route}`;
  const outputPath = path.join(outputDir, `${label}.html`);

  console.log(`Running Lighthouse for ${url}`);
  const result = spawnSync(
    'npx',
    [
      '-y',
      'lighthouse@latest',
      url,
      '--quiet',
      '--chrome-flags=--headless=new --no-sandbox',
      '--only-categories=performance,accessibility,best-practices,seo',
      '--output=html',
      `--output-path=${outputPath}`,
    ],
    { stdio: 'inherit' },
  );

  if (result.status !== 0) {
    failures.push(route);
  }
}

if (failures.length > 0) {
  console.error(`Lighthouse failed for: ${failures.join(', ')}`);
  process.exit(1);
}

console.log(`Lighthouse reports written to ${outputDir}`);
