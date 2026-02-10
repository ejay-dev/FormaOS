/**
 * Environment Variable Validation
 *
 * This module provides runtime validation for required environment variables.
 * It should be called early in the application lifecycle to ensure all
 * required configuration is present before the application attempts to use it.
 */

export interface EnvValidationResult {
  valid: boolean;
  missing: string[];
  errors: string[];
}

/**
 * Required environment variables for Supabase authentication
 */
export const REQUIRED_SUPABASE_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
] as const;

/**
 * Required environment variables for application URLs
 */
export const REQUIRED_APP_VARS = [
  'NEXT_PUBLIC_APP_URL',
  'NEXT_PUBLIC_SITE_URL',
] as const;

/**
 * Required environment variables for founder/admin access
 */
export const REQUIRED_ADMIN_VARS = ['FOUNDER_EMAILS'] as const;

/**
 * All required environment variable names
 */
export type RequiredEnvVar =
  | (typeof REQUIRED_SUPABASE_VARS)[number]
  | (typeof REQUIRED_APP_VARS)[number]
  | (typeof REQUIRED_ADMIN_VARS)[number];

/**
 * Validate a single environment variable
 */
function validateEnvVar(name: string): { valid: boolean; error?: string } {
  const value = process.env[name];

  if (value === undefined || value === null || value === '') {
    return { valid: false, error: `${name} is not set` };
  }

  // Check for placeholder values that indicate misconfiguration
  const placeholderPatterns = [
    /^your-/i,
    /^placeholder/i,
    /^changeme/i,
    /^<.*>$/,
  ];

  for (const pattern of placeholderPatterns) {
    if (pattern.test(value)) {
      return { valid: false, error: `${name} contains a placeholder value` };
    }
  }

  return { valid: true };
}

/**
 * Validate Supabase URL format
 */
function validateSupabaseUrl(url: string): { valid: boolean; error?: string } {
  try {
    const parsed = new URL(url);

    // Supabase URLs should end with .supabase.co or .supabase-project.com
    if (
      !parsed.hostname.endsWith('.supabase.co') &&
      !parsed.hostname.endsWith('.supabase-project.com')
    ) {
      return {
        valid: false,
        error:
          'Supabase URL does not appear to be a valid Supabase project URL',
      };
    }

    return { valid: true };
  } catch {
    return { valid: false, error: 'Supabase URL is not a valid URL' };
  }
}

/**
 * Validate environment variables for Supabase configuration
 */
export function validateSupabaseConfig(): EnvValidationResult {
  const result: EnvValidationResult = {
    valid: true,
    missing: [],
    errors: [],
  };

  // Check each required variable
  for (const varName of REQUIRED_SUPABASE_VARS) {
    const validation = validateEnvVar(varName);

    if (!validation.valid) {
      result.valid = false;
      if (validation.error?.includes('not set')) {
        result.missing.push(varName);
      } else {
        result.errors.push(`${varName}: ${validation.error}`);
      }
    }
  }

  // Validate Supabase URL format
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl) {
    const urlValidation = validateSupabaseUrl(supabaseUrl);
    if (!urlValidation.valid) {
      result.valid = false;
      result.errors.push(`NEXT_PUBLIC_SUPABASE_URL: ${urlValidation.error}`);
    }
  }

  return result;
}

/**
 * Validate all required environment variables
 */
export function validateAllEnvVars(): EnvValidationResult {
  const result: EnvValidationResult = {
    valid: true,
    missing: [],
    errors: [],
  };

  const allVars = [
    ...REQUIRED_SUPABASE_VARS,
    ...REQUIRED_APP_VARS,
    ...REQUIRED_ADMIN_VARS,
  ];

  for (const varName of allVars) {
    const validation = validateEnvVar(varName);

    if (!validation.valid) {
      result.valid = false;
      if (validation.error?.includes('not set')) {
        result.missing.push(varName);
      } else {
        result.errors.push(`${varName}: ${validation.error}`);
      }
    }
  }

  // Validate Supabase URL format
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl) {
    const urlValidation = validateSupabaseUrl(supabaseUrl);
    if (!urlValidation.valid) {
      result.valid = false;
      result.errors.push(`NEXT_PUBLIC_SUPABASE_URL: ${urlValidation.error}`);
    }
  }

  return result;
}

/**
 * Validate environment and return a formatted error message
 */
export function getEnvValidationError(): string | null {
  const result = validateAllEnvVars();

  if (result.valid) {
    return null;
  }

  const parts: string[] = [];

  if (result.missing.length > 0) {
    parts.push(
      `Missing required environment variables: ${result.missing.join(', ')}`,
    );
  }

  if (result.errors.length > 0) {
    parts.push(`Configuration errors: ${result.errors.join('; ')}`);
  }

  return parts.join('\n');
}

/**
 * Check if we're in a test environment where env vars might not be set
 */
export function isTestEnvironment(): boolean {
  return (
    process.env.NODE_ENV === 'test' ||
    process.env.JEST_WORKER_ID !== undefined ||
    process.env.VITEST !== undefined ||
    process.env.PLAYWRIGHT_TEST === 'true'
  );
}

/**
 * Assert that required environment variables are set
 * Throws an error if validation fails
 */
export function assertEnvVars(): void {
  // Skip validation in test environments
  if (isTestEnvironment()) {
    return;
  }

  const error = getEnvValidationError();

  if (error) {
    throw new Error(
      `Environment validation failed:\n${error}\n\n` +
        'Please ensure all required environment variables are set in your .env.local file or deployment environment.',
    );
  }
}

/**
 * Get a summary of environment configuration (without exposing secrets)
 */
export function getEnvSummary(): Record<string, string> {
  const summary: Record<string, string> = {};

  // Add Supabase config (URL only, not keys)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl) {
    try {
      const parsed = new URL(supabaseUrl);
      summary['NEXT_PUBLIC_SUPABASE_URL'] = `https://${parsed.hostname}/...`;
    } catch {
      summary['NEXT_PUBLIC_SUPABASE_URL'] = '(invalid URL)';
    }
  } else {
    summary['NEXT_PUBLIC_SUPABASE_URL'] = '(not set)';
  }

  summary['NEXT_PUBLIC_SUPABASE_ANON_KEY'] = process.env
    .NEXT_PUBLIC_SUPABASE_ANON_KEY
    ? '(set)'
    : '(not set)';

  summary['SUPABASE_SERVICE_ROLE_KEY'] = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? '(set)'
    : '(not set)';

  // Add app URLs
  summary['NEXT_PUBLIC_APP_URL'] =
    process.env.NEXT_PUBLIC_APP_URL || '(not set)';
  summary['NEXT_PUBLIC_SITE_URL'] =
    process.env.NEXT_PUBLIC_SITE_URL || '(not set)';

  // Add founder config
  summary['FOUNDER_EMAILS'] = process.env.FOUNDER_EMAILS
    ? `(set: ${process.env.FOUNDER_EMAILS.split(',').length} email(s))`
    : '(not set)';

  return summary;
}
