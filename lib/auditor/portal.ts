import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSupabaseOrgClient } from '@/lib/supabase/org-scoped';
import { randomBytes, createHash } from 'crypto';

type AuditorConfig = {
  auditorName: string;
  auditorEmail: string;
  auditorCompany?: string;
  scopes: {
    frameworks?: string[];
    dateRange?: { from: string; to: string };
    evidenceTypes?: string[];
  };
  expiresInDays: number;
};

/**
 * Create a time-limited, scope-restricted access token for an external auditor.
 * Returns the raw token (only shown once) and the stored record.
 */
export async function createAuditorAccess(
  orgId: string,
  createdBy: string,
  config: AuditorConfig,
) {
  const rawToken = randomBytes(32).toString('hex');
  const tokenHash = createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(
    Date.now() + config.expiresInDays * 24 * 60 * 60 * 1000,
  );

  const supabase = createSupabaseOrgClient(orgId);
  // org_id is stamped automatically by the org-scoped client.
  const { data, error } = await supabase
    .from('auditor_access_tokens')
    .insert({
      auditor_name: config.auditorName,
      auditor_email: config.auditorEmail,
      auditor_company: config.auditorCompany ?? null,
      token_hash: tokenHash,
      scopes: config.scopes,
      expires_at: expiresAt.toISOString(),
      created_by: createdBy,
    })
    .select()
    .single();

  if (error)
    throw new Error(`Failed to create auditor access: ${error.message}`);

  return { token: rawToken, record: data };
}

/**
 * Revoke an auditor access token.
 */
export async function revokeAuditorAccess(tokenId: string, orgId: string) {
  const supabase = createSupabaseOrgClient(orgId);
  // .eq('org_id', orgId) appended automatically.
  const { error } = await supabase
    .from('auditor_access_tokens')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', tokenId);

  if (error) throw new Error(`Failed to revoke: ${error.message}`);
}

/**
 * Validate an auditor token. Returns the token record if valid, null otherwise.
 *
 * Intentional admin client: the caller has only the raw token, not an
 * org id. The lookup by token_hash IS the org discovery step. Same
 * pattern as validateApiKey in lib/api-keys/manager.ts.
 */
export async function validateAuditorToken(token: string) {
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const db = createSupabaseAdminClient();

  const { data, error } = await db
    .from('auditor_access_tokens')
    .select('*')
    .eq('token_hash', tokenHash)
    .is('revoked_at', null)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (error || !data) return null;

  // Update access stats
  await db
    .from('auditor_access_tokens')
    .update({
      last_accessed_at: new Date().toISOString(),
      access_count: (data.access_count ?? 0) + 1,
    })
    .eq('id', data.id);

  return data;
}

type AuditorAccessRow = {
  id: string;
  auditor_name: string;
  auditor_email: string;
  auditor_company: string | null;
  scopes: Record<string, unknown>;
  expires_at: string;
  last_accessed_at: string | null;
  access_count: number | null;
  created_at: string;
  revoked_at: string | null;
};

type AuditorAccessSummary = AuditorAccessRow & {
  status: 'revoked' | 'expired' | 'active';
};

/**
 * List all auditor access tokens for an org (active and expired).
 */
export async function listAuditorAccess(
  orgId: string,
): Promise<AuditorAccessSummary[]> {
  const supabase = createSupabaseOrgClient(orgId);
  const { data } = await supabase
    .from('auditor_access_tokens')
    .select(
      'id, auditor_name, auditor_email, auditor_company, scopes, expires_at, last_accessed_at, access_count, created_at, revoked_at',
    )
    .order('created_at', { ascending: false });

  return ((data ?? []) as AuditorAccessRow[]).map((t) => ({
    ...t,
    status: t.revoked_at
      ? 'revoked'
      : new Date(t.expires_at) < new Date()
        ? 'expired'
        : 'active',
  }));
}

type AuditorActivityRow = {
  id: string;
  token_id: string;
  org_id: string;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
};

/**
 * Get the activity log for an auditor.
 */
export async function getAuditorActivity(
  orgId: string,
  tokenId?: string,
): Promise<AuditorActivityRow[]> {
  const supabase = createSupabaseOrgClient(orgId);
  let query = supabase
    .from('auditor_activity_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);

  if (tokenId) {
    query = query.eq('token_id', tokenId);
  }

  const { data } = await query;
  return (data ?? []) as AuditorActivityRow[];
}

/**
 * Log an auditor activity event.
 */
export async function logAuditorActivity(
  tokenId: string,
  orgId: string,
  action: string,
  resourceType?: string,
  resourceId?: string,
  ipAddress?: string,
  userAgent?: string,
) {
  const supabase = createSupabaseOrgClient(orgId);
  // org_id is stamped automatically by the org-scoped client.
  await supabase.from('auditor_activity_log').insert({
    token_id: tokenId,
    action,
    resource_type: resourceType,
    resource_id: resourceId,
    ip_address: ipAddress,
    user_agent: userAgent,
  });
}
