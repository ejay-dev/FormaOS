'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { insertOrgAuditLog } from '@/lib/audit/org-audit-log';
import { consoleShim } from '@/lib/monitoring/console-shim';

/**
 * Audit v3-013 (2026-05-22): the original implementation called
 * `.maybeSingle()` on `org_members` filtered only by user_id. For the
 * 190 users in prod with >1 org membership, that throws an "expected
 * single row" error and the audit insert silently fails. Multi-org
 * audit trail loss.
 *
 * Fix: accept an explicit `orgId` from the caller. When provided,
 * verify the caller is a member of that org and use it. When NOT
 * provided, fall back to the user's first membership (preserves the
 * old behaviour for single-org users; logs a structured warning so
 * future multi-org callers surface in observability and can be
 * migrated to the explicit-orgId form).
 */
export async function logActivity({
  type,
  description,
  metadata = {},
  orgId,
}: {
  type: string;
  description: string;
  metadata?: Record<string, unknown>;
  orgId?: string;
}) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  let resolvedOrgId: string | null = null;

  if (orgId) {
    // Verify the caller actually belongs to the org they named.
    const { data: membership } = await supabase
      .from('org_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .eq('organization_id', orgId)
      .maybeSingle();
    if (!membership) return; // Cross-org write attempt; silently drop.
    resolvedOrgId = membership.organization_id as string;
  } else {
    // Legacy single-org fallback. Pick the first membership instead of
    // .maybeSingle(), which raises for multi-org users. Future callers
    // SHOULD pass orgId explicitly.
    const { data: memberships } = await supabase
      .from('org_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .order('joined_at', { ascending: true })
      .limit(1);
    const first = (memberships ?? [])[0];
    if (!first?.organization_id) return;
    resolvedOrgId = first.organization_id as string;
    if ((memberships?.length ?? 0) > 0) {
      // Best-effort signal for callers to surface — kept as console
      // until Sentry routing is wired in.
      consoleShim.warn(
        `[lib/actions/audit] logActivity called without orgId for action "${type}"; multi-org users may land audit rows in their first org. Pass orgId explicitly.`,
      );
    }
  }

  await insertOrgAuditLog(supabase, {
    organization_id: resolvedOrgId,
    actor_id: user.id,
    actor_email: user.email ?? null,
    action: type,
    target: description,
    domain: 'system',
    severity: 'low',
    metadata: metadata,
    created_at: new Date().toISOString(),
  });
}
