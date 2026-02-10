#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Skip env checks on Vercel and GitHub Actions CI - environment is pre-validated
if (process.env.VERCEL === '1' || process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true') {
  process.exit(0);
}

const cwd = process.cwd();
const envPath = path.join(cwd, '.env.local');

const requiredKeys = [
  'NEXT_PUBLIC_APP_URL',
  'NEXT_PUBLIC_SITE_URL',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'FOUNDER_EMAILS',
];

const recommendedKeys = [
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'STRIPE_PRICE_BASIC',
  'STRIPE_PRICE_PRO',
  'STRIPE_PRICE_ENTERPRISE',
  'RESEND_API_KEY',
  'RESEND_FROM_EMAIL',
];

const parseEnvFile = (content) => {
  const entries = {};
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }
    const eqIndex = line.indexOf('=');
    if (eqIndex === -1) {
      continue;
    }
    const key = line.slice(0, eqIndex).trim();
    let value = line.slice(eqIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    entries[key] = value;
  }
  return entries;
};

if (!fs.existsSync(envPath)) {
  console.error('\nMissing .env.local.');
  console.error('Create one by copying .env.example and filling in values.');
  console.error('No secrets are logged by this check.');
  process.exit(1);
}

let fileVars = {};
try {
  fileVars = parseEnvFile(fs.readFileSync(envPath, 'utf8'));
} catch {
  console.error('\nUnable to read .env.local.');
  console.error('Check file permissions and try again.');
  process.exit(1);
}

const combinedVars = { ...fileVars, ...process.env };
const missingRequired = requiredKeys.filter((key) => !combinedVars[key]);

if (missingRequired.length > 0) {
  console.error('\nMissing required environment variables in .env.local:');
  console.error(missingRequired.map((key) => `- ${key}`).join('\n'));
  console.error('\nUpdate .env.local and re-run npm run dev.');
  process.exit(1);
}

const missingRecommended = recommendedKeys.filter((key) => !combinedVars[key]);
if (missingRecommended.length > 0) {
  console.warn(
    '\nOptional environment variables not set (dev may still work):',
  );
  console.warn(missingRecommended.map((key) => `- ${key}`).join('\n'));
}
