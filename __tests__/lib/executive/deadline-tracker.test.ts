import {
  getDeadlines,
  createDeadline,
  updateDeadlineStatus,
  getDeadlineSummary,
  getActionRequiredDeadlines,
} from '@/lib/executive/deadline-tracker';

jest.mock('@/lib/supabase/schema-compat', () => ({
  isMissingSupabaseTableError: jest.fn(() => false),
}));

const mockQuery: any = {};

function resetMock() {
  mockQuery.from = jest.fn().mockReturnValue(mockQuery);
  mockQuery.select = jest.fn().mockReturnValue(mockQuery);
  mockQuery.insert = jest.fn().mockReturnValue(mockQuery);
  mockQuery.update = jest.fn().mockReturnValue(mockQuery);
  mockQuery.eq = jest.fn().mockReturnValue(mockQuery);
  mockQuery.in = jest.fn().mockReturnValue(mockQuery);
  mockQuery.not = jest.fn().mockReturnValue(mockQuery);
  mockQuery.neq = jest.fn().mockReturnValue(mockQuery);
  mockQuery.gte = jest.fn().mockReturnValue(mockQuery);
  mockQuery.lte = jest.fn().mockReturnValue(mockQuery);
  mockQuery.order = jest.fn().mockReturnValue(mockQuery);
  mockQuery.limit = jest.fn().mockReturnValue(mockQuery);
  mockQuery.range = jest.fn().mockReturnValue(mockQuery);
  mockQuery.single = jest.fn().mockReturnValue(mockQuery);
  mockQuery.then = jest.fn((resolve: any) =>
    resolve({ data: [], error: null, count: 0 }),
  );
}

jest.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: () => mockQuery,
}));

describe('getDeadlines', () => {
  beforeEach(resetMock);

  it('returns empty when no deadlines exist', async () => {
    mockQuery.then = jest.fn((resolve: any) =>
      resolve({ data: [], error: null, count: 0 }),
    );
    const result = await getDeadlines('org-1');
    expect(result).toEqual({ deadlines: [], total: 0 });
  });

  it('derives priority and status from due dates', async () => {
    const futureDate = new Date(
      Date.now() + 20 * 24 * 60 * 60 * 1000,
    ).toISOString();
    const soonDate = new Date(
      Date.now() + 3 * 24 * 60 * 60 * 1000,
    ).toISOString();
    const pastDate = new Date(
      Date.now() - 5 * 24 * 60 * 60 * 1000,
    ).toISOString();

    mockQuery.then = jest.fn((resolve: any) =>
      resolve({
        data: [
          {
            id: '1',
            title: 'Future',
            due_date: futureDate,
            deadline_type: 'audit',
            status: 'upcoming',
          },
          {
            id: '2',
            title: 'Soon',
            due_date: soonDate,
            deadline_type: 'renewal',
            status: 'upcoming',
          },
          {
            id: '3',
            title: 'Past',
            due_date: pastDate,
            deadline_type: 'review',
            status: 'upcoming',
          },
        ],
        error: null,
        count: 3,
      }),
    );

    const result = await getDeadlines('org-1');
    expect(result.deadlines.length).toBe(3);

    const future = result.deadlines.find((d) => d.id === '1');
    expect(future!.priority).toBe('medium');
    expect(future!.status).toBe('upcoming');

    const soon = result.deadlines.find((d) => d.id === '2');
    expect(soon!.priority).toBe('critical');
    expect(soon!.status).toBe('due_soon');

    const past = result.deadlines.find((d) => d.id === '3');
    expect(past!.status).toBe('overdue');
  });

  it('preserves completed/cancelled status', async () => {
    mockQuery.then = jest.fn((resolve: any) =>
      resolve({
        data: [
          {
            id: '1',
            title: 'Done',
            due_date: new Date().toISOString(),
            deadline_type: 'audit',
            status: 'completed',
          },
          {
            id: '2',
            title: 'Cancelled',
            due_date: new Date().toISOString(),
            deadline_type: 'review',
            status: 'cancelled',
          },
        ],
        error: null,
        count: 2,
      }),
    );

    const result = await getDeadlines('org-1');
    expect(result.deadlines[0].status).toBe('completed');
    expect(result.deadlines[1].status).toBe('cancelled');
  });

  it('returns gracefully when table is missing', async () => {
    const {
      isMissingSupabaseTableError,
    } = require('@/lib/supabase/schema-compat');
    isMissingSupabaseTableError.mockReturnValue(true);
    mockQuery.then = jest.fn((resolve: any) =>
      resolve({
        data: null,
        error: { message: 'relation does not exist' },
        count: null,
      }),
    );

    const result = await getDeadlines('org-1');
    expect(result).toEqual({ deadlines: [], total: 0 });
  });
});

