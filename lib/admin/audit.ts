import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type AdminAuditEntry = {
  actorUserId: string;
  action: string;
  targetType: string;
  targetId: string;
  metadata?: Record<string, unknown>;
};

export async function logAdminAction(entry: AdminAuditEntry) {
  const admin = createSupabaseAdminClient();
  await admin.from("admin_audit_log").insert({
    actor_user_id: entry.actorUserId,
    action: entry.action,
    target_type: entry.targetType,
    target_id: entry.targetId,
    metadata: entry.metadata ?? {},
  });
}
