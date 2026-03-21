/**
 * @jest-environment node
 */

import { mockSupabase } from '@/tests/helpers/mock-supabase';

let mockClient: ReturnType<typeof mockSupabase>['client'] & {
  auth: { getUser: jest.Mock };
};

jest.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: jest.fn(async () => mockClient),
}));

jest.mock('@/lib/observability/structured-logger', () => ({
  billingLogger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

import { verifyTrialAccess } from '@/lib/trial/verify-trial-access';

function setupClient(args: {
  user?: { id: string; email?: string | null } | null;
  userError?: { message: string } | null;
  membership?: { organization_id: string | null } | null;
  membershipError?: { message: string } | null;
  subscription?:
    | {
        status?: string | null;
        trial_expires_at?: string | null;
        trial_started_at?: string | null;
        plan_key?: string | null;
      }
    | null;
  subscriptionError?: { message: string } | null;
}) {
  const supabase = mockSupabase({
    resolver: (operation) => {
      if (operation.table === 'org_members') {
        return {
          data: args.membership ?? null,
          error: args.membershipError ?? null,
        };
      }

      if (operation.table === 'org_subscriptions') {
        return {
          data: args.subscription ?? null,
          error: args.subscriptionError ?? null,
        };
      }

      return { data: null, error: null };
    },
  });

  mockClient = {
    ...supabase.client,
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: args.user ?? null },
        error: args.userError ?? null,
      }),
    },
  };
}

describe('verifyTrialAccess', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers().setSystemTime(new Date('2026-03-21T00:00:00Z'));
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('returns not_authenticated when the user is missing', async () => {
    setupClient({ user: null });

    await expect(verifyTrialAccess()).resolves.toEqual({
      hasAccess: false,
      reason: 'not_authenticated',
    });
  });

  it('returns no_subscription when membership is missing', async () => {
    setupClient({
      user: { id: 'user-1', email: 'user@example.com' },
      membership: null,
    });

    await expect(verifyTrialAccess()).resolves.toEqual({
      hasAccess: false,
      reason: 'no_subscription',
    });
  });

  it('returns subscription_inactive for non-active subscriptions', async () => {
    setupClient({
      user: { id: 'user-1', email: 'user@example.com' },
      membership: { organization_id: 'org-1' },
      subscription: { status: 'past_due', trial_expires_at: null },
    });

    await expect(verifyTrialAccess()).resolves.toEqual({
      hasAccess: false,
      reason: 'subscription_inactive',
    });
  });

  it('returns trial_expired when a trial is in the past', async () => {
    const expiredAt = '2026-03-20T00:00:00.000Z';
    setupClient({
      user: { id: 'user-1', email: 'user@example.com' },
      membership: { organization_id: 'org-1' },
      subscription: {
        status: 'trialing',
        trial_expires_at: expiredAt,
        plan_key: 'basic',
      },
    });

    const result = await verifyTrialAccess();

    expect(result.hasAccess).toBe(false);
    expect(result.reason).toBe('trial_expired');
    expect(result.expiresAt?.toISOString()).toBe(expiredAt);
  });

  it('returns active trial metadata when the trial is still valid', async () => {
    const expiresAt = '2026-03-24T00:00:00.000Z';
    setupClient({
      user: { id: 'user-1', email: 'user@example.com' },
      membership: { organization_id: 'org-1' },
      subscription: {
        status: 'trialing',
        trial_expires_at: expiresAt,
        plan_key: 'pro',
      },
    });

    const result = await verifyTrialAccess();

    expect(result).toEqual({
      hasAccess: true,
      daysRemaining: 3,
      expiresAt: new Date(expiresAt),
    });
  });

  it('allows active paid subscriptions', async () => {
    setupClient({
      user: { id: 'user-1', email: 'user@example.com' },
      membership: { organization_id: 'org-1' },
      subscription: { status: 'active', plan_key: 'enterprise' },
    });

    await expect(verifyTrialAccess()).resolves.toEqual({
      hasAccess: true,
    });
  });

  it('returns unknown when the client throws unexpectedly', async () => {
    mockClient = {
      auth: {
        getUser: jest.fn().mockRejectedValue(new Error('boom')),
      },
      from: jest.fn(),
    } as unknown as typeof mockClient;

    await expect(verifyTrialAccess()).resolves.toEqual({
      hasAccess: false,
      reason: 'unknown',
    });
  });
});
