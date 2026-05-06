#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const strictValidation =
  process.env.STRICT_ENV_VALIDATION === 'true' ||
  process.env.CHECK_ENV_STRICT === '1';
const envProfile = process.env.CHECK_ENV_PROFILE || 'development';
const isVercelBuild = process.env.VERCEL === '1';
const isGitHubActions = process.env.GITHUB_ACTIONS === 'true';
const isSecretManagerRuntime =
  isVercelBuild || process.env.CI === 'true' || isGitHubActions;

// In GitHub Actions CI (not a Vercel build), skip all strict env checks.
// Production secrets live in Vercel's environment — Vercel validates them
// during its own build. CI runners don't have (and shouldn't need) those secrets.
if (strictValidation && isGitHubActions && !isVercelBuild) {
  console.log(
    'ℹ️  Skipping strict env check in GitHub Actions CI — validated by Vercel at build time.',
  );
  process.exit(0);
}

// Skip non-strict env checks on managed runtimes. Strict/profile checks are
// intentionally evaluated against process.env so CI/Vercel secrets cannot drift silently.
if (
  !strictValidation &&
  envProfile === 'development' &&
  isSecretManagerRuntime
) {
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

const productionRequiredKeys = [
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'STRIPE_PRICE_FOUNDATION',
  'STRIPE_PRICE_GROWTH',
  'STRIPE_PRICE_SCALE',
  'RESEND_API_KEY',
  'RESEND_FROM_EMAIL',
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
  'CRON_SECRET',
  'HEALTH_DETAILED_FOUNDER_TOKEN',
  'NEXT_PUBLIC_SENTRY_DSN',
  'SENTRY_AUTH_TOKEN',
  'SENTRY_ORG',
  'SENTRY_PROJECT',
];

const recommendedKeys = [
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'STRIPE_PRICE_FOUNDATION',
  'STRIPE_PRICE_GROWTH',
  'STRIPE_PRICE_SCALE',
  'RESEND_API_KEY',
  'RESEND_FROM_EMAIL',
];

const forbiddenPublicKeys = [
  'NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY',
  'NEXT_PUBLIC_STRIPE_SECRET_KEY',
  'NEXT_PUBLIC_STRIPE_WEBHOOK_SECRET',
  'NEXT_PUBLIC_UPSTASH_REDIS_REST_TOKEN',
  'NEXT_PUBLIC_SENTRY_AUTH_TOKEN',
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

if (!fs.existsSync(envPath) && !isSecretManagerRuntime) {
  console.error('\nMissing .env.local.');
  console.error('Create one by copying .env.example and filling in values.');
  console.error('No secrets are logged by this check.');
  process.exit(1);
}

let fileVars = {};
try {
  fileVars = fs.existsSync(envPath)
    ? parseEnvFile(fs.readFileSync(envPath, 'utf8'))
    : {};
} catch {
  console.error('\nUnable to read .env.local.');
  console.error('Check file permissions and try again.');
  process.exit(1);
}

const combinedVars = { ...fileVars, ...process.env };
const activeRequiredKeys =
  envProfile === 'production'
    ? [...requiredKeys, ...productionRequiredKeys]
    : requiredKeys;
const missingRequired = activeRequiredKeys.filter((key) => !combinedVars[key]);
const exposedPublicSecrets = forbiddenPublicKeys.filter(
  (key) => !!combinedVars[key],
);

if (missingRequired.length > 0 || exposedPublicSecrets.length > 0) {
  console.error('\nMissing required environment variables in .env.local:');
  if (missingRequired.length > 0) {
    console.error(missingRequired.map((key) => `- ${key}`).join('\n'));
  }
  if (exposedPublicSecrets.length > 0) {
    console.error('\nForbidden public secrets detected:');
    console.error(exposedPublicSecrets.map((key) => `- ${key}`).join('\n'));
  }
  console.error(
    isSecretManagerRuntime
      ? '\nUpdate managed environment secrets and re-run this check.'
      : '\nUpdate .env.local and re-run npm run dev.',
  );
  process.exit(1);
}

const isPlaceholder = (value) => {
  if (!value) return false;
  const normalized = String(value).trim().toLowerCase();
  return (
    normalized.startsWith('your-') ||
    normalized.includes('your-project') ||
    normalized.includes('your-instance') ||
    normalized.startsWith('placeholder') ||
    normalized.startsWith('changeme') ||
    normalized.includes('replace-me') ||
    normalized.includes('example.com') ||
    /^<.*>$/.test(normalized)
  );
};

const invalidRequired = requiredKeys.filter((key) => {
  const value = combinedVars[key];
  if (!value) return false;
  if (!isPlaceholder(value)) return false;
  return true;
});

const supabaseUrl = combinedVars.NEXT_PUBLIC_SUPABASE_URL;
let invalidSupabaseUrl = false;
if (supabaseUrl) {
  try {
    const parsed = new URL(supabaseUrl);
    const host = parsed.hostname.toLowerCase();
    invalidSupabaseUrl =
      host.startsWith('your-') ||
      host.includes('your-project') ||
      !(
        host.endsWith('.supabase.co') || host.endsWith('.supabase-project.com')
      );
  } catch {
    invalidSupabaseUrl = true;
  }
}

if (invalidRequired.length > 0 || invalidSupabaseUrl) {
  const logger = strictValidation ? console.error : console.warn;

  logger('\nInvalid placeholder environment variables detected:');
  if (invalidRequired.length > 0) {
    logger(invalidRequired.map((key) => `- ${key}`).join('\n'));
  }
  if (invalidSupabaseUrl) {
    logger('- NEXT_PUBLIC_SUPABASE_URL');
  }
  logger('\nReplace placeholder values with real environment values.');

  if (strictValidation) {
    process.exit(1);
  }
}

const missingRecommended =
  envProfile === 'production'
    ? []
    : recommendedKeys.filter((key) => !combinedVars[key]);
if (missingRecommended.length > 0) {
  console.warn(
    '\nOptional environment variables not set (dev may still work):',
  );
  console.warn(missingRecommended.map((key) => `- ${key}`).join('\n'));
}
