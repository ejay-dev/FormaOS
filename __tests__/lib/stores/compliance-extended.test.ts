/**
 * Tests for lib/stores/compliance.ts — store actions, selectors, pure helpers
 */

// Undo global mock so we test the real store
jest.unmock('@/lib/stores/app');

import {
  useComplianceStore,
  ragFromStatus,
  ragColor,
  ragBadgeClass,
} from '@/lib/stores/compliance';

// Reset store between tests
beforeEach(() => {
  useComplianceStore.setState({
    obligations: [],
    summary: {
      total: 0,
      overdue: 0,
      dueSoon: 0,
      completed: 0,
      completionPercentage: 0,
    },
    deadlines: [],
    isLoading: false,
    error: null,
    lastFetched: null,
  });
});

describe('ComplianceStore initial state', () => {
  it('starts with empty obligations', () => {
    expect(useComplianceStore.getState().obligations).toEqual([]);
  });

  it('starts with zero summary', () => {
    const summary = useComplianceStore.getState().summary;
    expect(summary.total).toBe(0);
    expect(summary.overdue).toBe(0);
    expect(summary.completionPercentage).toBe(0);
  });

  it('starts not loading', () => {
    expect(useComplianceStore.getState().isLoading).toBe(false);
  });

  it('starts with null error', () => {
    expect(useComplianceStore.getState().error).toBeNull();
  });

  it('starts with null lastFetched', () => {
    expect(useComplianceStore.getState().lastFetched).toBeNull();
  });
});

describe('ComplianceStore actions', () => {
  it('setSummary updates summary', () => {
    const summary = {
      total: 10,
      overdue: 2,
      dueSoon: 3,
      completed: 5,
      completionPercentage: 50,
    };
    useComplianceStore.getState().setSummary(summary);
    expect(useComplianceStore.getState().summary).toEqual(summary);
  });

  it('setObligations updates obligations', () => {
    const obligations = [
      {
        id: 'o1',
        title: 'Annual Review',
        framework: 'SOC2',
        frameworkCode: 'CC1.1',
        owner: { id: 'u1', name: 'Alice' },
        dueDate: '2026-05-01',
        status: 'on_track' as const,
        evidenceCount: 3,
        controlKey: 'CC1.1',
      },
    ];
    useComplianceStore.getState().setObligations(obligations);
    expect(useComplianceStore.getState().obligations).toEqual(obligations);
  });

  it('setDeadlines updates deadlines', () => {
    const deadlines = [
      {
        id: 'd1',
        title: 'Audit',
        dueDate: '2026-06-01',
        type: 'audit' as const,
        urgency: 'green' as const,
      },
    ];
    useComplianceStore.getState().setDeadlines(deadlines);
    expect(useComplianceStore.getState().deadlines).toEqual(deadlines);
  });

  it('setLoading toggles loading state', () => {
    useComplianceStore.getState().setLoading(true);
    expect(useComplianceStore.getState().isLoading).toBe(true);
    useComplianceStore.getState().setLoading(false);
    expect(useComplianceStore.getState().isLoading).toBe(false);
  });

  it('setError sets error message', () => {
    useComplianceStore.getState().setError('Network error');
    expect(useComplianceStore.getState().error).toBe('Network error');
  });

  it('setError clears error with null', () => {
    useComplianceStore.getState().setError('err');
    useComplianceStore.getState().setError(null);
    expect(useComplianceStore.getState().error).toBeNull();
  });

  it('setSummary does not affect obligations', () => {
    const obligations = [
      {
        id: 'o1',
        title: 'T',
        framework: 'F',
        frameworkCode: 'FC',
        owner: null,
        dueDate: '2026-01-01',
        status: 'on_track' as const,
        evidenceCount: 0,
        controlKey: 'K',
      },
    ];
    useComplianceStore.getState().setObligations(obligations);
    useComplianceStore
      .getState()
      .setSummary({
        total: 5,
        overdue: 0,
        dueSoon: 0,
        completed: 5,
        completionPercentage: 100,
      });
    expect(useComplianceStore.getState().obligations).toEqual(obligations);
  });
});

describe('ComplianceStore fetchSummary', () => {
  it('debounces re-fetch within 30 seconds', async () => {
    // Set lastFetched to now
    useComplianceStore.setState({ lastFetched: Date.now() });
    const fetchMock = jest.fn();
    (global.fetch as jest.Mock) = fetchMock;

    await useComplianceStore.getState().fetchSummary();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('fetches when lastFetched is null', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        total: 10,
        overdue: 2,
        dueSoon: 3,
        completed: 5,
        completionPercentage: 50,
        obligations: [],
        deadlines: [],
      }),
    });

    await useComplianceStore.getState().fetchSummary();
    expect(useComplianceStore.getState().summary.total).toBe(10);
    expect(useComplianceStore.getState().lastFetched).not.toBeNull();
  });

  it('sets error on fetch failure', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false, status: 500 });

    await useComplianceStore.getState().fetchSummary();
    expect(useComplianceStore.getState().error).toContain('500');
    expect(useComplianceStore.getState().isLoading).toBe(false);
  });

  it('sets error on network exception', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network down'));

    await useComplianceStore.getState().fetchSummary();
    expect(useComplianceStore.getState().error).toBe('Network down');
  });

  it('defaults missing fields to 0 or empty', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });

    await useComplianceStore.getState().fetchSummary();
    const s = useComplianceStore.getState().summary;
    expect(s.total).toBe(0);
    expect(s.overdue).toBe(0);
    expect(useComplianceStore.getState().obligations).toEqual([]);
  });
});

describe('ragFromStatus', () => {
  it('returns red for overdue', () => {
    expect(ragFromStatus('overdue')).toBe('red');
  });

  it('returns amber for due_soon', () => {
    expect(ragFromStatus('due_soon')).toBe('amber');
  });

  it('returns green for completed', () => {
    expect(ragFromStatus('completed')).toBe('green');
  });

  it('returns green for on_track', () => {
    expect(ragFromStatus('on_track')).toBe('green');
  });

  it('returns amber for not_started', () => {
    expect(ragFromStatus('not_started')).toBe('amber');
  });
});

describe('ragColor', () => {
  it('returns alert color for red', () => {
    expect(ragColor('red')).toBe('var(--wire-alert)');
  });

  it('returns amber hex for amber', () => {
    expect(ragColor('amber')).toBe('#f59e0b');
  });

  it('returns success color for green', () => {
    expect(ragColor('green')).toBe('var(--wire-success)');
  });
});

describe('ragBadgeClass', () => {
  it('returns red-themed class for red', () => {
    expect(ragBadgeClass('red')).toContain('wire-alert');
  });

  it('returns amber-themed class for amber', () => {
    expect(ragBadgeClass('amber')).toContain('amber');
  });

  it('returns green-themed class for green', () => {
    expect(ragBadgeClass('green')).toContain('wire-success');
  });
});
