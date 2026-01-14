/**
 * =========================================================
 * Custom Report Builder
 * =========================================================
 * Drag-and-drop report designer with widgets and data sources
 */

import { createSupabaseServerClient as createClient } from '@/lib/supabase/server';
import { logActivity } from './audit-trail';

export type WidgetType =
  | 'metric'
  | 'chart_line'
  | 'chart_bar'
  | 'chart_pie'
  | 'chart_doughnut'
  | 'table'
  | 'text'
  | 'header'
  | 'list'
  | 'progress';

export type DataSource =
  | 'tasks'
  | 'certificates'
  | 'evidence'
  | 'members'
  | 'compliance_metrics'
  | 'activity_logs'
  | 'workflows'
  | 'custom_query';

export interface Widget {
  id: string;
  type: WidgetType;
  title: string;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  dataSource: DataSource;
  config: WidgetConfig;
}

export interface WidgetConfig {
  // Metric widget
  metric?: {
    value: string | number;
    prefix?: string;
    suffix?: string;
    color?: string;
    trend?: {
      value: number;
      direction: 'up' | 'down';
    };
  };

  // Chart widgets
  chart?: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      backgroundColor?: string | string[];
      borderColor?: string;
    }>;
    options?: any;
  };

  // Table widget
  table?: {
    columns: Array<{
      key: string;
      label: string;
      sortable?: boolean;
    }>;
    data: Record<string, any>[];
    pagination?: boolean;
    pageSize?: number;
  };

  // Text/Header widget
  text?: {
    content: string;
    alignment?: 'left' | 'center' | 'right';
    fontSize?: number;
    color?: string;
  };

  // List widget
  list?: {
    items: Array<{
      label: string;
      value: string;
      icon?: string;
    }>;
    ordered?: boolean;
  };

  // Progress widget
  progress?: {
    value: number;
    max: number;
    label: string;
    color?: string;
  };

  // Data filtering
  filters?: {
    dateRange?: {
      from: string;
      to: string;
    };
    status?: string[];
    category?: string[];
    customQuery?: string;
  };

  // Refresh settings
  refresh?: {
    enabled: boolean;
    interval: number; // in seconds
  };
}

export interface ReportTemplate {
  id?: string;
  organization_id: string;
  name: string;
  description?: string;
  widgets: Widget[];
  layout: {
    rows: number;
    columns: number;
  };
  schedule?: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly';
    time: string;
    recipients: string[];
  };
  created_by: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Create report template
 */
