import { NextRequest, NextResponse } from 'next/server';
import { authenticateV1Request } from '@/lib/api-keys/middleware';
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
  if (!auth.ok) return auth.response;

  const { reportId } = await params;
  const body = await req.json();
  const format = body.format ?? 'json';
  const db = createSupabaseAdminClient();

  const { data: report, error } = await db
    .from('org_saved_reports')
    .select('*')
    .eq('id', reportId)
    .eq('org_id', auth.context.orgId)
    .single();

  if (error || !report)
    return NextResponse.json({ error: 'Report not found' }, { status: 404 });

  const config = report.config as {
    widgets?: Array<{ type: string; config?: Record<string, unknown> }>;
  };
  const widgets = config.widgets ?? [];

  // Resolve all widget data
  const resolvedWidgets = await Promise.all(
    widgets.map(async (w, i) => {
      try {
        const widgetConfig = {
          type: w.type,
          dateRange: {
            from: new Date(Date.now() - 30 * 86400000).toISOString(),
            to: new Date().toISOString(),
          },
          ...(w.config ?? {}),
        };
        const data = await resolveWidgetData(
          db,
          auth.context.orgId,
          widgetConfig as any,
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
    org_id: auth.context.orgId,
    generated_by: auth.context.userId,
    format,
    file_url: null as string | null,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  };

  if (format === 'csv') {
    const sections = resolvedWidgets.map((w) =>
      flattenWidgetToSection({ label: w.type, type: w.type, data: w } as any),
    );
    const csv = generateCSV(sections.filter(Boolean) as any);

    await db.from('org_report_generations').insert(genRow);

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${report.name}.csv"`,
      },
    });
  }

  // JSON format (default)
  await db.from('org_report_generations').insert(genRow);

  return NextResponse.json({
    reportId,
    name: report.name,
    generatedAt: new Date().toISOString(),
    widgets: resolvedWidgets,
  });
}
