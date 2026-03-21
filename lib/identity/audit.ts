import { jsPDF } from 'jspdf';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { insertOrgAuditLog } from '@/lib/audit/org-audit-log';

export type IdentityEventType =
  | 'scim.user.create'
  | 'scim.user.update'
  | 'scim.user.delete'
  | 'scim.group.create'
  | 'scim.group.update'
  | 'scim.group.delete'
  | 'scim.bulk'
  | 'sso.login'
  | 'sso.logout'
  | 'sso.test'
  | 'sso.metadata.generated'
  | 'jit.user.provisioned'
  | 'jit.user.updated'
  | 'directory.sync.started'
  | 'directory.sync.completed'
  | 'directory.sync.failed'
  | 'auth.password.changed'
  | 'auth.mfa.enrolled'
  | 'auth.mfa.removed'
  | 'auth.api_key.created'
  | 'auth.api_key.revoked'
  | 'session.created'
  | 'session.revoked'
  | 'governance.retention.executed'
  | 'governance.pii.scan'
  | 'governance.isolation.verified'
  | 'governance.residency.violation';

export type IdentityAuditActorType = 'user' | 'scim_client' | 'system';
export type IdentityAuditResult = 'success' | 'failure';
export type IdentityAuditFormat = 'json' | 'csv' | 'pdf';

export interface IdentityAuditEventRecord {
  id: string;
  created_at: string;
  event_type: IdentityEventType;
  actor_type: IdentityAuditActorType;
  actor_id: string | null;
  actor_label: string | null;
  target_user_id: string | null;
  target_user_email: string | null;
  org_id: string;
  ip_address: string | null;
  user_agent: string | null;
  result: IdentityAuditResult;
  metadata: Record<string, unknown>;
}

export interface IdentityAuditEventInput {
  eventType: IdentityEventType;
  actorType: IdentityAuditActorType;
  orgId: string;
  result: IdentityAuditResult;
  actorId?: string | null;
  actorLabel?: string | null;
  targetUserId?: string | null;
  targetUserEmail?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown>;
}

export interface IdentityAuditFilters {
  orgId: string;
  eventTypes?: IdentityEventType[];
  actorId?: string | null;
  actorLabel?: string | null;
  targetUserId?: string | null;
  targetUserEmail?: string | null;
  result?: IdentityAuditResult;
  dateFrom?: string | null;
  dateTo?: string | null;
  limit?: number;
  offset?: number;
}

function sanitizeMetadata(
  metadata: Record<string, unknown> | undefined,
): Record<string, unknown> {
  if (!metadata) return {};
  return JSON.parse(JSON.stringify(metadata)) as Record<string, unknown>;
}

