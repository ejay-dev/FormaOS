import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { rateLimitApi } from '@/lib/security/rate-limiter';
import { routeLog } from '@/lib/monitoring/server-logger';

/**
 * GET /api/v1/audit-trail — Activity feed for a single entity.
 *
 * Query params:
 *   - entityId    Required — the obligation / evidence / record ID
 *   - entityType  Optional ("obligation", "evidence", "incident", ...)
 *   - limit       Page size (max 50)
 *
 * Returns `{ entries: [...] }` formatted for the EvidenceDrawer +
 * AuditTrailPanel components. Each entry is sourced from `org_audit_logs`
 * filtered by `target` matching the entity.
 */

const log = routeLog('/api/v1/audit-trail');

type AuditLogRow = {
  id: string;
  action: string;
  target: string | null;
  actor_email: string | null;
  domain: string | null;
  severity: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

function humanizeAction(action: string): string {
  const normalized = action.toUpperCase();
  switch (normalized) {
    case 'EVIDENCE_UPLOADED':
      return 'attached evidence';
    case 'EVIDENCE_VERIFIED':
      return 'verified evidence';
    case 'EVIDENCE_REJECTED':
      return 'rejected evidence';
    case 'OBLIGATION_UPDATED':
      return 'updated this obligation';
    case 'INCIDENT_RESOLVED':
      return 'resolved this incident';
    case 'INVESTIGATION_STARTED':
      return 'started investigation';
    default:
      return normalized.toLowerCase().replace(/_/g, ' ');
  }
}

export async function GET(request: Request) {
  try {
    const rate = await rateLimitApi(request);
    if (!rate.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', retryAfter: rate.resetAt },
        { status: 429 },
      );
    }

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: membership } = await supabase
      .from('org_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .maybeSingle();
    const orgId = membership?.organization_id as string | undefined;
    if (!orgId) return NextResponse.json({ entries: [] });

    const { searchParams } = new URL(request.url);
    const entityId = searchParams.get('entityId');
    const entityType = searchParams.get('entityType');
    const limit = Math.min(
      parseInt(searchParams.get('limit') || '20', 10),
      50,
    );

    if (!entityId) {
      return NextResponse.json(
        { error: 'entityId required' },
        { status: 400 },
      );
    }

    // org_audit_logs.target stores `entityType:entityId`. Match on either
    // the suffix (when caller doesn't specify a type) or the full prefix.
    const targetExact = entityType ? `${entityType}:${entityId}` : null;
    const targetSuffix = `:${entityId}`;

    let query = supabase
      .from('org_audit_logs')
      .select('id, action, target, actor_email, domain, severity, metadata, created_at')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (targetExact) {
      query = query.eq('target', targetExact);
    } else {
      query = query.or(`target.eq.${entityId},target.like.%${targetSuffix}`);
    }

    const { data, error } = await query;
    if (error) {
      log.error({ err: error }, 'failed to load audit trail');
      return NextResponse.json({ entries: [] });
    }

    const entries = ((data ?? []) as AuditLogRow[]).map((row) => ({
      id: row.id,
      action: humanizeAction(row.action),
      rawAction: row.action,
      actor: {
        name: row.actor_email || 'System',
      },
      timestamp: row.created_at,
      locked: row.severity === 'high' || row.severity === 'critical',
      metadata: row.metadata ?? {},
    }));

    return NextResponse.json({ entries });
  } catch (err) {
    log.error({ err }, 'unexpected error');
    return NextResponse.json({ entries: [] });
  }
}
