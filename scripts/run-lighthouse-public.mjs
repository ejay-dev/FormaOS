#!/usr/bin/env node

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const baseUrl = (process.env.LIGHTHOUSE_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
const routes = ['/', '/pricing', '/contact', '/changelog', '/security', '/trust'];
const outputDir = path.join(process.cwd(), '.lighthouseci', 'public');

mkdirSync(outputDir, { recursive: true });

const failures = [];
const summary = [];

for (const route of routes) {
  const label = route === '/' ? 'home' : route.slice(1).replace(/\//g, '-');
  const url = `${baseUrl}${route}`;
  const outputPath = path.join(outputDir, `${label}.json`);

  console.log(`Running Lighthouse for ${url}`);
  const result = spawnSync(
    'npx',
    [
      '-y',
      'lighthouse@12.8.2',
      url,
      '--quiet',
      '--chrome-flags=--headless=new --no-sandbox',
      '--only-categories=performance,accessibility,best-practices,seo',
      '--output=json',
      `--output-path=${outputPath}`,
    ],
    { stdio: 'inherit' },
  );

  if (result.status !== 0) {
    failures.push(route);
    continue;
  }

  const report = JSON.parse(readFileSync(outputPath, 'utf8'));
  const scores = Object.fromEntries(
    Object.entries(report.categories).map(([key, category]) => [
      key,
      Math.round((category.score ?? 0) * 100),
    ]),
  );
  summary.push({ route, url, ...scores });
  console.log(
    `${route}: performance ${scores.performance}, accessibility ${scores.accessibility}, best-practices ${scores['best-practices']}, seo ${scores.seo}`,
  );
}

if (failures.length > 0) {
  console.error(`Lighthouse failed for: ${failures.join(', ')}`);
  process.exit(1);
}

writeFileSync(
  path.join(outputDir, 'summary.json'),
  `${JSON.stringify({ baseUrl, generatedAt: new Date().toISOString(), routes: summary }, null, 2)}\n`,
);

console.log(`Lighthouse JSON reports written to ${outputDir}`);