export async function createReportTemplate(
  template: Omit<ReportTemplate, 'id' | 'created_at' | 'updated_at'>,
): Promise<ReportTemplate> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('report_templates')
    .insert({
      organization_id: template.organization_id,
      name: template.name,
      description: template.description,
      widgets: template.widgets,
      layout: template.layout,
      schedule: template.schedule,
      created_by: template.created_by,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create report template: ${error.message}`);
  }

  await logActivity(
    template.organization_id,
    template.created_by,
    'create',
    'report',
    {
      entityId: data.id,
      entityName: template.name,
      details: { widgets_count: template.widgets.length },
    },
  );

  return data;
}

/**
 * Get report templates
 */
export async function getReportTemplates(
  organizationId: string,
): Promise<ReportTemplate[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('report_templates')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });

  if (error) return [];

  return data || [];
}

/**
 * Update report template
 */
export async function updateReportTemplate(
  templateId: string,
  updates: Partial<ReportTemplate>,
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('report_templates')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', templateId);

  if (error) {
    throw new Error(`Failed to update report template: ${error.message}`);
  }
}

/**
 * Delete report template
 */
export async function deleteReportTemplate(templateId: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('report_templates')
    .delete()
    .eq('id', templateId);

  if (error) {
    throw new Error(`Failed to delete report template: ${error.message}`);
  }
}

/**
 * Fetch data for widget
 */
export async function fetchWidgetData(
  organizationId: string,
  dataSource: DataSource,
  filters?: WidgetConfig['filters'],
): Promise<any> {
  const supabase = await createClient();

  switch (dataSource) {
    case 'tasks': {
      let query = supabase
        .from('tasks')
        .select('*')
        .eq('organization_id', organizationId);

      if (filters?.status) {
        query = query.in('status', filters.status);
      }

      if (filters?.dateRange) {
        query = query
          .gte('created_at', filters.dateRange.from)
          .lte('created_at', filters.dateRange.to);
      }

      const { data } = await query;
      return data || [];
    }

    case 'certificates': {
      let query = supabase
        .from('certifications')
        .select('*')
        .eq('organization_id', organizationId);

      if (filters?.dateRange) {
        query = query
          .gte('created_at', filters.dateRange.from)
          .lte('created_at', filters.dateRange.to);
      }

      const { data } = await query;
      return data || [];
    }

    case 'evidence': {
      let query = supabase
        .from('evidence')
        .select('*')
        .eq('organization_id', organizationId);

      if (filters?.status) {
        query = query.in('status', filters.status);
      }

      const { data } = await query;
      return data || [];
    }

    case 'members': {
      const { data } = await supabase
        .from('organization_members')
        .select('*, profiles(*)')
        .eq('organization_id', organizationId);

      return data || [];
    }

    case 'compliance_metrics': {
      // Fetch various compliance metrics
      const [tasks, certificates, evidence] = await Promise.all([
        supabase
          .from('tasks')
          .select('*')
          .eq('organization_id', organizationId),
        supabase
          .from('certifications')
          .select('*')
          .eq('organization_id', organizationId),
        supabase
          .from('evidence')
          .select('*')
          .eq('organization_id', organizationId),
      ]);

      return {
        tasks: tasks.data || [],
        certificates: certificates.data || [],
        evidence: evidence.data || [],
      };
    }

    case 'activity_logs': {
      let query = supabase
        .from('activity_logs')
        .select('*, profiles!user_id(full_name, email)')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (filters?.dateRange) {
        query = query
          .gte('created_at', filters.dateRange.from)
          .lte('created_at', filters.dateRange.to);
      }

      const { data } = await query;
      return data || [];
    }

    case 'workflows': {
      const { data } = await supabase
        .from('workflow_configs')
        .select('*')
        .eq('organization_id', organizationId);

      return data || [];
    }

    case 'custom_query': {
      if (filters?.customQuery) {
        // Execute custom SQL query (be careful with security)
        const { data } = await supabase.rpc('execute_custom_query', {
          query: filters.customQuery,
          org_id: organizationId,
        });
        return data || [];
      }
      return [];
    }

    default:
      return [];
  }
}

/**
 * Generate report from template
 */
export async function generateReport(
  templateId: string,
  organizationId: string,
): Promise<{
  template: ReportTemplate;
  data: Record<string, any>;
}> {
  const supabase = await createClient();

  // Get template
  const { data: template } = await supabase
    .from('report_templates')
    .select('*')
    .eq('id', templateId)
    .single();

  if (!template) {
    throw new Error('Report template not found');
  }

  // Fetch data for all widgets
  const widgetData: Record<string, any> = {};

  for (const widget of template.widgets) {
    try {
      const data = await fetchWidgetData(
        organizationId,
        widget.dataSource,
        widget.config.filters,
      );
      widgetData[widget.id] = data;
    } catch (error) {
      console.error(`Failed to fetch data for widget ${widget.id}:`, error);
      widgetData[widget.id] = null;
    }
  }

  return {
    template,
    data: widgetData,
  };
}

/**
 * Schedule report generation
 */
export async function scheduleReport(
  templateId: string,
  schedule: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly';
    time: string;
    recipients: string[];
  },
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('report_templates')
    .update({
      schedule,
      updated_at: new Date().toISOString(),
    })
    .eq('id', templateId);

  if (error) {
    throw new Error(`Failed to schedule report: ${error.message}`);
  }
}

/**
 * Export report to various formats
 */
export async function exportReport(
  templateId: string,
  organizationId: string,
  format: 'pdf' | 'excel' | 'csv' | 'json',
): Promise<Buffer> {
  const report = await generateReport(templateId, organizationId);

  switch (format) {
    case 'json':
      return Buffer.from(JSON.stringify(report, null, 2));

    case 'csv': {
      // Convert first widget data to CSV
      const firstWidgetData = Object.values(report.data)[0];
      if (Array.isArray(firstWidgetData)) {
        const csv = convertToCSV(firstWidgetData);
        return Buffer.from(csv);
      }
      return Buffer.from('');
    }

    case 'pdf':
    case 'excel':
      // TODO: Implement PDF and Excel export
      throw new Error(`${format.toUpperCase()} export not yet implemented`);

    default:
      throw new Error(`Unsupported format: ${format}`);
  }
}

/**
 * Convert data to CSV
 */
function convertToCSV(data: Record<string, any>[]): string {
  if (data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const rows = data.map((row) =>
    headers
      .map((header) => {
        const value = row[header];
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value}"`;
        }
        return value;
      })
      .join(','),
  );

  return [headers.join(','), ...rows].join('\n');
}

/**
 * Get report statistics
 */
export async function getReportStats(organizationId: string): Promise<{
  totalTemplates: number;
  scheduledReports: number;
  recentlyGenerated: number;
  popularTemplates: Array<{
    id: string;
    name: string;
    generationCount: number;
  }>;
}> {
  const supabase = await createClient();

  const { data: templates } = await supabase
    .from('report_templates')
    .select('*')
    .eq('organization_id', organizationId);

  const totalTemplates = templates?.length || 0;
  const scheduledReports =
    templates?.filter((t: any) => t.schedule?.enabled).length || 0;

  // Get generation history (if tracked)
  const { data: generations } = await supabase
    .from('report_generations')
    .select('*')
    .eq('organization_id', organizationId)
    .gte(
      'created_at',
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    );

  const recentlyGenerated = generations?.length || 0;

  // Count generations per template
  const generationCounts: Record<string, number> = {};
  generations?.forEach((gen: any) => {
    generationCounts[gen.template_id] =
      (generationCounts[gen.template_id] || 0) + 1;
  });

  const popularTemplates = Object.entries(generationCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([templateId, count]) => {
      const template = templates?.find((t: any) => t.id === templateId);
      return {
        id: templateId,
        name: template?.name || 'Unknown',
        generationCount: count,
      };
    });

  return {
    totalTemplates,
    scheduledReports,
    recentlyGenerated,
    popularTemplates,
  };
}

/**
 * Duplicate report template
 */
export async function duplicateReportTemplate(
  templateId: string,
  userId: string,
): Promise<ReportTemplate> {
  const supabase = await createClient();

  const { data: original } = await supabase
    .from('report_templates')
    .select('*')
    .eq('id', templateId)
    .single();

  if (!original) {
    throw new Error('Template not found');
  }

  return createReportTemplate({
    organization_id: original.organization_id,
    name: `${original.name} (Copy)`,
    description: original.description,
    widgets: original.widgets,
    layout: original.layout,
    schedule: { ...original.schedule, enabled: false }, // Disable schedule for copy
    created_by: userId,
  });
}
