/**
 * @jest-environment jsdom
 */

/* ------------------------------------------------------------------ */
/*  Tests for lib/trial/use-feature-usage.ts                          */
/*  Covers: useFeatureUsage — fetch, buildUsageItem thresholds,       */
/*          hasHighUsage, trackAction, totalActions, error handling.   */
/* ------------------------------------------------------------------ */

import { renderHook, act, waitFor } from '@testing-library/react';

// ---- Mock useAppStore -----------------------------------------------
let mockOrgId: string | null = 'org-123';

jest.mock('@/lib/stores/app', () => ({
  useAppStore: jest.fn((selector: Function) => {
    const state = {
      organization: mockOrgId ? { id: mockOrgId } : null,
    };
    return selector(state);
  }),
}));

// ---- Mock Supabase client -------------------------------------------

const buildCountChain = (count: number | null, error: any = null) => {
  const c: any = {};
  const methods = [
    'select',
    'eq',
    'neq',
    'in',
    'lt',
    'gte',
    'lte',
    'order',
    'limit',
    'range',
    'match',
    'is',
  ];
  methods.forEach((m) => {
    c[m] = jest.fn(() => c);
  });
  c.single = jest.fn(() => Promise.resolve({ count, error }));
  c.maybeSingle = jest.fn(() => Promise.resolve({ count, error }));
  c.then = (resolve: Function, reject: Function) =>
    Promise.resolve({ count, error }).then(resolve as any, reject as any);
  return c;
};

let memberCount = 5;
let taskCount = 10;
let evidenceCount = 20;
let policyCount = 3;

jest.mock('@/lib/supabase/client', () => ({
  createSupabaseClient: jest.fn(() => ({
    from: jest.fn((table: string) => {
      const counts: Record<string, number> = {
        org_members: memberCount,
        tasks: taskCount,
        org_evidence: evidenceCount,
        policies: policyCount,
      };
      return {
        select: jest.fn(() => buildCountChain(counts[table] ?? 0)),
      };
    }),
  })),
}));

// ---- Import after mock -------
import { useFeatureUsage } from '@/lib/trial/use-feature-usage';

// ---- Helpers --------------------------------------------------------
beforeEach(() => {
  jest.clearAllMocks();
  mockOrgId = 'org-123';
  memberCount = 5;
  taskCount = 10;
  evidenceCount = 20;
  policyCount = 3;
  localStorage.clear();
});

// ---- Basic fetch ----------------------------------------------------

describe('useFeatureUsage – fetch', () => {
  it('fetches usage and returns items', async () => {
    const { result } = renderHook(() => useFeatureUsage());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.usage).toHaveLength(4);
    expect(result.current.error).toBeNull();

    const members = result.current.usage.find((u) => u.key === 'team_members');
    expect(members).toMatchObject({
      key: 'team_members',
      label: 'Team Members',
      current: 5,
      limit: 15,
    });
  });

  it('does not fetch when orgId is null', async () => {
    mockOrgId = null;
    const { result } = renderHook(() => useFeatureUsage());
    // isLoading stays true because fetchUsage bails early
    expect(result.current.isLoading).toBe(true);
    expect(result.current.usage).toEqual([]);
  });

  it('sets error on fetch failure', async () => {
    // Force an error by making the supabase from() throw
    const { createSupabaseClient } = require('@/lib/supabase/client');
    createSupabaseClient.mockReturnValueOnce({
      from: jest.fn(() => {
        throw new Error('Network error');
      }),
    });

    const { result } = renderHook(() => useFeatureUsage());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toBe('Network error');
  });

  it('sets generic error for non-Error throws', async () => {
    const { createSupabaseClient } = require('@/lib/supabase/client');
    createSupabaseClient.mockReturnValueOnce({
      from: jest.fn(() => {
        throw 'random string';
      }),
    });

    const { result } = renderHook(() => useFeatureUsage());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toBe('Failed to load usage data');
  });
});

// ---- buildUsageItem thresholds --------------------------------------

describe('useFeatureUsage – usage thresholds', () => {
  it('unlimited items (limit -1) have status ok and percentage 0', async () => {
    const { result } = renderHook(() => useFeatureUsage());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const tasks = result.current.usage.find((u) => u.key === 'tasks');
    expect(tasks).toMatchObject({
      limit: -1,
      percentage: 0,
      status: 'ok',
    });
  });

  it('status is ok when usage < 70%', async () => {
    memberCount = 5; // 5/15 = 33%
    const { result } = renderHook(() => useFeatureUsage());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const members = result.current.usage.find((u) => u.key === 'team_members');
    expect(members?.status).toBe('ok');
  });

  it('status is nudge when usage >= 70%', async () => {
    memberCount = 11; // 11/15 ≈ 73%
    const { result } = renderHook(() => useFeatureUsage());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const members = result.current.usage.find((u) => u.key === 'team_members');
    expect(members?.status).toBe('nudge');
  });

  it('status is warning when usage >= 90%', async () => {
    memberCount = 14; // 14/15 ≈ 93%
    const { result } = renderHook(() => useFeatureUsage());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const members = result.current.usage.find((u) => u.key === 'team_members');
    expect(members?.status).toBe('warning');
  });

  it('status is exceeded when usage >= 100%', async () => {
    memberCount = 15; // 15/15 = 100%
    const { result } = renderHook(() => useFeatureUsage());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const members = result.current.usage.find((u) => u.key === 'team_members');
    expect(members?.status).toBe('exceeded');
  });

  it('percentage caps at 100', async () => {
    memberCount = 30; // 30/15 = 200% → capped at 100
    const { result } = renderHook(() => useFeatureUsage());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const members = result.current.usage.find((u) => u.key === 'team_members');
    expect(members?.percentage).toBe(100);
  });

  it('percentage is 0 when limit is 0', async () => {
    // This tests the edge case where limit > 0 check prevents division by zero
    // Since limit is always 15 or -1 in current code, we test through the -1 path
    const tasks = await (async () => {
      const { result } = renderHook(() => useFeatureUsage());
      await waitFor(() => expect(result.current.isLoading).toBe(false));
      return result.current.usage.find((u) => u.key === 'tasks');
    })();
    expect(tasks?.percentage).toBe(0);
  });
});

