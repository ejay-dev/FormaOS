"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

type AuditEventInput = {
  organizationId: string;
  actorUserId: string | null;
  actorRole: string | null;
  entityType?: string | null;
  entityId?: string | null;
  actionType: string;
  beforeState?: any;
  afterState?: any;
  reason?: string | null;
};

export async function logAuditEvent(payload: AuditEventInput) {
  const supabase = await createSupabaseServerClient();
  try {
    const entityLabel = payload.entityType
      ? `${payload.entityType}${payload.entityId ? `:${payload.entityId}` : ""}`
      : "system";

    await supabase.from("org_audit_logs").insert({
      organization_id: payload.organizationId,
      actor_id: payload.actorUserId,
      actor_email: null,
      action: payload.actionType,
      target: entityLabel,
      domain: "compliance",
      severity: "low",
      metadata: {
        actor_role: payload.actorRole ?? null,
        entity_type: payload.entityType ?? null,
        entity_id: payload.entityId ?? null,
        before_state: payload.beforeState ?? null,
        after_state: payload.afterState ?? null,
        reason: payload.reason ?? null,
      },
      created_at: new Date().toISOString(),
    });
  } catch {
    // audit logging must be best-effort to avoid blocking operations
  }
}
