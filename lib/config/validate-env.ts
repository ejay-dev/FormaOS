/**
 * Environment Variable Validation
 * 
 * This module validates that all required environment variables are set
 * before the application starts. This prevents runtime errors and provides
 * clear feedback about missing configuration.
 */

type EnvValidationResult = {
  valid: boolean;
  missing: string[];
  warnings: string[];
};

const REQUIRED_ENV_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXT_PUBLIC_APP_URL',
  'NEXT_PUBLIC_SITE_URL',
] as const;

const REQUIRED_FOR_BILLING = [
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'STRIPE_PRICE_BASIC',
  'STRIPE_PRICE_PRO',
] as const;

const REQUIRED_FOR_EMAIL = [
  'RESEND_API_KEY',
  'RESEND_FROM_EMAIL',
] as const;

const REQUIRED_FOR_ADMIN = [
  'FOUNDER_EMAILS',
] as const;

function isPresent(value: string | undefined): boolean {
  return Boolean(value && value !== 'undefined' && value !== 'null' && value.trim() !== '');
}

function validateUrl(value: string | undefined, name: string): string | null {
  if (!isPresent(value)) return `${name} is not set`;
  
  try {
    const url = new URL(value!);
    
    // Check for common mistakes
    if (url.hostname.includes('vercel.app')) {
      return `${name} should not use vercel.app domain in production`;
    }
    
    if (url.hostname === 'localhost' && process.env.NODE_ENV === 'production') {
      return `${name} is set to localhost in production`;
    }
    
    return null;
  } catch {
    return `${name} is not a valid URL`;
  }
}

export function validateEnvironment(): EnvValidationResult {
  const missing: string[] = [];
  const warnings: string[] = [];

  // Check required core variables
  for (const varName of REQUIRED_ENV_VARS) {
    if (!isPresent(process.env[varName])) {
      missing.push(varName);
    }
  }

  // Validate URLs
  const appUrlError = validateUrl(process.env.NEXT_PUBLIC_APP_URL, 'NEXT_PUBLIC_APP_URL');
  if (appUrlError) warnings.push(appUrlError);

  const siteUrlError = validateUrl(process.env.NEXT_PUBLIC_SITE_URL, 'NEXT_PUBLIC_SITE_URL');
  if (siteUrlError) warnings.push(siteUrlError);

  const supabaseUrlError = validateUrl(process.env.NEXT_PUBLIC_SUPABASE_URL, 'NEXT_PUBLIC_SUPABASE_URL');
  if (supabaseUrlError) warnings.push(supabaseUrlError);

  // Check billing variables (warnings only, not blocking)
  const missingBilling = REQUIRED_FOR_BILLING.filter(v => !isPresent(process.env[v]));
  if (missingBilling.length > 0) {
    warnings.push(`Billing not configured: ${missingBilling.join(', ')}`);
  }

  // Check email variables (warnings only)
  const missingEmail = REQUIRED_FOR_EMAIL.filter(v => !isPresent(process.env[v]));
  if (missingEmail.length > 0) {
    warnings.push(`Email not configured: ${missingEmail.join(', ')}`);
  }

  // Check admin access (warnings only)
  const missingAdmin = REQUIRED_FOR_ADMIN.filter(v => !isPresent(process.env[v]));
  if (missingAdmin.length > 0) {
    warnings.push(`Admin access not configured: ${missingAdmin.join(', ')}`);
  }

  // Check for service role key exposure (critical security issue)
  if (process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY) {
    missing.push('CRITICAL: SUPABASE_SERVICE_ROLE_KEY is exposed as NEXT_PUBLIC_ variable!');
  }

  return {
    valid: missing.length === 0,
    missing,
    warnings,
  };
}

export function logEnvironmentStatus(): void {
  const result = validateEnvironment();

  if (!result.valid) {
    console.error('\n❌ ENVIRONMENT VALIDATION FAILED\n');
    console.error('Missing required environment variables:');
    result.missing.forEach(v => console.error(`  - ${v}`));
    console.error('\nPlease check .env.example for required variables.\n');
  } else {
    console.log('✅ Environment validation passed');
  }

  if (result.warnings.length > 0) {
    console.warn('\n⚠️  Environment warnings:');
    result.warnings.forEach(w => console.warn(`  - ${w}`));
    console.warn('');
  }
}

/**
 * Throws an error if environment is not valid
 * Use this in critical paths where the app cannot function without proper config
 */
export function requireValidEnvironment(): void {
  const result = validateEnvironment();
  
  if (!result.valid) {
    throw new Error(
      `Missing required environment variables:\n${result.missing.map(v => `  - ${v}`).join('\n')}\n\nSee .env.example for configuration details.`
    );
  }
}
