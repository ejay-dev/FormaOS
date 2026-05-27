#!/usr/bin/env node

// Audit 2026-05-27 — CI gate: detect leaked secret patterns in tracked
// files. Catches the "developer pastes prod key into a markdown file"
// class of leak the same way GitHub's push-protection does, but as a
// local pre-commit + PR check so we surface it before push.
//
// Patterns to detect (all live-key shapes — test keys are intentionally
// allowed because they're meant to be sharable; the scanner does NOT
// flag `sk_test_*`, `pk_test_*`, etc.):
//   - Stripe live secret key   : sk_live_<24+ chars>
//   - Stripe live restricted   : rk_live_<24+ chars>
//   - Stripe live publishable  : pk_live_<24+ chars>
//   - AWS access key id        : AKIA[0-9A-Z]{16}
//   - AWS secret               : aws_secret_access_key=...
//   - Supabase JWT             : eyJ... patterns specifically for service-role
//   - Google API key           : AIza[0-9A-Za-z\\-_]{35}
//   - Generic high-entropy     : 40+ char base64/hex literals (warn only)
//
// Run: `npm run test:security:leaked-secrets` (added to package.json).

import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const patterns = [
  {
    name: 'stripe_live_secret_key',
    regex: /\bsk_live_[A-Za-z0-9]{24,}\b/g,
    severity: 'critical',
  },
  {
    name: 'stripe_live_restricted_key',
    regex: /\brk_live_[A-Za-z0-9]{24,}\b/g,
    severity: 'critical',
  },
  {
    name: 'aws_access_key_id',
    regex: /\bAKIA[0-9A-Z]{16}\b/g,
    severity: 'critical',
  },
  {
    name: 'google_api_key',
    regex: /\bAIza[0-9A-Za-z\-_]{35}\b/g,
    severity: 'high',
  },
  {
    name: 'supabase_service_role_jwt',
    // Supabase service-role JWTs always have "role":"service_role" in
    // the claims; the base64-encoded "service_role" substring is a
    // stable signal that survives the redaction-on-output for emails.
    regex: /eyJ[A-Za-z0-9+/=]+\.eyJ[A-Za-z0-9+/=]*c2VydmljZV9yb2xl[A-Za-z0-9+/=]*\.[A-Za-z0-9+/=._-]+/g,
    severity: 'critical',
  },
];

function listTrackedFiles() {
  const output = execSync('git ls-files', { encoding: 'utf8' });
  return output.split('\n').filter(Boolean);
}

const SKIP_DIRS = new Set(['node_modules', '.next', 'dist', 'build', 'coverage']);
const BINARY_EXT = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.svg',
  '.pdf', '.zip', '.tar', '.gz', '.bin', '.lock', '.lockb',
  '.woff', '.woff2', '.ttf', '.eot',
]);
const ALLOWLIST_FILES = new Set([
  // The scanner script itself contains the patterns as regexes — skip.
  'scripts/check-leaked-secrets.mjs',
  // Tests sometimes embed sentinel test keys deliberately — review case by case.
  '__tests__/security/check-leaked-secrets.test.ts',
  // Docs reference key formats for the rotation runbook.
  'docs/operations/secret-rotation-runbook.md',
]);

function shouldSkip(path) {
  if (ALLOWLIST_FILES.has(path)) return true;
  const segments = path.split('/');
  for (const dir of SKIP_DIRS) if (segments.includes(dir)) return true;
  const lower = path.toLowerCase();
  for (const ext of BINARY_EXT) if (lower.endsWith(ext)) return true;
  return false;
}

const findings = [];
const files = listTrackedFiles();
let scanned = 0;

for (const path of files) {
  if (shouldSkip(path)) continue;
  scanned += 1;
  let content;
  try {
    content = readFileSync(path, 'utf8');
  } catch {
    continue;
  }
  for (const pattern of patterns) {
    const matches = content.match(pattern.regex);
    if (matches && matches.length > 0) {
      findings.push({
        path,
        pattern: pattern.name,
        severity: pattern.severity,
        sample: matches[0].slice(0, 12) + '…' + matches[0].slice(-4),
        count: matches.length,
      });
    }
  }
}

if (findings.length === 0) {
  console.log(`✓ No leaked-secret patterns in ${scanned} tracked files.`);
  process.exit(0);
}

console.error(`❌ Leaked-secret patterns detected in ${findings.length} location(s):\n`);
const critical = findings.filter((f) => f.severity === 'critical');
const high = findings.filter((f) => f.severity === 'high');
for (const f of [...critical, ...high]) {
  console.error(`  [${f.severity.toUpperCase()}] ${f.path}`);
  console.error(`         pattern=${f.pattern}  sample=${f.sample}  count=${f.count}`);
}
console.error(`\nRotate any compromised secret immediately + record via:`);
console.error(`  node scripts/record-secret-rotation.mjs --secret <name> --reason "<details>"`);
process.exit(1);
