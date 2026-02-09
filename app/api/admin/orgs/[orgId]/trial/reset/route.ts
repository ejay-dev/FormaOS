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
    const admin = createSupabaseAdminClient();

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString();

    await admin
      .from("org_subscriptions")
      .upsert({
        organization_id: orgId,
        status: "trialing",
        trial_started_at: now.toISOString(),
        trial_expires_at: expiresAt,
        current_period_end: expiresAt,
        updated_at: now.toISOString(),
      });

    await logAdminAction({
      actorUserId: user.id,
      action: "trial_reset",
      targetType: "organization",
      targetId: orgId,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleAdminError(error, '/api/admin/orgs/[orgId]/trial/reset');
  }
}
