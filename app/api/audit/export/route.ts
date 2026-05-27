import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { rateLimitApi } from '@/lib/security/rate-limiter';
import { routeLog } from '@/lib/monitoring/server-logger';
import { buildOrSearch } from '@/lib/utils/postgrest-search';
import { loadRedactor } from '@/lib/audit/redact-purged-subjects';
import { buildMerkleTree } from '@/lib/audit/merkle';
import { formatCreatedAtV2 } from '@/lib/audit/hash-utils';

const log = routeLog('/api/audit/export');

function escapeCsv(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = typeof value === 'string' ? value : JSON.stringify(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(request: Request) {
  try {
    const rate = await rateLimitApi(request);
    if (!rate.success) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(request.url);
    const requestedOrgId = url.searchParams.get('orgId');
    const search = url.searchParams.get('search') || '';
    const dateFrom = url.searchParams.get('dateFrom') || '';
    const dateTo = url.searchParams.get('dateTo') || '';
    const actions = url.searchParams.getAll('actions');
    const entityTypes = url.searchParams.getAll('entityTypes');

    const { data: membership } = await supabase
      .from('org_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .maybeSingle();
    const userOrgId = membership?.organization_id as string | undefined;
    const orgId = requestedOrgId || userOrgId;

    if (!orgId) return NextResponse.json({ error: 'No organization' }, { status: 403 });
    if (requestedOrgId && requestedOrgId !== userOrgId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const format = (url.searchParams.get('format') || 'csv').toLowerCase();
    if (format !== 'csv' && format !== 'json') {
      return NextResponse.json(
        { error: 'format must be csv or json' },
        { status: 400 },
      );
    }

    let query = supabase
      .from('audit_log')
      .select(
        'id, action, resource_type, resource_id, details, created_at, user_id, ip_address, entry_hash, entry_mac, prev_hash, sequence_number, hash_algo',
      )
      .eq('org_id', orgId)
      .order('sequence_number', { ascending: true, nullsFirst: false })
      .limit(10_000);

    if (actions.length > 0) query = query.in('action', actions);
    if (entityTypes.length > 0) query = query.in('resource_type', entityTypes);
    if (dateFrom) query = query.gte('created_at', dateFrom);
    if (dateTo) query = query.lte('created_at', dateTo);
    if (search) {
      const predicate = buildOrSearch(['action', 'resource_type'], search);
      if (predicate) {
        query = query.or(predicate);
      }
    }

    const { data, error } = await query;
    if (error) {
      log.error({ err: error }, 'failed to load audit logs for export');
      return new NextResponse('Failed to export', { status: 500 });
    }

    // R1 (Audit 2026-05-27): redact subject PII for any user who was
    // GDPR-purged. At-rest audit_log rows are immutable (P0-1 RLS);
    // redaction happens here on the way out so the chain stays whole
    // while the export that leaves the system is erasure-compliant.
    const redactor = await loadRedactor();
    const redactedRows = (data ?? []).map((row) =>
      redactor.redactRow(row as Record<string, unknown>),
    );

    if (format === 'json') {
      // R4 (Audit 2026-05-27): bundle the rows with a Merkle inclusion
      // tree so an external auditor can verify a single event without
      // seeing the others. The leaf payload is the same v2 canonical
      // JSON used by the hash chain — verifiers reuse the same hashing
      // primitive across hash-chain and Merkle-proof checks.
      const leaves = redactedRows.map((row) => {
        const canonical = JSON.stringify({
          id: row.id,
          org_id: orgId,
          user_id: (row.user_id as string | null) ?? null,
          action: row.action,
          resource_type: row.resource_type,
          resource_id: (row.resource_id as string | null) ?? null,
          details: (row.details as Record<string, unknown> | null) ?? {},
          created_at: formatCreatedAtV2(row.created_at as string),
          prev_hash: (row.prev_hash as string | null) || '',
        });
        return { id: row.id as string, payload: canonical };
      });
      const tree = buildMerkleTree(leaves);

      const today = new Date().toISOString().split('T')[0];
      return NextResponse.json(
        {
          manifest: {
            generated_at: new Date().toISOString(),
            org_id: orgId,
            tree_size: tree.treeSize,
            algorithm: tree.algorithm,
            schema_version: '2026-05-27-r4',
          },
          merkle: {
            algorithm: tree.algorithm,
            tree_size: tree.treeSize,
            root: tree.root,
            empty_tree: tree.emptyTree,
            proofs: tree.proofs,
          },
          entries: redactedRows.map((row, idx) => ({
            id: row.id,
            sequence_number: row.sequence_number,
            created_at: row.created_at,
            action: row.action,
            resource_type: row.resource_type,
            resource_id: row.resource_id,
            user_id: row.user_id,
            ip_address: row.ip_address,
            details: row.details,
            entry_hash: row.entry_hash,
            entry_mac: row.entry_mac,
            prev_hash: row.prev_hash,
            hash_algo: row.hash_algo,
            leaf_hash: tree.leafHashes[idx],
          })),
        },
        {
          headers: {
            'Content-Disposition': `attachment; filename="audit-log-${today}.json"`,
          },
        },
      );
    }

    // CSV path (default — unchanged for backwards compat)
    const header = [
      'id',
      'created_at',
      'action',
      'entity_type',
      'entity_id',
      'user_id',
      'ip_address',
      'details',
    ];

    const rows = redactedRows.map((row) =>
      [
        row.id,
        row.created_at,
        row.action,
        row.resource_type,
        row.resource_id,
        row.user_id,
        row.ip_address,
        row.details,
      ]
        .map(escapeCsv)
        .join(','),
    );

    const csv = [header.join(','), ...rows].join('\n');

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="audit-log-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (err) {
    log.error({ err }, 'unexpected error');
    return new NextResponse('Failed to export', { status: 500 });
  }
}
