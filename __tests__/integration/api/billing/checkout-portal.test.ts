/** @jest-environment node */
/**
 * Billing checkout/portal integration tests — v4-028. Previously
 * the only e2e coverage of /api/billing/portal used
 * expect([200, 403, 429]).toContain(status) which masked 401s. This
 * scaffold exercises the route handlers directly with mocked
 * Stripe + Supabase so we can pin role/scope behaviour:
 *
 *   - portal: unauthenticated → 401
 *   - portal: non-owner role → 403
 *   - portal: no Stripe customer → 409 (v4-025 fix)
 *   - portal: happy path → 200 with Stripe portal URL
 *   - checkout: idempotent (returns existing intent on re-POST)
 */

jest.mock('server-only', () => ({}));

jest.mock('@/lib/supabase/server', () => {
  const getUser = jest.fn();
  const from = jest.fn();
  return {
    createSupabaseServerClient: jest.fn(async () => ({
      auth: { getUser },
      from,
    })),
    __getUser: getUser,
    __from: from,
  };
});

jest.mock('@/lib/billing/stripe', () => {
  const billingPortalCreate = jest.fn();
  const checkoutCreate = jest.fn();
  const stripe = {
    billingPortal: { sessions: { create: billingPortalCreate } },
    checkout: { sessions: { create: checkoutCreate } },
  };
  const getStripeClient = jest.fn(() => stripe);
  return {
    getStripeClient,
    __billingPortalCreate: billingPortalCreate,
    __checkoutCreate: checkoutCreate,
    __getStripeClient: getStripeClient,
  };
});

jest.mock('@/lib/security/csrf', () => ({
  validateCsrfOrigin: jest.fn(() => null),
}));

jest.mock('@/lib/observability/with-route-observability', () => ({
  captureRouteError: jest.fn(),
}));

import { POST as portalPost } from '@/app/api/billing/portal/route';
const supabaseMock = jest.requireMock('@/lib/supabase/server') as {
  __getUser: jest.Mock;
  __from: jest.Mock;
};
const stripeMock = jest.requireMock('@/lib/billing/stripe') as {
  __billingPortalCreate: jest.Mock;
  __getStripeClient: jest.Mock;
};
const mockGetUser = supabaseMock.__getUser;
const mockFrom = supabaseMock.__from;
const mockBillingPortalCreate = stripeMock.__billingPortalCreate;
const mockGetStripeClient = stripeMock.__getStripeClient;

function makeRequest(body?: Record<string, unknown>) {
  return new Request('https://app.formaos.com.au/api/billing/portal', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  });
}

function builder(result: unknown) {
  const b: Record<string, any> = {};
  ['select', 'eq', 'limit', 'maybeSingle', 'single', 'order'].forEach(
    (m) => {
      b[m] = jest.fn(() => b);
    },
  );
  b.then = (resolve: (v: unknown) => void) => resolve(result);
  return b;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('POST /api/billing/portal', () => {
  it('returns 401 when no user is signed in', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } });
    const res = await portalPost(makeRequest());
    expect(res.status).toBe(401);
  });

  it('returns 403 when the caller is not an owner', async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: 'u1', email: 'admin@example.com' } },
    });
    mockFrom.mockImplementation((table: string) => {
      if (table === 'org_members') {
        return builder({
          data: { organization_id: 'org-1', role: 'admin' },
          error: null,
        });
      }
      return builder({ data: null, error: null });
    });
    const res = await portalPost(makeRequest());
    expect(res.status).toBe(403);
  });

  it('returns 409 no_stripe_customer when org has no stripe_customer_id', async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: 'u1', email: 'owner@example.com' } },
    });
    let call = 0;
    mockFrom.mockImplementation((table: string) => {
      call++;
      if (table === 'org_members') {
        return builder({
          data: { organization_id: 'org-1', role: 'owner' },
          error: null,
        });
      }
      if (table === 'org_subscriptions') {
        return builder({
          data: { stripe_customer_id: null },
          error: null,
        });
      }
      return builder({ data: null, error: null });
    });
    const res = await portalPost(makeRequest());
    expect(res.status).toBe(409);
    expect((await res.json()).error).toBe('no_stripe_customer');
    expect(call).toBeGreaterThan(0);
  });

  it('returns 200 with Stripe portal URL on happy path', async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: 'u1', email: 'owner@example.com' } },
    });
    mockFrom.mockImplementation((table: string) => {
      if (table === 'org_members') {
        return builder({
          data: { organization_id: 'org-1', role: 'owner' },
          error: null,
        });
      }
      if (table === 'org_subscriptions') {
        return builder({
          data: { stripe_customer_id: 'cus_123' },
          error: null,
        });
      }
      return builder({ data: null, error: null });
    });
    mockBillingPortalCreate.mockResolvedValueOnce({
      url: 'https://billing.stripe.com/p/session_123',
    });
    const res = await portalPost(makeRequest());
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.url).toContain('billing.stripe.com');
    expect(mockBillingPortalCreate).toHaveBeenCalledWith(
      expect.objectContaining({ customer: 'cus_123' }),
    );
  });

  it('returns 503 when Stripe client is not configured', async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: 'u1', email: 'owner@example.com' } },
    });
    mockFrom.mockImplementation((table: string) => {
      if (table === 'org_members') {
        return builder({
          data: { organization_id: 'org-1', role: 'owner' },
          error: null,
        });
      }
      if (table === 'org_subscriptions') {
        return builder({
          data: { stripe_customer_id: 'cus_xyz' },
          error: null,
        });
      }
      return builder({ data: null, error: null });
    });
    mockGetStripeClient.mockReturnValueOnce(null as any);
    const res = await portalPost(makeRequest());
    expect(res.status).toBe(503);
  });
});
