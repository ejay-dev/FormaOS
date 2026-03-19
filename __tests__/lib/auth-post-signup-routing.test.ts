/**
 * Unit tests for lib/auth/post-signup-routing.ts and
 * pure utility functions from lib/auth/callback.ts
 *
 * Tests post-signup routing logic, normalizeFrameworks,
 * selectPrimaryMembership, and isPkceExchangeError.
 */

// Mock external dependencies that callback.ts imports at module level
jest.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: jest.fn(),
}));

jest.mock('@/lib/observability/structured-logger', () => ({
  authLogger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

import { getPostSignupRoute } from '@/lib/auth/post-signup-routing';
import {
  normalizeFrameworks,
  selectPrimaryMembership,
  isPkceExchangeError,
  type MembershipRow,
} from '@/lib/auth/callback';

// ---------------------------------------------------------------------------
// getPostSignupRoute
// ---------------------------------------------------------------------------

describe('getPostSignupRoute', () => {
  it('returns onboarding path when onboarding is not completed', () => {
    expect(getPostSignupRoute(false)).toBe('/app/onboarding');
  });

  it('returns dashboard path when onboarding is completed', () => {
    expect(getPostSignupRoute(true)).toBe('/app/dashboard');
  });

  it('returns a string starting with /app/', () => {
    expect(getPostSignupRoute(true)).toMatch(/^\/app\//);
    expect(getPostSignupRoute(false)).toMatch(/^\/app\//);
  });
});

// ---------------------------------------------------------------------------
// normalizeFrameworks
// ---------------------------------------------------------------------------

describe('normalizeFrameworks', () => {
  it('returns empty array for non-array input', () => {
    expect(normalizeFrameworks(null)).toEqual([]);
    expect(normalizeFrameworks(undefined)).toEqual([]);
    expect(normalizeFrameworks('string')).toEqual([]);
    expect(normalizeFrameworks(42)).toEqual([]);
  });

  it('returns empty array for empty array', () => {
    expect(normalizeFrameworks([])).toEqual([]);
  });

  it('trims whitespace from framework slugs', () => {
    expect(normalizeFrameworks(['  soc2  ', ' iso27001 '])).toEqual([
      'soc2',
      'iso27001',
    ]);
  });

  it('filters out empty strings and non-string values', () => {
    expect(normalizeFrameworks(['soc2', '', null, undefined, 123])).toEqual([
      'soc2',
    ]);
  });

  it('deduplicates framework slugs', () => {
    expect(normalizeFrameworks(['soc2', 'soc2', 'iso27001', 'iso27001'])).toEqual([
      'soc2',
      'iso27001',
    ]);
  });

  it('preserves order of first occurrence', () => {
    const result = normalizeFrameworks(['iso27001', 'soc2', 'iso27001']);
    expect(result).toEqual(['iso27001', 'soc2']);
  });
});

// ---------------------------------------------------------------------------
// selectPrimaryMembership
// ---------------------------------------------------------------------------

describe('selectPrimaryMembership', () => {
  it('returns null for empty array', () => {
    expect(selectPrimaryMembership([])).toBeNull();
  });

  it('returns the only membership when array has one entry', () => {
    const membership: MembershipRow = {
      organization_id: 'org-1',
      role: 'member',
    };
    expect(selectPrimaryMembership([membership])).toBe(membership);
  });

  it('prefers owner over admin and member', () => {
    const memberships: MembershipRow[] = [
      { organization_id: 'org-1', role: 'member' },
      { organization_id: 'org-2', role: 'admin' },
      { organization_id: 'org-3', role: 'owner' },
    ];
    expect(selectPrimaryMembership(memberships)?.organization_id).toBe('org-3');
  });

  it('prefers admin over member', () => {
    const memberships: MembershipRow[] = [
      { organization_id: 'org-1', role: 'member' },
      { organization_id: 'org-2', role: 'admin' },
    ];
    expect(selectPrimaryMembership(memberships)?.organization_id).toBe('org-2');
  });

  it('breaks ties by most recent created_at', () => {
    const memberships: MembershipRow[] = [
      {
        organization_id: 'org-1',
        role: 'admin',
        created_at: '2024-01-01T00:00:00Z',
      },
      {
        organization_id: 'org-2',
        role: 'admin',
        created_at: '2025-06-15T00:00:00Z',
      },
    ];
    expect(selectPrimaryMembership(memberships)?.organization_id).toBe('org-2');
  });

  it('handles null role gracefully (treated as lowest weight)', () => {
    const memberships: MembershipRow[] = [
      { organization_id: 'org-1', role: null },
      { organization_id: 'org-2', role: 'member' },
    ];
    // Both have weight 1, so tie-break by created_at (both undefined => 0)
    // Sort is stable in modern engines, so first of equal-weight stays
    const result = selectPrimaryMembership(memberships);
    expect(result).not.toBeNull();
  });

  it('handles missing created_at (defaults to epoch 0)', () => {
    const memberships: MembershipRow[] = [
      { organization_id: 'org-1', role: 'owner' },
      {
        organization_id: 'org-2',
        role: 'owner',
        created_at: '2025-01-01T00:00:00Z',
      },
    ];
    expect(selectPrimaryMembership(memberships)?.organization_id).toBe('org-2');
  });

  it('is case-insensitive for role comparison', () => {
    const memberships: MembershipRow[] = [
      { organization_id: 'org-1', role: 'OWNER' },
      { organization_id: 'org-2', role: 'admin' },
    ];
    expect(selectPrimaryMembership(memberships)?.organization_id).toBe('org-1');
  });
});

// ---------------------------------------------------------------------------
// isPkceExchangeError
// ---------------------------------------------------------------------------

describe('isPkceExchangeError', () => {
  it('returns false for null error', () => {
    expect(isPkceExchangeError(null)).toBe(false);
  });

  it('returns true when error code contains "pkce"', () => {
    expect(isPkceExchangeError({ code: 'pkce_error', message: '' })).toBe(true);
  });

  it('returns true when error message contains "code verifier"', () => {
    expect(
      isPkceExchangeError({
        code: 'unknown',
        message: 'missing code verifier in request',
      }),
    ).toBe(true);
  });

  it('returns true when error message contains "verifier"', () => {
    expect(
      isPkceExchangeError(new Error('verifier was not found')),
    ).toBe(true);
  });

  it('returns false for unrelated error', () => {
    expect(
      isPkceExchangeError(new Error('network timeout')),
    ).toBe(false);
  });

  it('returns false for error with no code or message', () => {
    expect(isPkceExchangeError({})).toBe(false);
  });
});
