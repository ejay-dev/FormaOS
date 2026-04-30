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
    case 'CAPA_CREATED':
      return 'created this CAPA';
    case 'CAPA_UPDATED':
      return 'updated this CAPA';
    case 'CAPA_ASSIGNED':
      return 'assigned this CAPA';
    case 'CAPA_STATUS_CHANGED':
      return 'changed CAPA status';
    case 'CAPA_ROOT_CAUSE_ADDED':
      return 'updated root cause';
    case 'CAPA_CORRECTIVE_ACTION_ADDED':
      return 'updated corrective action';
    case 'CAPA_PREVENTIVE_ACTION_ADDED':
      return 'updated preventive action';
    case 'CAPA_VERIFICATION_COMPLETED':
      return 'completed verification';
    case 'CAPA_CLOSED':
      return 'closed this CAPA';
    case 'CAPA_EVIDENCE_UPLOADED':
      return 'attached CAPA evidence';
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

    // Prefer the typed (entity_type, entity_id) columns added by
    // 20260430_006_audit_log_entity_typed_columns.sql. Fall back to the
    // legacy `target='entityType:entityId'` string filter for rows whose
    // backfill couldn't recover entity_id (e.g., target was not the
    // canonical shape and metadata didn't carry the id either).
    const targetExact = entityType ? `${entityType}:${entityId}` : null;
    const targetSuffix = `:${entityId}`;

    const baseQuery = () =>
      supabase
        .from('org_audit_logs')
        .select('id, action, target, actor_email, created_at')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });

    // Primary query — typed columns. Fast, indexed.
    let typedQuery = baseQuery().eq('entity_id', entityId).limit(limit);
    if (entityType) {
      typedQuery = typedQuery.eq('entity_type', entityType);
    }
    const typedResult = await typedQuery;
    if (typedResult.error) {
      log.error({ err: typedResult.error }, 'failed to load audit trail (typed)');
      return NextResponse.json({ entries: [] });
    }
    let rows = (typedResult.data ?? []) as AuditLogRow[];

    // Fallback query — legacy target-string match. Skip when the typed
    // query already filled the page; the index makes the typed query the
    // canonical path going forward.
    if (rows.length < limit) {
      const remaining = limit - rows.length;
      const seenIds = new Set(rows.map((row) => row.id));
      let legacyQuery = baseQuery().is('entity_id', null).limit(remaining);
      if (targetExact) {
        legacyQuery = legacyQuery.eq('target', targetExact);
      } else {
        legacyQuery = legacyQuery.or(
          `target.eq.${entityId},target.like.%${targetSuffix}`,
        );
      }
      const legacyResult = await legacyQuery;
      if (!legacyResult.error) {
        for (const row of (legacyResult.data ?? []) as AuditLogRow[]) {
          if (!seenIds.has(row.id)) {
            rows.push(row);
          }
        }
        rows.sort((a, b) => b.created_at.localeCompare(a.created_at));
        rows = rows.slice(0, limit);
      }
    }

    const data = rows;

    const entries = ((data ?? []) as AuditLogRow[]).map((row) => ({
      id: row.id,
      action: humanizeAction(row.action),
      rawAction: row.action,
      actor: {
        name: row.actor_email || 'System',
      },
      timestamp: row.created_at,
      locked: false,
      metadata: {},
    }));

    return NextResponse.json({ entries });
  } catch (err) {
    log.error({ err }, 'unexpected error');
    return NextResponse.json({ entries: [] });
  }
}
