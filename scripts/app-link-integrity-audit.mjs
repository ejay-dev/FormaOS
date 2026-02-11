#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const APP_DIR = path.join(ROOT, 'app');
const SCAN_DIRS = ['app', 'components', 'lib'];
const REPORT_PATH = path.join(ROOT, 'APP_LINK_INTEGRITY_REPORT.md');

const SKIP_DIRS = new Set([
  '.git',
  '.next',
  'node_modules',
  'coverage',
  'playwright-report',
  'test-results',
]);

const FILE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.mdx']);

function walkFiles(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(full, out);
      continue;
    }
    if (!FILE_EXTENSIONS.has(path.extname(entry.name))) continue;
    out.push(full);
  }
  return out;
}

function normalizeRoute(route) {
  if (!route) return route;
  const withoutQuery = route.split('?')[0].split('#')[0];
  const collapsed = withoutQuery.replace(/\/+/g, '/');
  if (collapsed.length > 1 && collapsed.endsWith('/')) {
    return collapsed.slice(0, -1);
  }
  return collapsed;
}

function appPathToRoute(filePath) {
  const rel = path.relative(APP_DIR, filePath).replace(/\\/g, '/');
  const parts = rel.split('/');
  if (parts.length < 2) return null;
  const filename = parts[parts.length - 1];
  if (!filename.startsWith('page.')) return null;

  const segments = parts.slice(0, -1);
  const routeSegments = [];

  for (const segment of segments) {
    if (!segment) continue;
    if (segment.startsWith('(') && segment.endsWith(')')) continue;
    if (segment.startsWith('@')) continue;
    if (segment.startsWith('[') && segment.endsWith(']')) {
      const dynamic = segment.slice(1, -1).replace(/^\.\.\./, '...');
      routeSegments.push(`:${dynamic}`);
      continue;
    }
    routeSegments.push(segment);
  }

  const route = `/${routeSegments.join('/')}`;
  return normalizeRoute(route === '/' ? '/' : route);
}

function routePatternToRegex(routePattern) {
  const escaped = routePattern
    .split('/')
    .map((segment) => {
      if (!segment) return '';
      if (segment.startsWith(':...')) return '(.+)';
      if (segment.startsWith(':')) return '([^/]+)';
      return segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    })
    .join('/');

  return new RegExp(`^${escaped}$`);
}

const LINK_PATTERNS = [
  /href\s*=\s*["'`]([^"'`]+)["'`]/g,
  /href\s*:\s*["'`]([^"'`]+)["'`]/g,
  /router\.(?:push|replace|prefetch)\(\s*["'`]([^"'`]+)["'`]/g,
  /redirect\(\s*["'`]([^"'`]+)["'`]/g,
  /permanentRedirect\(\s*["'`]([^"'`]+)["'`]/g,
];

function extractLinks(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');
  const links = [];

  for (const pattern of LINK_PATTERNS) {
    for (const match of text.matchAll(pattern)) {
      const raw = match[1]?.trim();
      if (!raw || !raw.startsWith('/app')) continue;
      links.push(raw);
    }
  }

  return links;
}

function normalizeTarget(rawTarget) {
  let target = rawTarget;
  target = target.replace(/\$\{[^}]+\}/g, ':param');
  target = target.replace(/\/\([^/]+\)/g, '');
  return normalizeRoute(target);
}

function getAccessLevel(route) {
  if (route.startsWith('/app/admin')) return 'auth + founder/admin';
  return 'auth';
}

function buildRouteInventory() {
  const files = walkFiles(APP_DIR).filter((file) => /\/page\.[jt]sx?$/.test(file));
  const routeSet = new Set();
  for (const file of files) {
    const route = appPathToRoute(file);
    if (route) routeSet.add(route);
  }
  return Array.from(routeSet).sort();
}

function buildLinkInventory() {
  const rows = [];
  for (const dir of SCAN_DIRS) {
    const abs = path.join(ROOT, dir);
    for (const file of walkFiles(abs)) {
      const rel = path.relative(ROOT, file).replace(/\\/g, '/');
      const links = extractLinks(file);
      for (const raw of links) {
        rows.push({ source: rel, rawTarget: raw, target: normalizeTarget(raw) });
      }
    }
  }

  const uniq = new Map();
  for (const row of rows) {
    const key = `${row.source}|${row.target}`;
    if (!uniq.has(key)) uniq.set(key, row);
  }

  return Array.from(uniq.values()).sort((a, b) => {
    if (a.target === b.target) return a.source.localeCompare(b.source);
    return a.target.localeCompare(b.target);
  });
}

function resolveRoute(target, routePatterns, routeRegexMap) {
  if (!target.startsWith('/app')) return { exists: true, matchedRoute: target };

  if (routePatterns.includes(target)) {
    return { exists: true, matchedRoute: target };
  }

  for (const routePattern of routePatterns) {
    const regex = routeRegexMap.get(routePattern);
    if (regex?.test(target)) {
      return { exists: true, matchedRoute: routePattern };
    }
  }

  return { exists: false, matchedRoute: null };
}

function writeReport(routePatterns, results) {
  const broken = results.filter((row) => !row.exists);
  const total = results.length;

  const lines = [];
  lines.push('# APP Link Integrity Report');
  lines.push('');
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push('');
  lines.push('## Summary');
  lines.push('');
  lines.push(`- Total app internal links validated: ${total}`);
  lines.push(`- Valid links: ${total - broken.length}`);
  lines.push(`- Broken links: ${broken.length}`);
  lines.push(`- App routes discovered: ${routePatterns.length}`);
  lines.push('');
  lines.push('## Link Validation');
  lines.push('');
  lines.push('| Source | Target Route | Exists | Requires Auth | Requires Role | Matched Route |');
  lines.push('|---|---|---|---|---|---|');

  for (const row of results) {
    lines.push(
      `| \`${row.source}\` | \`${row.target}\` | ${row.exists ? 'YES' : 'NO'} | YES | ${row.roleRequirement} | ${row.matchedRoute ? `\`${row.matchedRoute}\`` : '-'} |`,
    );
  }

  lines.push('');
  lines.push('## App Route Inventory');
  lines.push('');
  for (const route of routePatterns) {
    lines.push(`- \`${route}\``);
  }

  fs.writeFileSync(REPORT_PATH, `${lines.join('\n')}\n`);
}

function main() {
  const routePatterns = buildRouteInventory();
  const linkRows = buildLinkInventory();
  const routeRegexMap = new Map(
    routePatterns.map((route) => [route, routePatternToRegex(route)]),
  );

  const results = linkRows.map((row) => {
    const resolution = resolveRoute(row.target, routePatterns, routeRegexMap);
    return {
      source: row.source,
      target: row.target,
      exists: resolution.exists,
      matchedRoute: resolution.matchedRoute,
      roleRequirement: getAccessLevel(row.target),
    };
  });

  writeReport(routePatterns, results);

  const broken = results.filter((row) => !row.exists);
  if (broken.length > 0) {
    console.error(`[app-link-integrity] Found ${broken.length} broken /app links`);
    for (const row of broken.slice(0, 20)) {
      console.error(`- ${row.source} -> ${row.target}`);
    }
    process.exit(1);
  }

  console.log(`[app-link-integrity] OK: ${results.length} links validated, 0 broken`);
}

main();
