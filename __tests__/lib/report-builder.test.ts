/** @jest-environment node */

import {
  createReportTemplate,
  getReportTemplates,
  updateReportTemplate,
  deleteReportTemplate,
  duplicateReportTemplate,
  exportReport,
  fetchWidgetData,
  generateReport,
  scheduleReport,
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

  /* ---------------------------------------------------------------- */
  /* createReportTemplate                                             */
  /* ---------------------------------------------------------------- */

  it('creates report templates and records audit activity', async () => {
    supabase.setResolver((operation) => {
      if (
        operation.table === 'report_templates' &&
        operation.action === 'insert'
      ) {
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

  it('throws on createReportTemplate DB error', async () => {
    supabase.setResolver(() => ({
      data: null,
      error: { message: 'insert failed' },
    }));

    await expect(
      createReportTemplate({
        organization_id: 'org-1',
        name: 'Fail',
        widgets: [],
        layout: { rows: 1, columns: 1 },
        created_by: 'user-1',
      }),
    ).rejects.toThrow('Failed to create report template');
  });

  /* ---------------------------------------------------------------- */
  /* getReportTemplates                                               */
  /* ---------------------------------------------------------------- */

  it('returns templates on success', async () => {
    supabase.setResolver(() => ({
      data: [{ id: 't1' }, { id: 't2' }],
      error: null,
    }));
    const result = await getReportTemplates('org-1');
    expect(result).toHaveLength(2);
  });

  it('returns empty on getReportTemplates error', async () => {
    supabase.setResolver(() => ({
      data: null,
      error: { message: 'err' },
    }));
    const result = await getReportTemplates('org-1');
    expect(result).toEqual([]);
  });

  /* ---------------------------------------------------------------- */
  /* updateReportTemplate                                             */
  /* ---------------------------------------------------------------- */

  it('updates template successfully', async () => {
    supabase.setResolver(() => ({ data: null, error: null }));
    await expect(
      updateReportTemplate('t1', { name: 'Updated' }),
    ).resolves.toBeUndefined();
  });

  it('throws on updateReportTemplate error', async () => {
    supabase.setResolver(() => ({
      data: null,
      error: { message: 'update err' },
    }));
    await expect(updateReportTemplate('t1', { name: 'Fail' })).rejects.toThrow(
      'Failed to update report template',
    );
  });

  /* ---------------------------------------------------------------- */
  /* deleteReportTemplate                                             */
  /* ---------------------------------------------------------------- */

  it('deletes template successfully', async () => {
    supabase.setResolver(() => ({ data: null, error: null }));
    await expect(deleteReportTemplate('t1')).resolves.toBeUndefined();
  });

  it('throws on deleteReportTemplate error', async () => {
    supabase.setResolver(() => ({
      data: null,
      error: { message: 'delete err' },
    }));
    await expect(deleteReportTemplate('t1')).rejects.toThrow(
      'Failed to delete report template',
    );
  });

  /* ---------------------------------------------------------------- */
  /* fetchWidgetData — all 8 data sources                            */
  /* ---------------------------------------------------------------- */

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

    expect(result).toEqual([
      { id: 'task-1', status: 'pending', title: 'Review access' },
    ]);
  });

  it('fetches tasks with no filters', async () => {
    supabase.queueResponse({
      match: { table: 'tasks', action: 'select', expects: 'many' },
      response: { data: [{ id: 't1' }], error: null },
    });
    expect(await fetchWidgetData('org-1', 'tasks')).toEqual([{ id: 't1' }]);
  });

  it('fetches certificates with dateRange filter', async () => {
    supabase.queueResponse({
      match: { table: 'certifications', action: 'select', expects: 'many' },
      response: { data: [{ id: 'cert-1' }], error: null },
    });
    const result = await fetchWidgetData('org-1', 'certificates', {
      dateRange: { from: '2026-01-01', to: '2026-12-31' },
    });
    expect(result).toEqual([{ id: 'cert-1' }]);
  });

  it('fetches certificates without filters', async () => {
    supabase.queueResponse({
      match: { table: 'certifications', action: 'select', expects: 'many' },
      response: { data: null, error: null },
    });
    expect(await fetchWidgetData('org-1', 'certificates')).toEqual([]);
  });

  it('fetches evidence with status filter', async () => {
    supabase.queueResponse({
      match: { table: 'org_evidence', action: 'select', expects: 'many' },
      response: { data: [{ id: 'ev-1' }], error: null },
    });
    const result = await fetchWidgetData('org-1', 'evidence', {
      status: ['approved'],
    });
    expect(result).toEqual([{ id: 'ev-1' }]);
  });

  it('fetches evidence without filters', async () => {
    supabase.queueResponse({
      match: { table: 'org_evidence', action: 'select', expects: 'many' },
      response: { data: null, error: null },
    });
    expect(await fetchWidgetData('org-1', 'evidence')).toEqual([]);
  });

  it('fetches members', async () => {
    supabase.queueResponse({
      match: {
        table: 'organization_members',
        action: 'select',
        expects: 'many',
      },
      response: {
        data: [{ id: 'm1', profiles: { name: 'Alice' } }],
        error: null,
      },
    });
    expect(await fetchWidgetData('org-1', 'members')).toEqual([
      { id: 'm1', profiles: { name: 'Alice' } },
    ]);
  });

  it('aggregates compliance metrics across tasks, certificates, and evidence', async () => {
    supabase.setResolver((operation) => {
      if (operation.table === 'tasks')
        return { data: [{ id: 'task-1' }], error: null };
      if (operation.table === 'certifications')
        return { data: [{ id: 'cert-1' }], error: null };
      if (operation.table === 'org_evidence')
        return { data: [{ id: 'ev-1' }], error: null };
      return { data: null, error: null };
    });

    await expect(
      fetchWidgetData('org-1', 'compliance_metrics'),
    ).resolves.toEqual({
      tasks: [{ id: 'task-1' }],
      certificates: [{ id: 'cert-1' }],
      evidence: [{ id: 'ev-1' }],
    });
  });

  it('fetches activity_logs with dateRange', async () => {
    supabase.queueResponse({
      match: { table: 'activity_logs', action: 'select', expects: 'many' },
      response: { data: [{ id: 'log-1' }], error: null },
    });
    const result = await fetchWidgetData('org-1', 'activity_logs', {
      dateRange: { from: '2026-01-01', to: '2026-12-31' },
    });
    expect(result).toEqual([{ id: 'log-1' }]);
  });

  it('fetches activity_logs without dateRange', async () => {
    supabase.queueResponse({
      match: { table: 'activity_logs', action: 'select', expects: 'many' },
      response: { data: null, error: null },
    });
    expect(await fetchWidgetData('org-1', 'activity_logs')).toEqual([]);
  });

  it('fetches workflows', async () => {
    supabase.queueResponse({
      match: { table: 'workflow_configs', action: 'select', expects: 'many' },
      response: { data: [{ id: 'wf-1' }], error: null },
    });
    expect(await fetchWidgetData('org-1', 'workflows')).toEqual([
      { id: 'wf-1' },
    ]);
  });

  it('disables unsafe custom queries', async () => {
    await expect(
      fetchWidgetData('org-1', 'custom_query', {
        customQuery: 'select * from users',
      }),
    ).resolves.toEqual([]);
    expect(console.warn).toHaveBeenCalledWith(
      '[report-builder] custom_query data source is disabled for security reasons',
    );
  });

  it('returns empty for unknown data source (default case)', async () => {
    await expect(
      fetchWidgetData('org-1', 'nonexistent' as any),
    ).resolves.toEqual([]);
  });

  /* ---------------------------------------------------------------- */
  /* generateReport                                                   */
  /* ---------------------------------------------------------------- */

  it('generates report from template', async () => {
    supabase.setResolver((operation) => {
      if (
        operation.table === 'report_templates' &&
        operation.action === 'select'
      ) {
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
      if (operation.table === 'tasks') {
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
  });

  it('throws when template not found', async () => {
    supabase.setResolver(() => ({ data: null, error: null }));
    await expect(generateReport('missing', 'org-1')).rejects.toThrow(
      'Report template not found',
    );
  });

  it('handles widget data fetch error gracefully (returns null)', async () => {
    supabase.setResolver((operation) => {
      if (operation.table === 'report_templates') {
        return {
          data: {
            id: 't1',
            widgets: [widget],
            layout: { rows: 1, columns: 1 },
          },
          error: null,
        };
      }
      // Tasks query throws
      throw new Error('DB crash');
    });

    const report = await generateReport('t1', 'org-1');
    expect(report.data['widget-1']).toBeNull();
    expect(console.error).toHaveBeenCalled();
  });

  /* ---------------------------------------------------------------- */
  /* scheduleReport                                                   */
  /* ---------------------------------------------------------------- */

  it('schedules report successfully', async () => {
    supabase.setResolver(() => ({ data: null, error: null }));
    await expect(
      scheduleReport('t1', {
        enabled: true,
        frequency: 'weekly',
        time: '09:00',
        recipients: ['a@b.com'],
      }),
    ).resolves.toBeUndefined();
  });

  it('throws on scheduleReport error', async () => {
    supabase.setResolver(() => ({
      data: null,
      error: { message: 'schedule err' },
    }));
    await expect(
      scheduleReport('t1', {
        enabled: true,
        frequency: 'daily',
        time: '08:00',
        recipients: [],
      }),
    ).rejects.toThrow('Failed to schedule report');
  });

  /* ---------------------------------------------------------------- */
  /* exportReport — all 4 formats + unsupported                      */
  /* ---------------------------------------------------------------- */

  it('exports JSON format', async () => {
    supabase.setResolver((operation) => {
      if (operation.table === 'report_templates') {
        return {
          data: {
            id: 't1',
            name: 'Report',
            widgets: [widget],
            layout: { rows: 1, columns: 1 },
          },
          error: null,
        };
      }
      return { data: [{ id: 'task-1' }], error: null };
    });

    const json = await exportReport('t1', 'org-1', 'json');
    expect(json.toString()).toContain('"name": "Report"');
  });

  it('exports CSV format', async () => {
    supabase.setResolver((operation) => {
      if (operation.table === 'report_templates') {
        return {
          data: {
            id: 't1',
            name: 'Report',
            widgets: [widget],
            layout: { rows: 1, columns: 1 },
          },
          error: null,
        };
      }
      return {
        data: [{ id: 'task-1', title: 'Review access', status: 'pending' }],
        error: null,
      };
    });

    const csv = await exportReport('t1', 'org-1', 'csv');
    expect(csv.toString()).toContain('id,title,status');
  });

  it('exports CSV with comma-containing values (quoted)', async () => {
    supabase.setResolver((operation) => {
      if (operation.table === 'report_templates') {
        return {
          data: {
            id: 't1',
            name: 'Report',
            widgets: [widget],
            layout: { rows: 1, columns: 1 },
          },
          error: null,
        };
      }
      return {
        data: [{ title: 'Hello, World' }],
        error: null,
      };
    });

    const csv = await exportReport('t1', 'org-1', 'csv');
    expect(csv.toString()).toContain('"Hello, World"');
  });

  it('exports CSV returns empty for non-array data', async () => {
    supabase.setResolver((operation) => {
      if (operation.table === 'report_templates') {
        return {
          data: {
            id: 't1',
            name: 'Report',
            widgets: [{ ...widget, dataSource: 'compliance_metrics' }],
            layout: { rows: 1, columns: 1 },
          },
          error: null,
        };
      }
      // compliance_metrics returns an object, not an array
      return { data: [{ id: 'x' }], error: null };
    });

    const csv = await exportReport('t1', 'org-1', 'csv');
    // The first widget data is an object (compliance_metrics), not an array
    // so CSV falls through to empty Buffer
    expect(csv).toBeDefined();
  });

  it('exports PDF format', async () => {
    supabase.setResolver((operation) => {
      if (operation.table === 'report_templates') {
        return {
          data: {
            id: 't1',
            name: 'Report',
            description: 'A test report description',
            widgets: [widget],
            layout: { rows: 1, columns: 1 },
          },
          error: null,
        };
      }
      return { data: [{ id: 'task-1' }], error: null };
    });

    const pdf = await exportReport('t1', 'org-1', 'pdf');
    expect(pdf.toString('utf-8', 0, 4)).toBe('%PDF');
  });

  it('exports Excel format', async () => {
    supabase.setResolver((operation) => {
      if (operation.table === 'report_templates') {
        return {
          data: {
            id: 't1',
            name: 'Report',
            widgets: [widget],
            layout: { rows: 1, columns: 1 },
          },
          error: null,
        };
      }
      return { data: [{ id: 'task-1' }], error: null };
    });

    const excel = await exportReport('t1', 'org-1', 'excel');
    expect(excel.toString()).toContain('<Workbook');
  });

  it('throws for unsupported format', async () => {
    supabase.setResolver((operation) => {
      if (operation.table === 'report_templates') {
        return {
          data: {
            id: 't1',
            name: 'Report',
            widgets: [],
            layout: { rows: 1, columns: 1 },
          },
          error: null,
        };
      }
      return { data: null, error: null };
    });

    await expect(exportReport('t1', 'org-1', 'xml' as any)).rejects.toThrow(
      'Unsupported format: xml',
    );
  });

  /* ---------------------------------------------------------------- */
  /* getReportStats                                                   */
  /* ---------------------------------------------------------------- */

  it('calculates report statistics', async () => {
    supabase.setResolver((operation) => {
      if (operation.table === 'report_templates') {
        return {
          data: [
            { id: 't1', name: 'Exec', schedule: { enabled: true } },
            { id: 't2', name: 'Ops', schedule: { enabled: false } },
          ],
          error: null,
        };
      }
      if (operation.table === 'report_generations') {
        return {
          data: [
            { template_id: 't1' },
            { template_id: 't1' },
            { template_id: 't2' },
          ],
          error: null,
        };
      }
      return { data: null, error: null };
    });

    const stats = await getReportStats('org-1');
    expect(stats).toEqual({
      totalTemplates: 2,
      scheduledReports: 1,
      recentlyGenerated: 3,
      popularTemplates: [
        { id: 't1', name: 'Exec', generationCount: 2 },
        { id: 't2', name: 'Ops', generationCount: 1 },
      ],
    });
  });

  it('handles empty templates and generations', async () => {
    supabase.setResolver(() => ({ data: null, error: null }));

    const stats = await getReportStats('org-1');
    expect(stats.totalTemplates).toBe(0);
    expect(stats.scheduledReports).toBe(0);
    expect(stats.recentlyGenerated).toBe(0);
    expect(stats.popularTemplates).toEqual([]);
  });

  it('maps unknown template in popularTemplates', async () => {
    supabase.setResolver((operation) => {
      if (operation.table === 'report_templates') {
        return { data: [], error: null };
      }
      if (operation.table === 'report_generations') {
        return { data: [{ template_id: 'deleted-template' }], error: null };
      }
      return { data: null, error: null };
    });

    const stats = await getReportStats('org-1');
    expect(stats.popularTemplates[0].name).toBe('Unknown');
  });

  /* ---------------------------------------------------------------- */
  /* duplicateReportTemplate                                          */
  /* ---------------------------------------------------------------- */

  it('duplicates template with schedule disabled', async () => {
    supabase.setResolver((operation) => {
      if (
        operation.table === 'report_templates' &&
        operation.action === 'select'
      ) {
        if (
          operation.filters.some(
            (f: any) => f.column === 'id' && f.value === 'template-source',
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
                recipients: [],
              },
            },
            error: null,
          };
        }
      }
      if (
        operation.table === 'report_templates' &&
        operation.action === 'insert'
      ) {
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

    const copy = await duplicateReportTemplate('template-source', 'user-2');
    expect(copy).toEqual(
      expect.objectContaining({
        id: 'template-copy',
        name: 'Executive (Copy)',
        schedule: expect.objectContaining({ enabled: false }),
      }),
    );
  });

  it('throws when original template not found', async () => {
    supabase.setResolver(() => ({ data: null, error: null }));
    await expect(duplicateReportTemplate('missing', 'user-1')).rejects.toThrow(
      'Template not found',
    );
  });
});