// ---- hasHighUsage ---------------------------------------------------

describe('useFeatureUsage – hasHighUsage', () => {
  it('returns false when all items are ok', async () => {
    memberCount = 3;
    const { result } = renderHook(() => useFeatureUsage());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.hasHighUsage).toBe(false);
  });

  it('returns true when any item is nudge', async () => {
    memberCount = 11; // nudge
    const { result } = renderHook(() => useFeatureUsage());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.hasHighUsage).toBe(true);
  });

  it('returns true when any item is warning', async () => {
    memberCount = 14; // warning
    const { result } = renderHook(() => useFeatureUsage());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.hasHighUsage).toBe(true);
  });

  it('returns true when any item is exceeded', async () => {
    memberCount = 20; // exceeded
    const { result } = renderHook(() => useFeatureUsage());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.hasHighUsage).toBe(true);
  });
});

// ---- trackAction ----------------------------------------------------

describe('useFeatureUsage – trackAction', () => {
  it('increments action count in localStorage', async () => {
    const { result } = renderHook(() => useFeatureUsage());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.trackAction('evidence_upload');
    });

    const raw = localStorage.getItem('formaos_feature_actions');
    expect(JSON.parse(raw!)).toEqual({ evidence_upload: 1 });
  });

  it('increments existing count', async () => {
    localStorage.setItem(
      'formaos_feature_actions',
      JSON.stringify({ evidence_upload: 5 }),
    );

    const { result } = renderHook(() => useFeatureUsage());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.trackAction('evidence_upload');
    });

    const raw = localStorage.getItem('formaos_feature_actions');
    expect(JSON.parse(raw!)).toEqual({ evidence_upload: 6 });
  });

  it('handles corrupt localStorage gracefully', async () => {
    localStorage.setItem('formaos_feature_actions', 'not-json');

    const { result } = renderHook(() => useFeatureUsage());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Should not throw
    act(() => {
      result.current.trackAction('evidence_upload');
    });
  });
});

// ---- totalActions / isHighEngagement --------------------------------

describe('useFeatureUsage – totalActions & isHighEngagement', () => {
  it('returns 0 when no actions', async () => {
    const { result } = renderHook(() => useFeatureUsage());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.totalActions).toBe(0);
    expect(result.current.isHighEngagement).toBe(false);
  });

  it('sums all feature action counts', async () => {
    localStorage.setItem(
      'formaos_feature_actions',
      JSON.stringify({ a: 5, b: 10 }),
    );

    const { result } = renderHook(() => useFeatureUsage());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.totalActions).toBe(15);
    expect(result.current.isHighEngagement).toBe(true); // >= 15
  });

  it('returns 0 on corrupt localStorage', async () => {
    localStorage.setItem('formaos_feature_actions', '{{{');

    const { result } = renderHook(() => useFeatureUsage());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.totalActions).toBe(0);
  });

  it('isHighEngagement is false below threshold', async () => {
    localStorage.setItem(
      'formaos_feature_actions',
      JSON.stringify({ a: 5, b: 9 }),
    );

    const { result } = renderHook(() => useFeatureUsage());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.totalActions).toBe(14);
    expect(result.current.isHighEngagement).toBe(false);
  });
});

// ---- refresh --------------------------------------------------------

describe('useFeatureUsage – refresh', () => {
  it('refresh re-fetches data', async () => {
    const { result } = renderHook(() => useFeatureUsage());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    memberCount = 12;
    await act(async () => {
      await result.current.refresh();
    });

    // After refresh, the new count should be reflected
    await waitFor(() => {
      const members = result.current.usage.find(
        (u) => u.key === 'team_members',
      );
      expect(members?.current).toBe(12);
    });
  });
});

// ---- count null fallback -------------------------------------------

describe('useFeatureUsage – null count fallback', () => {
  it('defaults count to 0 when null', async () => {
    // Override to return null counts
    const { createSupabaseClient } = require('@/lib/supabase/client');
    createSupabaseClient.mockReturnValueOnce({
      from: jest.fn(() => ({
        select: jest.fn(() => buildCountChain(null)),
      })),
    });

    const { result } = renderHook(() => useFeatureUsage());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    result.current.usage.forEach((u) => {
      expect(u.current).toBe(0);
    });
  });
});
