import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { computeEntryHash } from './hash-utils';

// ------------------------------------------------------------------
// Enhanced Audit Engine
// ------------------------------------------------------------------

// v4-005: under contention, two writers can observe the same
// `lastEntry` snapshot and both compute the same (seq+1, prev_hash) —
// the chain forks silently. UNIQUE(org_id, sequence_number) on
// audit_log forces the loser's INSERT to fail with 23505; we then
// re-read and rebuild the hash against the winner's row. Five
// attempts is the practical ceiling: real-world per-org contention
// peaks at two or three concurrent emitters during compliance reruns.
const MAX_CHAIN_RETRIES = 5;
const PG_UNIQUE_VIOLATION = '23505';

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
  // Chain writes are system-owned and must bypass RLS. The
  // `audit_log_org` policy only grants SELECT to authenticated org
  // members; there is no policy granting INSERT to anyone except
  // service_role. Session-scoped writes were silently failing — only
  // 2 rows ever landed in prod while org_audit_logs accumulated
  // 24,580+ activity rows. Switching to admin closes that gap.
  const db = createSupabaseAdminClient();

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
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();

    const entryHash = computeEntryHash({
      id,
      orgId,
      userId: entry.userId,
      action: entry.action,
      resourceType: entry.resourceType,
      resourceId: entry.resourceId,
      details: entry.details || {},
      createdAt,
      prevHash,
    });

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
