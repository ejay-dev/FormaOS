import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireFounderAccess } from "@/app/app/admin/access";
import { logAdminAction } from "@/lib/admin/audit";
import { handleAdminError } from '@/app/api/admin/_helpers';

type Params = {
  params: Promise<{ orgId: string }>;
};

export async function POST(request: Request, { params }: Params) {
  try {
    const { user } = await requireFounderAccess();
    const { orgId } = await params;
    const contentType = request.headers.get("content-type") ?? "";
    const body = contentType.includes("application/json")
      ? await request.json().catch(() => ({}))
      : Object.fromEntries(await request.formData());
    const locked = Boolean(body?.locked);

    const admin = createSupabaseAdminClient();
    if (locked) {
      await admin
        .from("org_subscriptions")
        .upsert({
          organization_id: orgId,
          status: "blocked",
          updated_at: new Date().toISOString(),
        });
    } else {
      const { data: subscription } = await admin
        .from("org_subscriptions")
        .select("stripe_subscription_id, trial_expires_at, current_period_end")
        .eq("organization_id", orgId)
        .maybeSingle();

      const trialEnd = subscription?.trial_expires_at ?? subscription?.current_period_end;
      const trialActive =
        trialEnd && !Number.isNaN(new Date(trialEnd).getTime())
          ? Date.now() <= new Date(trialEnd).getTime()
          : false;
      const status = subscription?.stripe_subscription_id
        ? "active"
        : trialActive
        ? "trialing"
        : "pending";

      await admin
        .from("org_subscriptions")
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq("organization_id", orgId);
    }

    await logAdminAction({
      actorUserId: user.id,
      action: locked ? "org_lock" : "org_unlock",
      targetType: "organization",
      targetId: orgId,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleAdminError(error, '/api/admin/orgs/[orgId]/lock');
  }
}
