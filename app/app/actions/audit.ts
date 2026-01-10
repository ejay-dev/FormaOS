"use server"

import { createSupabaseServerClient } from "@/lib/supabase/server";

type LogActivityPayload = {
  type: string;
  description: string;
  metadata?: any;
  entityType?: string;
  entityId?: string | null;
  beforeState?: any;
  afterState?: any;
  reason?: string | null;
  orgId?: string;
};

export async function logActivity(
  arg1: LogActivityPayload | string,
  arg2?: string,
  arg3?: any,
  arg4?: any
) {
  const supabase = await createSupabaseServerClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: membership } = await supabase
    .from("org_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .single();

  if (!membership) return;

  const payload: LogActivityPayload =
    typeof arg1 === "string"
      ? {
          orgId: arg1,
          type: arg2 || "activity",
          description: typeof arg3 === "string" ? arg3 : (arg3?.event || "activity"),
          metadata: arg4 ?? arg3 ?? {},
        }
      : arg1;

  const orgId = payload.orgId || membership.organization_id;
  if (orgId !== membership.organization_id) return;

  try {
    await supabase.from("org_audit_logs").insert({
      organization_id: orgId,
      actor_id: user.id,
      actor_email: user.email ?? null,
      action: payload.type,
      target: payload.description,
      domain: "compliance",
      severity: "low",
      metadata: {
        entity_type: payload.entityType ?? "activity",
        entity_id: payload.entityId ?? null,
        before_state: payload.beforeState ?? null,
        after_state: payload.afterState ?? payload.metadata ?? null,
        reason: payload.reason ?? null,
        ...(payload.metadata ? { metadata: payload.metadata } : {}),
      },
      created_at: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Audit Event Error:", error?.message || error);
  }
}
