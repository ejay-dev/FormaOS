/**
 * Unauthenticated API probe — hits a representative sample of sensitive
 * endpoints without any session cookie and asserts they reject the request
 * cleanly (401 / 403 / redirect) instead of leaking data.
 *
 * Fast, dependency-free: no test user, no Supabase service key. Runs against
 * whatever the PLAYWRIGHT_BASE_URL points at.
 */

import { test, expect, type APIRequestContext } from '@playwright/test';

type Probe = {
  path: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: Record<string, unknown>;
  /** Accept any status in this list. Default: 401/403/redirect-to-signin. */
  expectStatusIn?: number[];
};

/** Sensitive endpoints that should NOT return 200 without auth. */
const SENSITIVE: Probe[] = [
  { path: '/api/system-state' },
  { path: '/api/activity' },
  { path: '/api/identity/audit' },
  { path: '/api/incidents/export' },
  { path: '/api/staff-credentials/export' },
  { path: '/api/reports/export?type=soc2&mode=sync' },
  { path: '/api/v1/controls' },
  { path: '/api/v1/evidence' },
  { path: '/api/v1/audit-logs' },
  { path: '/api/v1/members' },
  { path: '/api/v1/api-keys' },
  { path: '/api/v1/integrations' },
  { path: '/api/v1/reports' },
  { path: '/api/v1/reports/custom' },
  { path: '/api/v1/soc2/readiness' },
  { path: '/api/v1/frameworks' },
  { path: '/api/executive/posture' },
  { path: '/api/executive/frameworks' },
  { path: '/api/admin/overview' },
  { path: '/api/admin/orgs' },
  { path: '/api/admin/users' },
  { path: '/api/admin/sessions' },
  { path: '/api/admin/subscriptions' },
  { path: '/api/governance/pii' },
  { path: '/api/governance/retention' },
  { path: '/api/governance/isolation' },
  { path: '/api/notifications' },
  { path: '/api/customer-health/score' },
  { path: '/api/care-operations/scorecard' },
  { path: '/api/onboarding-state' },
];

/** Public endpoints that should return 200 without auth. */
const PUBLIC: Probe[] = [
  { path: '/api/health' },
  { path: '/api/version' },
  // Vendor trust packet is intentionally public (procurement PDF, no tenant
  // data), but rate-limited to 5/10min per IP. Accept 429 when the window is
  // already saturated by a previous test / manual probe.
  { path: '/api/trust-packet/vendor', expectStatusIn: [200, 429] },
];

/** Endpoints that should enforce POST-only or similar method restrictions. */
const METHOD_GUARDED: Probe[] = [
  { path: '/api/auth/signup', method: 'GET', expectStatusIn: [400, 404, 405] },
  { path: '/api/auth/email-signup', method: 'GET', expectStatusIn: [400, 404, 405] },
  { path: '/api/notifications/channels', method: 'GET' },
];

const DEFAULT_REJECT_STATUSES = [
  301, 302, 303, 307, 308, // redirect to signin
  400, 401, 403, 404,
];

async function probe(
  request: APIRequestContext,
  p: Probe,
): Promise<{ status: number; bodyPreview: string }> {
  const method = p.method ?? 'GET';
  const res = await request.fetch(p.path, {
    method,
    data: p.body,
    maxRedirects: 0,
    failOnStatusCode: false,
  });
  const text = await res.text().catch(() => '');
  return { status: res.status(), bodyPreview: text.slice(0, 200) };
}

test.describe('API unauthenticated probe', () => {
  test('public endpoints respond 200 without auth', async ({ request }) => {
    for (const p of PUBLIC) {
      const { status } = await probe(request, p);
      const allowed = p.expectStatusIn ?? [200];
      expect(
        allowed.includes(status),
        `${p.path} public returned ${status}, expected one of ${allowed.join('/')}`,
      ).toBe(true);
    }
  });

  for (const p of SENSITIVE) {
    test(`rejects unauthenticated ${p.method ?? 'GET'} ${p.path}`, async ({
      request,
    }) => {
      const { status, bodyPreview } = await probe(request, p);
      const allowed = p.expectStatusIn ?? DEFAULT_REJECT_STATUSES;

      expect(
        allowed.includes(status),
        `${p.path} returned ${status}, expected one of ${allowed.join('/')}. Body: ${bodyPreview}`,
      ).toBe(true);

      // No sensitive data should leak on rejection
      const lower = bodyPreview.toLowerCase();
      expect(lower).not.toMatch(/service[_-]?role/);
      expect(lower).not.toMatch(/sk_live_|sk_test_/);
      expect(lower).not.toMatch(/"access_token"/);
    });
  }

  for (const p of METHOD_GUARDED) {
    test(`method guard: ${p.method ?? 'GET'} ${p.path}`, async ({
      request,
    }) => {
      const { status } = await probe(request, p);
      const allowed = p.expectStatusIn ?? DEFAULT_REJECT_STATUSES;
      expect(allowed.includes(status), `${p.path} got ${status}`).toBe(true);
    });
  }
});
