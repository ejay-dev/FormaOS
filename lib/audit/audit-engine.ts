import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { computeEntryHash } from './hash-utils';
import { ensureChainSecret } from './chain-secret-manager';

// ------------------------------------------------------------------
// Enhanced Audit Engine
// ------------------------------------------------------------------

// Audit 2026-05-26 — write through the audit_log_append RPC.
//
// Old path: app read lastEntry → computed (seq+1, prev_hash) → INSERT.
// Under contention two writers could resolve to the same sequence and
// the loser would hit UNIQUE(org_id, sequence_number), retry up to 5x,
// and on retry exhaustion silently lose audit events. The RPC takes a
// per-org advisory lock and assembles the chain inside one transaction
// — the race is no longer reachable.
//
// The legacy retry path is kept as a fallback for environments where
// the RPC migration hasn't run yet (Supabase Dashboard schema drift,
// local dev DBs not yet caught up). The fallback throws after the
// retry budget so events still surface as errors rather than vanish.
const MAX_CHAIN_RETRIES = 5;
const PG_UNIQUE_VIOLATION = '23505';
const PG_FUNCTION_MISSING = '42883';

export async function writeAuditLog(
  orgId: string,
  entry: {
    userId?: string;
    action: string;
    resourceType: string;
    resourceId?: string;
    details?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
  },
) {
  const db = createSupabaseAdminClient();
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();

  // R3 (Audit 2026-05-27): opt-in v3-hmac path. AUDIT_CHAIN_V3_ENABLED=true
  // routes through audit_log_append_v3 with a per-org HMAC key. Falls
  // through to v2 on resolver failure so a misconfigured env doesn't
  // drop audit events.
  if ((process.env.AUDIT_CHAIN_V3_ENABLED ?? '').toLowerCase() === 'true') {
    try {
      const key = await ensureChainSecret(orgId);
      const { error: v3Error } = await db.rpc('audit_log_append_v3', {
        p_id: id,
        p_org_id: orgId,
        p_user_id: entry.userId ?? null,
        p_action: entry.action,
        p_resource_type: entry.resourceType,
        p_resource_id: entry.resourceId ?? null,
        p_details: entry.details ?? {},
        p_ip_address: entry.ipAddress ?? null,
        p_user_agent: entry.userAgent ?? null,
        p_created_at: createdAt,
        // PostgREST encodes Buffer as base64-prefixed bytea.
        p_hmac_key: `\\x${key.toString('hex')}`,
      });
      if (!v3Error) return;
      // If the v3 RPC is missing on this DB (e.g., older branch), drop
      // through to the v2 path rather than losing the event.
      const code = (v3Error as { code?: string }).code;
      if (code !== PG_FUNCTION_MISSING) throw v3Error;
    } catch (err) {
      // Key-resolver failure or transient: log + fall through. Anything
      // worse than this will surface from the v2 RPC below.
      console.warn(
        '[writeAuditLog] v3 path failed, falling back to v2:',
        err instanceof Error ? err.message : err,
      );
    }
  }

  // Default path: atomic v2 RPC. Computes hash + seq + prev_hash
  // server-side under an advisory lock; one round-trip; race-free.
  const { error: rpcError } = await db.rpc('audit_log_append', {
    p_id: id,
    p_org_id: orgId,
    p_user_id: entry.userId ?? null,
    p_action: entry.action,
    p_resource_type: entry.resourceType,
    p_resource_id: entry.resourceId ?? null,
    p_details: entry.details ?? {},
    p_ip_address: entry.ipAddress ?? null,
    p_user_agent: entry.userAgent ?? null,
    p_created_at: createdAt,
  });

  if (!rpcError) return;

  const rpcErrCode = (rpcError as { code?: string }).code;
  if (rpcErrCode !== PG_FUNCTION_MISSING) {
    // Real RPC failure (auth, integrity, etc.) — surface it.
    throw rpcError;
  }

  // RPC not deployed yet — fall back to the legacy retry loop so the
  // event isn't lost during migration rollout.
  for (let attempt = 0; attempt < MAX_CHAIN_RETRIES; attempt++) {
    const { data: lastEntry } = await db
      .from('audit_log')
      .select('entry_hash, sequence_number')
      .eq('org_id', orgId)
      .order('sequence_number', { ascending: false })
      .limit(1)
      .maybeSingle();

    const seqNum = (lastEntry?.sequence_number || 0) + 1;
    const prevHash = lastEntry?.entry_hash || '';

    // Legacy rows use the v1 hash algorithm.
    const entryHash = computeEntryHash(
      {
        id,
        orgId,
        userId: entry.userId,
        action: entry.action,
        resourceType: entry.resourceType,
        resourceId: entry.resourceId,
        details: entry.details || {},
        createdAt,
        prevHash,
      },
      'v1',
    );

    const { error } = await db.from('audit_log').insert({
      id,
      org_id: orgId,
      user_id: entry.userId,
      action: entry.action,
      resource_type: entry.resourceType,
      resource_id: entry.resourceId,
      details: entry.details || {},
      ip_address: entry.ipAddress,
      user_agent: entry.userAgent,
      created_at: createdAt,
      entry_hash: entryHash,
      prev_hash: prevHash,
      sequence_number: seqNum,
    });

    if (!error) return;

    const code = (error as { code?: string }).code;
    if (code !== PG_UNIQUE_VIOLATION) throw error;
  }

  throw new Error(
    `writeAuditLog: exceeded ${MAX_CHAIN_RETRIES} retries acquiring next sequence for org ${orgId}`,
  );
}

