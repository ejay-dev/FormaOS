/** @jest-environment node */

import {
  createReportTemplate,
  duplicateReportTemplate,
  exportReport,
  fetchWidgetData,
  generateReport,
  getReportStats,
} from '@/lib/report-builder';
import { mockSupabase } from '@/tests/helpers';

const supabase = mockSupabase();
const logActivity = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: jest.fn(async () => supabase.client),
}));

jest.mock('@/lib/audit-trail', () => ({
  logActivity: (...args: unknown[]) => logActivity(...args),
}));

const widget = {
  id: 'widget-1',
  type: 'table' as const,
  title: 'Tasks',
  position: { x: 0, y: 0, width: 6, height: 4 },
  dataSource: 'tasks' as const,
  config: {
    table: {
      columns: [{ key: 'title', label: 'Title' }],
      data: [],
    },
  },
};

describe('report-builder', () => {
  beforeEach(() => {
    supabase.reset();
    logActivity.mockReset();
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('creates report templates and records audit activity', async () => {
    supabase.setResolver((operation) => {
      if (operation.table === 'report_templates' && operation.action === 'insert') {
        return {
          data: {
            id: 'template-1',
            ...(operation.values as Record<string, unknown>),
          },
          error: null,
        };
      }
      return { data: null, error: null };
    });

    const template = await createReportTemplate({
      organization_id: 'org-1',
      name: 'Board Pack',
      widgets: [widget],
      layout: { rows: 2, columns: 2 },
      created_by: 'user-1',
    });

    expect(template.id).toBe('template-1');
    expect(logActivity).toHaveBeenCalledWith(
      'org-1',
      'user-1',
      'create',
      'report',
      expect.objectContaining({
        entityId: 'template-1',
        entityName: 'Board Pack',
      }),
    );
  });

  it('fetches task data with status and date filters', async () => {
    supabase.queueResponse({
      match: { table: 'tasks', action: 'select', expects: 'many' },
      response: {
        data: [{ id: 'task-1', status: 'pending', title: 'Review access' }],
        error: null,
      },
    });

    const result = await fetchWidgetData('org-1', 'tasks', {
      status: ['pending'],
      dateRange: {
        from: '2026-03-01T00:00:00.000Z',
        to: '2026-03-31T00:00:00.000Z',
      },
    });

    expect(result).toEqual([{ id: 'task-1', status: 'pending', title: 'Review access' }]);

    const operation = supabase.getLastOperation('tasks');
    expect(operation?.filters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'eq',
          column: 'organization_id',
          value: 'org-1',
        }),
        expect.objectContaining({
          type: 'in',
          column: 'status',
          value: ['pending'],
        }),
        expect.objectContaining({
          type: 'gte',
          column: 'created_at',
          value: '2026-03-01T00:00:00.000Z',
        }),
        expect.objectContaining({
          type: 'lte',
          column: 'created_at',
          value: '2026-03-31T00:00:00.000Z',
        }),
      ]),
    );
  });

  it('aggregates compliance metrics across tasks, certificates, and evidence', async () => {
    supabase.setResolver((operation) => {
      if (operation.table === 'tasks') {
        return { data: [{ id: 'task-1' }], error: null };
      }
      if (operation.table === 'certifications') {
        return { data: [{ id: 'cert-1' }], error: null };
      }
      if (operation.table === 'evidence') {
        return { data: [{ id: 'evidence-1' }], error: null };
      }
      return { data: null, error: null };
    });

    await expect(fetchWidgetData('org-1', 'compliance_metrics')).resolves.toEqual({
      tasks: [{ id: 'task-1' }],
      certificates: [{ id: 'cert-1' }],
      evidence: [{ id: 'evidence-1' }],
    });
  });

  it('builds reports from templates and exports JSON and CSV payloads', async () => {
    supabase.setResolver((operation) => {
      if (operation.table === 'report_templates' && operation.action === 'select') {
        return {
          data: {
            id: 'template-1',
            organization_id: 'org-1',
            name: 'Board Pack',
            widgets: [widget],
            layout: { rows: 2, columns: 2 },
            created_by: 'user-1',
          },
          error: null,
        };
      }
      if (operation.table === 'tasks' && operation.action === 'select') {
        return {
          data: [{ id: 'task-1', title: 'Review access', status: 'pending' }],
          error: null,
        };
      }
      return { data: null, error: null };
    });

    const report = await generateReport('template-1', 'org-1');
    expect(report.data['widget-1']).toEqual([
      { id: 'task-1', title: 'Review access', status: 'pending' },
    ]);

    const json = await exportReport('template-1', 'org-1', 'json');
    expect(json.toString()).toContain('"name": "Board Pack"');

    const csv = await exportReport('template-1', 'org-1', 'csv');
    expect(csv.toString()).toContain('id,title,status');

    await expect(exportReport('template-1', 'org-1', 'pdf')).rejects.toThrow(
      'PDF export not yet implemented',
    );
  });

  it('disables unsafe custom queries instead of executing raw SQL', async () => {
    await expect(
      fetchWidgetData('org-1', 'custom_query', {
        customQuery: 'select * from users',
      }),
    ).resolves.toEqual([]);
    expect(console.warn).toHaveBeenCalledWith(
      '[report-builder] custom_query data source is disabled for security reasons',
    );
  });

  it('calculates report statistics and duplicates templates with schedules disabled', async () => {
    supabase.setResolver((operation) => {
      if (operation.table === 'report_templates' && operation.action === 'select') {
        if (
          operation.filters.some(
            (filter) => filter.column === 'id' && filter.value === 'template-source',
          )
        ) {
          return {
            data: {
              id: 'template-source',
              organization_id: 'org-1',
              name: 'Executive',
              description: 'Original',
              widgets: [widget],
              layout: { rows: 2, columns: 2 },
              schedule: {
                enabled: true,
                frequency: 'weekly',
                time: '09:00',
                recipients: ['board@example.com'],
              },
            },
            error: null,
          };
        }

        return {
          data: [
            { id: 'template-source', name: 'Executive', schedule: { enabled: true } },
            { id: 'template-2', name: 'Ops', schedule: { enabled: false } },
          ],
          error: null,
        };
      }
      if (operation.table === 'report_generations') {
        return {
          data: [
            { template_id: 'template-source' },
            { template_id: 'template-source' },
            { template_id: 'template-2' },
          ],
          error: null,
        };
      }
      if (operation.table === 'report_templates' && operation.action === 'insert') {
        return {
          data: {
            id: 'template-copy',
            ...(operation.values as Record<string, unknown>),
          },
          error: null,
        };
      }
      return { data: null, error: null };
    });

    await expect(getReportStats('org-1')).resolves.toEqual({
      totalTemplates: 2,
      scheduledReports: 1,
      recentlyGenerated: 3,
      popularTemplates: [
        { id: 'template-source', name: 'Executive', generationCount: 2 },
        { id: 'template-2', name: 'Ops', generationCount: 1 },
      ],
    });

    const copy = await duplicateReportTemplate('template-source', 'user-2');
    expect(copy).toEqual(
      expect.objectContaining({
        id: 'template-copy',
        name: 'Executive (Copy)',
        schedule: expect.objectContaining({ enabled: false }),
      }),
    );
  });
});

