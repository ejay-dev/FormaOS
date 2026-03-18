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
  const environment =
    process.env.VERCEL_ENV === 'production'
      ? 'production'
      : process.env.VERCEL_ENV === 'preview'
        ? 'preview'
        : 'development';
  const metadata = {
    ...(entry.metadata ?? {}),
    environment,
  };

  await Promise.all([
    admin.from("admin_audit_log").insert({
      actor_user_id: entry.actorUserId,
      action: entry.action,
      target_type: entry.targetType,
      target_id: entry.targetId,
      metadata,
    }),
    admin.from('audit_log').insert({
      actor_user_id: entry.actorUserId,
      event_type: entry.action,
      target_type: entry.targetType,
      target_id: entry.targetId,
      environment,
      metadata,
    }),
  ]);
}
