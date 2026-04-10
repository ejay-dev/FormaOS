/**
 * Additional branch coverage for lib/report-builder.ts
 */

jest.mock('jspdf', () => {
  const mockDoc = {
    setFontSize: jest.fn(),
    setFont: jest.fn(),
    text: jest.fn(),
    line: jest.fn(),
    rect: jest.fn(),
    setTextColor: jest.fn(),
    setDrawColor: jest.fn(),
    setFillColor: jest.fn(),
    addPage: jest.fn(),
    output: jest.fn(() => new ArrayBuffer(10)),
    internal: { pageSize: { getWidth: () => 210, getHeight: () => 297 } },
  };
  return { jsPDF: jest.fn(() => mockDoc) };
});

jest.mock('jspdf-autotable', () => jest.fn());

jest.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: jest.fn(),
}));

jest.mock('@/lib/audit-trail', () => ({
  logActivity: jest.fn(),
}));

function createBuilder(result: any = { data: null, error: null }) {
  const b: Record<string, any> = {};
  [
    'select',
    'insert',
    'update',
    'delete',
    'eq',
    'neq',
    'in',
    'not',
    'is',
    'order',
    'limit',
    'range',
    'single',
    'maybeSingle',
    'filter',
    'match',
    'gte',
    'lte',
    'or',
  ].forEach((m) => {
    b[m] = jest.fn(() => b);
  });
  b.then = (resolve: (v: any) => void) => resolve(result);
  return b;
}

const { createSupabaseServerClient } = require('@/lib/supabase/server');

import {
  createReportTemplate,
  getReportTemplates,
  updateReportTemplate,
  deleteReportTemplate,
  fetchWidgetData,
} from '@/lib/report-builder';

beforeEach(() => {
  jest.clearAllMocks();
});

function mockClient(result: any = { data: null, error: null }) {
  const client = {
    from: jest.fn(() => createBuilder(result)),
  };
  createSupabaseServerClient.mockResolvedValue(client);
  return client;
}

describe('createReportTemplate', () => {
  it('creates and returns template', async () => {
    mockClient({ data: { id: 'tpl-1', name: 'Test' }, error: null });
    const result = await createReportTemplate({
      organization_id: 'org-1',
      name: 'Test',
      widgets: [],
      layout: { rows: 4, columns: 4 },
      created_by: 'user-1',
    });
    expect(result.id).toBe('tpl-1');
  });

  it('throws on insert error', async () => {
    mockClient({ data: null, error: { message: 'duplicate' } });
    await expect(
      createReportTemplate({
        organization_id: 'org-1',
        name: 'Bad',
        widgets: [],
        layout: { rows: 1, columns: 1 },
        created_by: 'user-1',
      }),
    ).rejects.toThrow('Failed to create');
  });
});

describe('getReportTemplates', () => {
  it('returns templates', async () => {
    mockClient({ data: [{ id: 'tpl-1' }], error: null });
    const result = await getReportTemplates('org-1');
    expect(result).toHaveLength(1);
  });

  it('returns empty on error', async () => {
    mockClient({ data: null, error: { message: 'fail' } });
    expect(await getReportTemplates('org-1')).toEqual([]);
  });

  it('returns empty when data is null', async () => {
    mockClient({ data: null, error: null });
    expect(await getReportTemplates('org-1')).toEqual([]);
  });
});

describe('updateReportTemplate', () => {
  it('updates without error', async () => {
    mockClient({ data: null, error: null });
    await expect(
      updateReportTemplate('tpl-1', { name: 'Updated' }),
    ).resolves.toBeUndefined();
  });

  it('throws on error', async () => {
    mockClient({ data: null, error: { message: 'update fail' } });
    await expect(updateReportTemplate('tpl-1', {})).rejects.toThrow(
      'Failed to update',
    );
  });
});

describe('deleteReportTemplate', () => {
  it('deletes without error', async () => {
    mockClient({ data: null, error: null });
    await expect(deleteReportTemplate('tpl-1')).resolves.toBeUndefined();
  });

  it('throws on error', async () => {
    mockClient({ data: null, error: { message: 'delete fail' } });
    await expect(deleteReportTemplate('tpl-1')).rejects.toThrow(
      'Failed to delete',
    );
  });
});

describe('fetchWidgetData', () => {
  it('fetches tasks', async () => {
    mockClient({ data: [{ id: 't1' }], error: null });
    expect(await fetchWidgetData('org-1', 'tasks')).toHaveLength(1);
  });

  it('fetches tasks with status and date filters', async () => {
    mockClient({ data: [], error: null });
    const result = await fetchWidgetData('org-1', 'tasks', {
      status: ['open', 'pending'],
      dateRange: { from: '2025-01-01', to: '2025-12-31' },
    });
    expect(result).toEqual([]);
  });

  it('fetches certificates', async () => {
    mockClient({ data: [{ id: 'c1' }], error: null });
    expect(await fetchWidgetData('org-1', 'certificates')).toHaveLength(1);
  });

  it('fetches certificates with date filter', async () => {
    mockClient({ data: [], error: null });
    expect(
      await fetchWidgetData('org-1', 'certificates', {
        dateRange: { from: '2025-01-01', to: '2025-06-30' },
      }),
    ).toEqual([]);
  });

  it('fetches evidence', async () => {
    mockClient({ data: [{ id: 'e1' }], error: null });
    expect(await fetchWidgetData('org-1', 'evidence')).toHaveLength(1);
  });

  it('fetches evidence with status filter', async () => {
    mockClient({ data: [], error: null });
    expect(
      await fetchWidgetData('org-1', 'evidence', { status: ['approved'] }),
    ).toEqual([]);
  });

  it('fetches members', async () => {
    mockClient({ data: [{ id: 'm1' }], error: null });
    expect(await fetchWidgetData('org-1', 'members')).toHaveLength(1);
  });

  it('fetches compliance_metrics', async () => {
    const _client = mockClient({ data: [], error: null });
    const result = await fetchWidgetData('org-1', 'compliance_metrics');
    expect(result).toBeDefined();
  });

  it('fetches activity_logs', async () => {
    mockClient({ data: [{ id: 'a1' }], error: null });
    expect(await fetchWidgetData('org-1', 'activity_logs')).toHaveLength(1);
  });

  it('fetches activity_logs with date filter', async () => {
    mockClient({ data: [], error: null });
    expect(
      await fetchWidgetData('org-1', 'activity_logs', {
        dateRange: { from: '2025-01-01', to: '2025-06-30' },
      }),
    ).toEqual([]);
  });
});
