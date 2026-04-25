import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { requirePermission } from '@/app/app/actions/rbac';
import { rateLimitApi } from '@/lib/security/rate-limiter';
import { routeLog } from '@/lib/monitoring/server-logger';

/**
 * GET /api/v1/evidence — List evidence artifacts.
 *
 * Query params:
 *   - obligationId / taskId  Filter by linked obligation (alias: taskId)
 *   - status                 Filter by verification_status
 *   - limit                  Page size (max 100)
 *
 * Returns both the legacy `{ evidence }` shape (used by reports) and the
 * `{ items }` shape consumed by the obligation EvidenceDrawer, so a single
 * endpoint serves both consumers without breaking existing callers.
 */

const log = routeLog('/api/v1/evidence');

type EvidenceRow = {
  id: string;
  title: string | null;
  file_name: string | null;
  file_type: string | null;
  file_size: number | null;
  verification_status: string | null;
  uploaded_by: string | null;
  verified_by: string | null;
  verified_at: string | null;
  task_id: string | null;
  entity_id: string | null;
  entity_type: string | null;
  file_path: string | null;
  created_at: string;
};

export async function GET(request: Request) {
  try {
    const rateLimitResult = await rateLimitApi(request);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', retryAfter: rateLimitResult.resetAt },
        { status: 429 },
      );
    }

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Bearer token required' },
        { status: 401 },
      );
    }

    let permissionCtx;
    try {
      permissionCtx = await requirePermission('VIEW_CONTROLS');
    } catch {
      return NextResponse.json(
        { error: 'Forbidden - Insufficient permissions' },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const obligationId =
      searchParams.get('obligationId') ||
      searchParams.get('taskId') ||
      undefined;
    const entityId = searchParams.get('entityId') || undefined;
    const entityType = searchParams.get('entityType') || undefined;
    const limit = Math.min(
      parseInt(searchParams.get('limit') || '50', 10),
      100,
    );

    // Use admin for the read (we already authorized via membership +
    // requirePermission). This avoids the strict remote RLS variants
    // that have evolved out-of-sync with this repo's migrations.
    const admin = createSupabaseAdminClient();

    // Schema-tolerant select — drops columns the legacy schema doesn't
    // have (title/file_type/file_size/verification_status/entity_type)
    // until the 20260425 migrations are applied.
    const tryColumns = async (cols: string) => {
      let q = admin
        .from('org_evidence')
        .select(cols)
        .eq('organization_id', permissionCtx.orgId)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (obligationId) q = q.eq('task_id', obligationId);
      if (entityId) q = q.eq('entity_id', entityId);
      if (status && cols.includes('verification_status'))
        q = q.eq('verification_status', status);
      if (entityType && cols.includes('entity_type'))
        q = q.eq('entity_type', entityType);
      return q;
    };

    const fullCols =
      'id, title, file_name, file_type, file_size, verification_status, uploaded_by, verified_by, verified_at, task_id, entity_id, entity_type, file_path, created_at';
    const fallbackCols =
      'id, file_name, uploaded_by, task_id, entity_id, file_path, created_at';
    let result = await tryColumns(fullCols);
    if (
      result.error &&
      /column .* does not exist|Could not find the .* column/i.test(
        result.error.message,
      )
    ) {
      result = await tryColumns(fallbackCols);
    }
    const { data, error } = result;

    if (error) {
      log.error({ err: error }, '[API v1 /evidence] Database error');
      return NextResponse.json(
        { error: 'Failed to fetch evidence' },
        { status: 500 },
      );
    }

    // Cast tolerantly — the fallback select returns a narrower row shape
    // when the migration columns are not yet applied.
    const rows = (data ?? []) as unknown as Array<Partial<EvidenceRow> & {
      id: string;
      file_name: string | null;
      file_path: string | null;
      created_at: string;
      uploaded_by: string | null;
    }>;

    // Resolve uploader emails so the drawer can show "submitted by"
    const uploaderIds = Array.from(
      new Set(
        rows
          .map((r) => r.uploaded_by)
          .filter((v): v is string => typeof v === 'string' && v.length > 0),
      ),
    );

    const uploaderNameById = new Map<string, string>();
    if (uploaderIds.length > 0) {
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('user_id, full_name')
        .in('user_id', uploaderIds);
      for (const p of (profiles ?? []) as Array<{
        user_id: string;
        full_name: string | null;
      }>) {
        if (p.full_name && p.full_name.trim()) {
          uploaderNameById.set(p.user_id, p.full_name.trim());
        }
      }
    }

    const items = rows.map((row) => ({
      id: row.id,
      type: 'file' as const,
      title: row.title || row.file_name || 'Untitled',
      description: null as string | null,
      submittedBy: {
        name: row.uploaded_by
          ? uploaderNameById.get(row.uploaded_by) ?? row.uploaded_by.slice(0, 8)
          : 'Unknown',
      },
      submittedAt: row.created_at,
      locked: row.verification_status === 'verified',
      filePath: row.file_path ?? null,
      fileName: row.file_name ?? null,
      fileType: row.file_type ?? null,
      fileSize: row.file_size ?? null,
      verificationStatus: row.verification_status ?? null,
    }));

    return NextResponse.json({
      items,
      evidence: rows,
      total: rows.length,
      limit,
      status: status || 'all',
      obligationId: obligationId || null,
    });
  } catch (error: unknown) {
    log.error({ err: error }, '[API v1 /evidence] Unexpected error');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
