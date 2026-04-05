/**
 * Extended tests for lib/env-validation.ts — comprehensive coverage
 */

import {
  validateSupabaseConfig,
  validateAllEnvVars,
  getEnvValidationError,
  isTestEnvironment,
  assertEnvVars,
  getEnvSummary,
  REQUIRED_SUPABASE_VARS,
  REQUIRED_APP_VARS,
  REQUIRED_ADMIN_VARS,
  OPTIONAL_VALIDATED_VARS,
} from '@/lib/env-validation';

const ORIGINAL_ENV = process.env;

function setRequiredEnv(): void {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://formaos.supabase.co';
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key';
  process.env.NEXT_PUBLIC_APP_URL = 'https://app.formaos.com.au';
  process.env.NEXT_PUBLIC_SITE_URL = 'https://www.formaos.com.au';
  process.env.FOUNDER_EMAILS = 'founder@formaos.com.au';
}

beforeEach(() => {
  process.env = { ...ORIGINAL_ENV };
  setRequiredEnv();
});

afterAll(() => {
  process.env = ORIGINAL_ENV;
});

describe('constants', () => {
  it('REQUIRED_SUPABASE_VARS has expected entries', () => {
    expect(REQUIRED_SUPABASE_VARS).toContain('NEXT_PUBLIC_SUPABASE_URL');
    expect(REQUIRED_SUPABASE_VARS).toContain('NEXT_PUBLIC_SUPABASE_ANON_KEY');
    expect(REQUIRED_SUPABASE_VARS).toContain('SUPABASE_SERVICE_ROLE_KEY');
  });

  it('REQUIRED_APP_VARS has expected entries', () => {
    expect(REQUIRED_APP_VARS).toContain('NEXT_PUBLIC_APP_URL');
    expect(REQUIRED_APP_VARS).toContain('NEXT_PUBLIC_SITE_URL');
  });

  it('REQUIRED_ADMIN_VARS includes FOUNDER_EMAILS', () => {
    expect(REQUIRED_ADMIN_VARS).toContain('FOUNDER_EMAILS');
  });

  it('OPTIONAL_VALIDATED_VARS is an array', () => {
    expect(Array.isArray(OPTIONAL_VALIDATED_VARS)).toBe(true);
    expect(OPTIONAL_VALIDATED_VARS.length).toBeGreaterThan(0);
  });
});

describe('validateSupabaseConfig', () => {
  it('passes with valid Supabase config', () => {
    const result = validateSupabaseConfig();
    expect(result.valid).toBe(true);
    expect(result.missing).toHaveLength(0);
    expect(result.errors).toHaveLength(0);
  });

  it('fails when NEXT_PUBLIC_SUPABASE_URL is missing', () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    const result = validateSupabaseConfig();
    expect(result.valid).toBe(false);
    expect(result.missing).toContain('NEXT_PUBLIC_SUPABASE_URL');
  });

  it('fails when URL is a placeholder', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://your-project.supabase.co';
    const result = validateSupabaseConfig();
    expect(result.valid).toBe(false);
  });

  it('fails when URL is not a valid Supabase URL', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.com';
    const result = validateSupabaseConfig();
    expect(result.valid).toBe(false);
  });

  it('fails when URL is not a valid URL at all', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'not-a-url';
    const result = validateSupabaseConfig();
    expect(result.valid).toBe(false);
  });

  it('fails when anon key is a placeholder', () => {
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'your-anon-key-here';
    const result = validateSupabaseConfig();
    expect(result.valid).toBe(false);
  });

  it('fails when service role key is empty', () => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = '';
    const result = validateSupabaseConfig();
    expect(result.valid).toBe(false);
  });
});