export async function queryAuditLog(
  orgId: string,
  filters?: {
    action?: string;
    resourceType?: string;
    userId?: string;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
    offset?: number;
  },
) {
  const db = await createSupabaseServerClient();
  let query = db
    .from('audit_log')
    .select('*', { count: 'exact' })
    .eq('org_id', orgId)
    .order('created_at', { ascending: false });

  if (filters?.action) query = query.eq('action', filters.action);
  if (filters?.resourceType)
    query = query.eq('resource_type', filters.resourceType);
  if (filters?.userId) query = query.eq('user_id', filters.userId);
  if (filters?.dateFrom) query = query.gte('created_at', filters.dateFrom);
  if (filters?.dateTo) query = query.lte('created_at', filters.dateTo);

  const limit = filters?.limit || 50;
  const offset = filters?.offset || 0;
  query = query.range(offset, offset + limit - 1);

  const { data, count, error } = await query;
  if (error) throw error;

  return { entries: data || [], total: count || 0 };
}

export async function getAuditStats(orgId: string) {
  const db = await createSupabaseServerClient();
  const now = new Date();
  const sevenDaysAgo = new Date(
    now.getTime() - 7 * 24 * 60 * 60 * 1000,
  ).toISOString();
  const thirtyDaysAgo = new Date(
    now.getTime() - 30 * 24 * 60 * 60 * 1000,
  ).toISOString();

  const [{ count: total }, { count: last7d }, { count: last30d }] =
    await Promise.all([
      db
        .from('audit_log')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', orgId),
      db
        .from('audit_log')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .gte('created_at', sevenDaysAgo),
      db
        .from('audit_log')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .gte('created_at', thirtyDaysAgo),
    ]);

  return { total: total || 0, last7d: last7d || 0, last30d: last30d || 0 };
}

export async function requestAuditExport(
  orgId: string,
  params: {
    dateFrom: string;
    dateTo: string;
    filters?: Record<string, unknown>;
    createdBy: string;
  },
) {
  const db = await createSupabaseServerClient();
  const { data, error } = await db
    .from('audit_export_jobs')
    .insert({
      org_id: orgId,
      date_from: params.dateFrom,
      date_to: params.dateTo,
      filters: params.filters || {},
      created_by: params.createdBy,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getExportJobs(orgId: string) {
  const db = await createSupabaseServerClient();
  const { data } = await db
    .from('audit_export_jobs')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })
    .limit(20);
  return data || [];
}
