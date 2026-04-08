// FIXED: Import your specific function name
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { insertOrgAuditLog } from '@/lib/audit/org-audit-log';

interface LogActivityParams {
  orgId: string;
  action: string;
  targetId: string;
  diff?: {
    before?: unknown;
    after?: unknown;
  };
  metadata?: Record<string, unknown>;
}

export async function logActivity({
  orgId,
  action,
  targetId,
  diff,
  metadata,
}: LogActivityParams) {
  try {
    // FIXED: Use the function name exactly as exported in your server file
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('Audit Log Error: No authenticated user found.');
      return;
    }

    const { error } = await insertOrgAuditLog(supabase, {
      organization_id: orgId,
      actor_id: user.id,
      actor_email: user.email ?? null,
      action: action.toUpperCase(),
      target: targetId,
      diff: diff || {},
      metadata: metadata || {},
    });

    if (error) {
      console.error('FAILED TO LOG AUDIT EVENT:', error.message);
    }
  } catch (err) {
    console.error('Unexpected Audit Log Error:', err);
  }
}
