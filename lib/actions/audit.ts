'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { insertOrgAuditLog } from '@/lib/audit/org-audit-log';

export async function logActivity({
  type,
  description,
  metadata = {},
}: {
  type: string;
  description: string;
  metadata?: Record<string, unknown>;
}) {
  const supabase = await createSupabaseServerClient();

  // 1. Get current user and their organization
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: membership } = await supabase
    .from('org_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!membership) return;

  // 2. Insert into Audit Log
  await insertOrgAuditLog(supabase, {
    organization_id: membership.organization_id,
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
