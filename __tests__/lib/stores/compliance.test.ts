/**
 * Tests for lib/stores/compliance.ts
 * Covers: store actions, selectors, and pure utility functions.
 */

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

// ============================================================
// Pure utility functions
// ============================================================

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
  it('returns red badge classes', () => {
    const cls = ragBadgeClass('red');
    expect(cls).toContain('wire-alert');
  });

  it('returns amber badge classes', () => {
    const cls = ragBadgeClass('amber');
    expect(cls).toContain('amber');
  });

  it('returns green badge classes', () => {
    const cls = ragBadgeClass('green');
    expect(cls).toContain('wire-success');
  });
});

// ============================================================
// Store actions
// ============================================================

describe('ComplianceStore actions', () => {
  it('initializes with default state', () => {
    const state = useComplianceStore.getState();
    expect(state.obligations).toEqual([]);
    expect(state.summary.total).toBe(0);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

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
        id: '1',
        title: 'Test',
        framework: 'SOC2',
        frameworkCode: 'CC1.1',
        owner: null,
        dueDate: '2025-01-01',
        status: 'on_track' as const,
        evidenceCount: 3,
        controlKey: 'CC1.1',
      },
    ];
    useComplianceStore.getState().setObligations(obligations);
    expect(useComplianceStore.getState().obligations).toHaveLength(1);
    expect(useComplianceStore.getState().obligations[0].title).toBe('Test');
  });

  it('setDeadlines updates deadlines', () => {
    const deadlines = [
      {
        id: 'd1',
        title: 'Audit',
        dueDate: '2025-06-01',
        type: 'audit' as const,
        urgency: 'amber' as const,
      },
    ];
    useComplianceStore.getState().setDeadlines(deadlines);
    expect(useComplianceStore.getState().deadlines).toHaveLength(1);
  });

  it('setLoading updates isLoading', () => {
    useComplianceStore.getState().setLoading(true);
    expect(useComplianceStore.getState().isLoading).toBe(true);
  });

  it('setError updates error', () => {
    useComplianceStore.getState().setError('Something failed');
    expect(useComplianceStore.getState().error).toBe('Something failed');
  });
});

describe('ComplianceStore fetchSummary', () => {
  it('debounces within 30 seconds', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        total: 5,
        overdue: 1,
        dueSoon: 1,
        completed: 3,
        completionPercentage: 60,
      }),
    });
    global.fetch = fetchMock;

    // First call
    await useComplianceStore.getState().fetchSummary();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // Second call within 30s should be debounced
    await useComplianceStore.getState().fetchSummary();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('sets error on fetch failure', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
    });

    await useComplianceStore.getState().fetchSummary();
    expect(useComplianceStore.getState().error).toBeTruthy();
    expect(useComplianceStore.getState().isLoading).toBe(false);
  });

  it('sets isLoading during fetch', async () => {
    let resolvePromise: Function;
    const pending = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    global.fetch = jest.fn().mockReturnValue(pending);

    const fetchPromise = useComplianceStore.getState().fetchSummary();
    // isLoading should be true while fetching
    expect(useComplianceStore.getState().isLoading).toBe(true);

    resolvePromise!({
      ok: true,
      json: async () => ({
        total: 1,
        overdue: 0,
        dueSoon: 0,
        completed: 1,
        completionPercentage: 100,
      }),
    });

    await fetchPromise;
    expect(useComplianceStore.getState().isLoading).toBe(false);
  });
});
