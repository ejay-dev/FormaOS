import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import {
  extractMissingSupabaseColumn,
  type SupabaseErrorLike,
} from '@/lib/supabase/schema-compat';

type AuditClient = Pick<SupabaseClient<any, any, any>, 'from'>;

export interface OrgAuditLogPayload {
  organization_id: string;
  action: string;
  target?: string | null;
  target_resource?: string | null;
  actor_email?: string | null;
  actor_id?: string | null;
  domain?: string | null;
  severity?: string | null;
  metadata?: unknown;
  details?: unknown;
  diff?: unknown;
  /**
   * Structured entity columns. Prefer these over a free-form `target`
   * string — the audit-trail reader filters on (entity_type, entity_id)
   * when present and falls back to legacy target parsing otherwise.
   */
  entity_type?: string | null;
  entity_id?: string | null;
  created_at?: string | null;
}

function sanitizeJsonValue(value: unknown) {
  if (value === undefined) {
    return null;
  }

  try {
    return JSON.parse(JSON.stringify(value)) as unknown;
  } catch {
    return { value: String(value) };
  }
}

function buildMetadata(payload: OrgAuditLogPayload) {
  const hasDetails = payload.details !== undefined;
  const hasDiff = payload.diff !== undefined;

  if (!hasDetails && !hasDiff) {
    return sanitizeJsonValue(payload.metadata);
  }

  const metadata: Record<string, unknown> = {};
  if (payload.metadata !== undefined) {
    metadata.metadata = sanitizeJsonValue(payload.metadata);
  }
  if (payload.details !== undefined) {
    metadata.details = sanitizeJsonValue(payload.details);
  }
  if (payload.diff !== undefined) {
    metadata.diff = sanitizeJsonValue(payload.diff);
  }
  return metadata;
}

function buildRow(payload: OrgAuditLogPayload) {
  // Prefer an explicit target. If the caller didn't pass one but did pass
  // typed entity columns, synthesize the legacy `target='entityType:entityId'`
  // shape so the audit panel's fallback path keeps working alongside the
  // new typed-column lookup.
  const explicitTarget =
    payload.target?.trim() || payload.target_resource?.trim();
  const synthesizedTarget =
    !explicitTarget && payload.entity_type && payload.entity_id
      ? `${payload.entity_type}:${payload.entity_id}`
      : null;

  return {
    organization_id: payload.organization_id,
    action: payload.action,
    target: explicitTarget || synthesizedTarget || payload.action,
    actor_email: payload.actor_email?.trim() || 'system@formaos.com',
    actor_id: payload.actor_id ?? null,
    domain: payload.domain ?? null,
    severity: payload.severity ?? null,
    metadata: buildMetadata(payload),
    entity_type: payload.entity_type ?? null,
    entity_id: payload.entity_id ?? null,
    created_at: payload.created_at ?? new Date().toISOString(),
  };
}

function stripUnsupportedColumn(
  rows: Array<Record<string, unknown>>,
  removableColumns: Array<Set<string>>,
  column: string,
) {
  let removed = false;
  const nextRows = rows.map((row, index) => {
    if (!removableColumns[index].has(column)) {
      return row;
    }

    removableColumns[index].delete(column);
    removed = true;
    const next = { ...row };
    delete next[column];
    return next;
  });

  return { removed, nextRows };
}

export async function insertOrgAuditLog(
  client: AuditClient,
  payload: OrgAuditLogPayload | OrgAuditLogPayload[],
) {
  const rows: Array<Record<string, unknown>> = (
    Array.isArray(payload) ? payload : [payload]
  ).map(buildRow);
  const removableColumns = rows.map((row) => new Set(Object.keys(row)));
  let candidateRows = rows;

  for (;;) {
    const { error } = await client.from('org_audit_logs').insert(candidateRows);
    if (!error) {
      return { error: null };
    }

    const missingColumn = extractMissingSupabaseColumn(
      error as SupabaseErrorLike,
      'org_audit_logs',
    );

    if (!missingColumn) {
      return { error };
    }

    const { removed, nextRows } = stripUnsupportedColumn(
      candidateRows,
      removableColumns,
      missingColumn,
    );

    if (!removed) {
      return { error };
    }

    candidateRows = nextRows;
  }
}