export async function logIdentityEvent(
  input: IdentityAuditEventInput,
): Promise<void> {
  try {
    const admin = createSupabaseAdminClient();
    const metadata = sanitizeMetadata(input.metadata);

    await admin.from('identity_audit_events').insert({
      event_type: input.eventType,
      actor_type: input.actorType,
      actor_id: input.actorId ?? null,
      actor_label: input.actorLabel ?? null,
      target_user_id: input.targetUserId ?? null,
      target_user_email: input.targetUserEmail ?? null,
      org_id: input.orgId,
      ip_address: input.ipAddress ?? null,
      user_agent: input.userAgent ?? null,
      result: input.result,
      metadata,
    });

    await insertOrgAuditLog(admin, {
      organization_id: input.orgId,
      actor_id: input.actorId ?? null,
      actor_email: input.actorLabel ?? input.targetUserEmail ?? 'system',
      action: input.eventType,
      target:
        input.targetUserEmail ??
        input.targetUserId ??
        input.actorLabel ??
        'identity',
      domain: 'security',
      severity: input.result === 'failure' ? 'high' : 'low',
      metadata: {
        actor_type: input.actorType,
        target_user_id: input.targetUserId ?? null,
        target_user_email: input.targetUserEmail ?? null,
        result: input.result,
        ...metadata,
      },
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[identity/audit] failed to log identity event', error);
  }
}

export async function queryIdentityEvents(filters: IdentityAuditFilters): Promise<{
  events: IdentityAuditEventRecord[];
  total: number;
}> {
  const admin = createSupabaseAdminClient();
  const limit = Math.min(200, Math.max(1, filters.limit ?? 50));
  const offset = Math.max(0, filters.offset ?? 0);

  let query = admin
    .from('identity_audit_events')
    .select('*', { count: 'exact' })
    .eq('org_id', filters.orgId);

  if (filters.eventTypes?.length) {
    query = query.in('event_type', filters.eventTypes);
  }
  if (filters.actorId) {
    query = query.eq('actor_id', filters.actorId);
  }
  if (filters.actorLabel) {
    query = query.ilike('actor_label', `%${filters.actorLabel}%`);
  }
  if (filters.targetUserId) {
    query = query.eq('target_user_id', filters.targetUserId);
  }
  if (filters.targetUserEmail) {
    query = query.ilike('target_user_email', `%${filters.targetUserEmail}%`);
  }
  if (filters.result) {
    query = query.eq('result', filters.result);
  }
  if (filters.dateFrom) {
    query = query.gte('created_at', filters.dateFrom);
  }
  if (filters.dateTo) {
    query = query.lte('created_at', filters.dateTo);
  }

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw new Error(error.message);
  }

  return {
    events: ((data ?? []) as IdentityAuditEventRecord[]).map((row) => ({
      ...row,
      metadata:
        row.metadata && typeof row.metadata === 'object'
          ? row.metadata
          : {},
    })),
    total: count ?? 0,
  };
}

function toCsv(rows: IdentityAuditEventRecord[]): string {
  const headers = [
    'timestamp',
    'event_type',
    'actor_type',
    'actor_id',
    'actor_label',
    'target_user_id',
    'target_user_email',
    'org_id',
    'ip_address',
    'result',
    'metadata',
  ];

  const lines = rows.map((row) =>
    [
      row.created_at,
      row.event_type,
      row.actor_type,
      row.actor_id ?? '',
      row.actor_label ?? '',
      row.target_user_id ?? '',
      row.target_user_email ?? '',
      row.org_id,
      row.ip_address ?? '',
      row.result,
      JSON.stringify(row.metadata ?? {}),
    ]
      .map((value) => `"${String(value).replace(/"/g, '""')}"`)
      .join(','),
  );

  return [headers.join(','), ...lines].join('\n');
}

function toPdf(rows: IdentityAuditEventRecord[]): Buffer {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  let y = 36;
  doc.setFontSize(14);
  doc.text('FormaOS Identity Audit Export', 36, y);
  y += 20;
  doc.setFontSize(9);

  for (const row of rows) {
    const line = `${row.created_at} | ${row.event_type} | ${row.result} | ${
      row.target_user_email ?? row.target_user_id ?? row.actor_label ?? 'n/a'
    }`;
    const split = doc.splitTextToSize(line, 520);
    doc.text(split, 36, y);
    y += split.length * 11 + 4;

    if (y > 760) {
      doc.addPage();
      y = 36;
    }
  }

  return Buffer.from(doc.output('arraybuffer'));
}

export async function exportIdentityEvents(
  filters: IdentityAuditFilters,
  format: IdentityAuditFormat,
): Promise<{
  mimeType: string;
  filename: string;
  body: string | Buffer;
}> {
  const { events } = await queryIdentityEvents({
    ...filters,
    limit: Math.min(5000, filters.limit ?? 1000),
    offset: 0,
  });

  if (format === 'csv') {
    return {
      mimeType: 'text/csv; charset=utf-8',
      filename: `identity-audit-${filters.orgId}.csv`,
      body: toCsv(events),
    };
  }

  if (format === 'pdf') {
    return {
      mimeType: 'application/pdf',
      filename: `identity-audit-${filters.orgId}.pdf`,
      body: toPdf(events),
    };
  }

  return {
    mimeType: 'application/json; charset=utf-8',
    filename: `identity-audit-${filters.orgId}.json`,
    body: JSON.stringify(events, null, 2),
  };
}