describe('validateAllEnvVars', () => {
  it('passes with all required vars set', () => {
    const result = validateAllEnvVars();
    expect(result.valid).toBe(true);
  });

  it('fails when FOUNDER_EMAILS is missing', () => {
    delete process.env.FOUNDER_EMAILS;
    const result = validateAllEnvVars();
    expect(result.valid).toBe(false);
    expect(result.missing).toContain('FOUNDER_EMAILS');
  });

  it('fails when NEXT_PUBLIC_APP_URL is missing', () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    const result = validateAllEnvVars();
    expect(result.valid).toBe(false);
  });

  it('detects placeholder values like changeme', () => {
    process.env.FOUNDER_EMAILS = 'changeme';
    const result = validateAllEnvVars();
    expect(result.valid).toBe(false);
  });

  it('detects placeholder values with angle brackets', () => {
    process.env.FOUNDER_EMAILS = '<your-email>';
    const result = validateAllEnvVars();
    expect(result.valid).toBe(false);
  });

  it('fails when exposed public secret', () => {
    process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY = 'leaked-key';
    const result = validateAllEnvVars();
    expect(result.valid).toBe(false);
    expect(
      result.errors.some((e: string) =>
        e.includes('NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY'),
      ),
    ).toBe(true);
  });
});

describe('getEnvValidationError', () => {
  it('returns null when all valid', () => {
    expect(getEnvValidationError()).toBeNull();
  });

  it('returns error message with missing vars', () => {
    delete process.env.FOUNDER_EMAILS;
    const error = getEnvValidationError();
    expect(error).toContain('Missing required environment variables');
    expect(error).toContain('FOUNDER_EMAILS');
  });

  it('returns error message with configuration errors', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'not-a-url';
    const error = getEnvValidationError();
    expect(error).toContain('Configuration errors');
  });
});

describe('isTestEnvironment', () => {
  it('returns true when NODE_ENV is test', () => {
    process.env.NODE_ENV = 'test';
    expect(isTestEnvironment()).toBe(true);
  });

  it('returns true when JEST_WORKER_ID is set', () => {
    process.env.JEST_WORKER_ID = '1';
    expect(isTestEnvironment()).toBe(true);
  });
});

describe('assertEnvVars', () => {
  it('does not throw in test environment', () => {
    process.env.NODE_ENV = 'test';
    delete process.env.FOUNDER_EMAILS;
    expect(() => assertEnvVars()).not.toThrow();
  });
});

describe('getEnvSummary', () => {
  it('returns summary object', () => {
    const summary = getEnvSummary();
    expect(typeof summary).toBe('object');
    expect(summary).toHaveProperty('NEXT_PUBLIC_SUPABASE_URL');
  });

  it('masks Supabase URL', () => {
    const summary = getEnvSummary();
    expect(summary['NEXT_PUBLIC_SUPABASE_URL']).toContain('https://');
    expect(summary['NEXT_PUBLIC_SUPABASE_URL']).toContain('/...');
  });

  it('shows (set) for present keys', () => {
    const summary = getEnvSummary();
    expect(summary['NEXT_PUBLIC_SUPABASE_ANON_KEY']).toBe('(set)');
    expect(summary['SUPABASE_SERVICE_ROLE_KEY']).toBe('(set)');
  });

  it('shows (not set) for missing optional vars', () => {
    const summary = getEnvSummary();
    // At least some optional vars should be not set in test
    const optionalValues = OPTIONAL_VALIDATED_VARS.map(
      (v: string) => summary[v],
    );
    expect(optionalValues).toContain('(not set)');
  });

  it('shows FOUNDER_EMAILS count', () => {
    const summary = getEnvSummary();
    expect(summary['FOUNDER_EMAILS']).toContain('1 email(s)');
  });

  it('shows invalid: exposed when service role is public', () => {
    process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY = 'leaked';
    const summary = getEnvSummary();
    expect(summary['NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY']).toBe(
      '(invalid: exposed)',
    );
  });

  it('handles invalid URL gracefully', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'not-a-url';
    const summary = getEnvSummary();
    expect(summary['NEXT_PUBLIC_SUPABASE_URL']).toBe('(invalid URL)');
  });

  it('handles missing URL', () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    const summary = getEnvSummary();
    expect(summary['NEXT_PUBLIC_SUPABASE_URL']).toBe('(not set)');
  });
});
