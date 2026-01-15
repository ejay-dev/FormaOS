import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { rateLimitApi, createRateLimitedResponse } from "@/lib/security/rate-limiter";
import { requirePermission } from "@/app/app/actions/rbac";
import { logAuditEvent } from "@/app/app/actions/audit-events";

export async function POST(req: Request) {
  try {
    const { policyId, html, title } = await req.json()

    if (!policyId || typeof html !== "string") {
      return NextResponse.json({ error: "Missing policyId/html" }, { status: 400 })
    }

    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const rateLimit = await rateLimitApi(req, user.id);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', retryAfter: rateLimit.resetAt },
        { status: 429 }
      );
    }

    const permissionCtx = await requirePermission("EDIT_CONTROLS");

    const { data: policy, error: policyError } = await supabase
      .from("org_policies")
      .select("organization_id, title")
      .eq("id", policyId)
      .maybeSingle();

    if (policyError || !policy) {
      return NextResponse.json({ error: "Policy not found" }, { status: 404 });
    }
    if (policy.organization_id !== permissionCtx.orgId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { error } = await supabase
      .from("org_policies")
      .update({ content: html, title, last_updated_at: new Date().toISOString(), last_updated_by: user.id })
      .eq("id", policyId)
      .eq("organization_id", policy.organization_id)

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    await logAuditEvent({
      organizationId: policy.organization_id,
      actorUserId: user.id,
      actorRole: permissionCtx.role,
      entityType: "policy",
      entityId: policyId,
      actionType: "POLICY_UPDATED",
      beforeState: { title: policy.title },
      afterState: { title, content_length: typeof html === "string" ? html.length : null },
      reason: "policy_editor_update",
    });

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 })
  }
}
