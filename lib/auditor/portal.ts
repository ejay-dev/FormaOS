import { createSupabaseAdminClient } from '@/lib/supabase/admin';
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

  const db = createSupabaseAdminClient();
  const { data, error } = await db
    .from('auditor_access_tokens')
    .insert({
      org_id: orgId,
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
  const db = createSupabaseAdminClient();
  const { error } = await db
    .from('auditor_access_tokens')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', tokenId)
    .eq('org_id', orgId);

  if (error) throw new Error(`Failed to revoke: ${error.message}`);
}

/**
 * Validate an auditor token. Returns the token record if valid, null otherwise.
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

/**
 * List all auditor access tokens for an org (active and expired).
 */
export async function listAuditorAccess(orgId: string) {
  const db = createSupabaseAdminClient();
  const { data } = await db
    .from('auditor_access_tokens')
    .select(
      'id, auditor_name, auditor_email, auditor_company, scopes, expires_at, last_accessed_at, access_count, created_at, revoked_at',
    )
    .eq('org_id', orgId)
    .order('created_at', { ascending: false });

  return (data ?? []).map((t) => ({
    ...t,
    status: t.revoked_at
      ? 'revoked'
      : new Date(t.expires_at) < new Date()
        ? 'expired'
        : 'active',
  }));
}

/**
 * Get the activity log for an auditor.
 */
export async function getAuditorActivity(orgId: string, tokenId?: string) {
  const db = createSupabaseAdminClient();
  let query = db
    .from('auditor_activity_log')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })
    .limit(200);

  if (tokenId) {
    query = query.eq('token_id', tokenId);
  }

  const { data } = await query;
  return data ?? [];
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
  const db = createSupabaseAdminClient();
  await db.from('auditor_activity_log').insert({
    token_id: tokenId,
    org_id: orgId,
    action,
    resource_type: resourceType,
    resource_id: resourceId,
    ip_address: ipAddress,
    user_agent: userAgent,
  });
}