describe('createDeadline', () => {
  beforeEach(resetMock);

  it('inserts and returns ok with id', async () => {
    mockQuery.then = jest.fn((resolve: any) =>
      resolve({ data: { id: 'dl-123' }, error: null }),
    );

    const result = await createDeadline('org-1', {
      title: 'SOC 2 Audit',
      dueDate: '2025-06-01',
      type: 'audit' as any,
    });

    expect(result).toEqual({ ok: true, id: 'dl-123' });
    expect(mockQuery.from).toHaveBeenCalledWith('org_compliance_deadlines');
  });

  it('returns error on insert failure', async () => {
    mockQuery.then = jest.fn((resolve: any) =>
      resolve({ data: null, error: { message: 'insert failed' } }),
    );

    const result = await createDeadline('org-1', {
      title: 'Test',
      dueDate: '2025-06-01',
      type: 'review' as any,
    });

    expect(result.ok).toBe(false);
    expect(result.error).toBe('insert failed');
  });
});

describe('updateDeadlineStatus', () => {
  beforeEach(resetMock);

  it('updates successfully', async () => {
    mockQuery.then = jest.fn((resolve: any) =>
      resolve({ data: null, error: null }),
    );

    const result = await updateDeadlineStatus(
      'org-1',
      'dl-1',
      'completed' as any,
    );
    expect(result).toEqual({ ok: true });
  });

  it('returns error on failure', async () => {
    mockQuery.then = jest.fn((resolve: any) =>
      resolve({ data: null, error: { message: 'update failed' } }),
    );

    const result = await updateDeadlineStatus(
      'org-1',
      'dl-1',
      'completed' as any,
    );
    expect(result.ok).toBe(false);
    expect(result.error).toBe('update failed');
  });
});

describe('getDeadlineSummary', () => {
  beforeEach(resetMock);

  it('returns zero counts with no deadlines', async () => {
    mockQuery.then = jest.fn((resolve: any) =>
      resolve({ data: [], error: null }),
    );

    const result = await getDeadlineSummary('org-1');
    expect(result.total).toBe(0);
    expect(result.overdue).toBe(0);
    expect(result.dueSoon).toBe(0);
    expect(result.upcoming).toBe(0);
  });

  it('categorizes deadlines by status and type', async () => {
    const pastDate = new Date(
      Date.now() - 5 * 24 * 60 * 60 * 1000,
    ).toISOString();
    const soonDate = new Date(
      Date.now() + 3 * 24 * 60 * 60 * 1000,
    ).toISOString();
    const futureDate = new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000,
    ).toISOString();

    mockQuery.then = jest.fn((resolve: any) =>
      resolve({
        data: [
          { due_date: pastDate, deadline_type: 'audit', status: 'upcoming' },
          { due_date: soonDate, deadline_type: 'renewal', status: 'upcoming' },
          { due_date: futureDate, deadline_type: 'review', status: 'upcoming' },
        ],
        error: null,
      }),
    );

    const result = await getDeadlineSummary('org-1');
    expect(result.total).toBe(3);
    expect(result.overdue).toBe(1);
    expect(result.dueSoon).toBe(1);
    expect(result.upcoming).toBe(1);
    expect(result.byType.audit).toBe(1);
    expect(result.byType.renewal).toBe(1);
    expect(result.byType.review).toBe(1);
  });
});

describe('getActionRequiredDeadlines', () => {
  beforeEach(resetMock);

  it('returns only overdue and due_soon deadlines', async () => {
    const pastDate = new Date(
      Date.now() - 5 * 24 * 60 * 60 * 1000,
    ).toISOString();
    const soonDate = new Date(
      Date.now() + 3 * 24 * 60 * 60 * 1000,
    ).toISOString();
    const futureDate = new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000,
    ).toISOString();

    mockQuery.then = jest.fn((resolve: any) =>
      resolve({
        data: [
          {
            id: '1',
            title: 'Past',
            due_date: pastDate,
            deadline_type: 'audit',
            status: 'upcoming',
          },
          {
            id: '2',
            title: 'Soon',
            due_date: soonDate,
            deadline_type: 'renewal',
            status: 'upcoming',
          },
          {
            id: '3',
            title: 'Future',
            due_date: futureDate,
            deadline_type: 'review',
            status: 'upcoming',
          },
        ],
        error: null,
        count: 3,
      }),
    );

    const result = await getActionRequiredDeadlines('org-1');
    expect(result.length).toBe(2);
    expect(result.map((d) => d.id)).toEqual(['1', '2']);
  });
});
