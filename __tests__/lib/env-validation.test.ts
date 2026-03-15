/** @jest-environment node */

import {
  getEnvSummary,
  validateAllEnvVars,
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

describe('env validation', () => {
  it('fails validation when the service role key is exposed as NEXT_PUBLIC_', () => {
    process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY = 'leaked-service-role';

    const result = validateAllEnvVars();

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining(
          'NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY',
        ),
      ]),
    );
  });

  it('surfaces the exposed public secret in the env summary', () => {
    process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY = 'leaked-service-role';

    const summary = getEnvSummary();

    expect(summary.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY).toBe(
      '(invalid: exposed)',
    );
  });
});
