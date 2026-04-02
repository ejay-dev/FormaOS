import { NextRequest } from 'next/server';
import {
  authenticateV1Request,
  jsonWithContext,
  logV1Access,
} from '@/lib/api-keys/middleware';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { resolveWidgetData } from '@/lib/reports/widget-data';
import {
  generateCSV,
  flattenWidgetToSection,
} from '@/lib/reports/csv-generator';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ reportId: string }> },
) {
  const auth = await authenticateV1Request(req, {
    requiredScopes: ['reports:write'],
  });
  if ('error' in auth) return auth.error;

  const { reportId } = await params;
  const body = await req.json();
  const format = body.format ?? 'json';
  const db = createSupabaseAdminClient();

  const { data: report, error } = await db
    .from('org_saved_reports')
    .select('*')
    .eq('id', reportId)
    .eq('org_id', auth.orgId)
    .single();

  if (error || !report)
    return jsonWithContext({ error: 'Report not found' }, 404);

  const config = report.config as {
    widgets?: Array<{ type: string; config?: Record<string, unknown> }>;
  };
  const widgets = config.widgets ?? [];

  // Resolve all widget data
  const resolvedWidgets = await Promise.all(
    widgets.map(async (w, i) => {
      try {
        const data = await resolveWidgetData(
          w.type,
          auth.orgId,
          (w.config ?? {}) as Record<string, string>,
        );
        return { index: i, type: w.type, ...data };
      } catch {
        return {
          index: i,
          type: w.type,
          error: 'Failed to resolve widget data',
        };
      }
    }),
  );

  // Record the generation
  const genRow = {
    report_id: reportId,
    org_id: auth.orgId,
    generated_by: auth.userId,
    format,
    file_url: null as string | null,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  };

  if (format === 'csv') {
    const sections = resolvedWidgets.map((w) => flattenWidgetToSection(w));
    const csv = generateCSV(sections);

    await db.from('org_report_generations').insert(genRow);
    logV1Access(auth, 'reports.generate', { reportId, format });

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${report.name}.csv"`,
      },
    });
  }

  // JSON format (default)
  await db.from('org_report_generations').insert(genRow);
  logV1Access(auth, 'reports.generate', { reportId, format });

  return jsonWithContext({
    reportId,
    name: report.name,
    generatedAt: new Date().toISOString(),
    widgets: resolvedWidgets,
  });
}
