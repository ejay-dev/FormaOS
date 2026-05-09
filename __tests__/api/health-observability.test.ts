/**
 * @jest-environment node
 *
 * /api/health/observability returns booleans for each integration. The
 * test confirms the contract — the endpoint must NEVER leak DSN values
 * or other secret content, only presence flags.
 */

import { GET } from '@/app/api/health/observability/route';

describe('GET /api/health/observability', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    // Reset to a clean slate so tests don't leak env state.
    for (const k of Object.keys(process.env)) {
      delete process.env[k];
    }
    Object.assign(process.env, originalEnv);
  });

  it('returns 503 with detailed booleans when nothing is wired', async () => {
    delete process.env.NEXT_PUBLIC_SENTRY_DSN;
    delete process.env.SENTRY_DSN;
    delete process.env.SENTRY_ORG;
    delete process.env.SENTRY_PROJECT;
    delete process.env.NEXT_PUBLIC_POSTHOG_KEY;

    const res = await GET();
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.sentry.dsnPresent).toBe(false);
    expect(body.posthog.keyPresent).toBe(false);
  });

  it('returns 200 when Sentry + PostHog envs are set', async () => {
    process.env.NEXT_PUBLIC_SENTRY_DSN = 'https://example@sentry.io/1';
    process.env.SENTRY_DSN = 'https://example@sentry.io/1';
    process.env.SENTRY_ORG = 'formaos';
    process.env.SENTRY_PROJECT = 'web';
    process.env.NEXT_PUBLIC_POSTHOG_KEY = 'phc_test';

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.sentry.dsnPresent).toBe(true);
    expect(body.posthog.keyPresent).toBe(true);
  });

  it('never leaks DSN, key, or token values in the response', async () => {
    process.env.NEXT_PUBLIC_SENTRY_DSN = 'https://leaked@sentry.io/9999';
    process.env.SENTRY_AUTH_TOKEN = 'sntrys_LEAK_DO_NOT_RETURN_THIS';
    process.env.NEXT_PUBLIC_POSTHOG_KEY = 'phc_LEAK_DO_NOT_RETURN';

    const res = await GET();
    const text = JSON.stringify(await res.json());
    expect(text).not.toMatch(/leaked/i);
    expect(text).not.toMatch(/sntrys_/);
    expect(text).not.toMatch(/phc_/);
  });
});
