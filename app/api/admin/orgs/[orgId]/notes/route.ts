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
    const note = String(body?.note ?? "").trim();

    if (!note) {
      return NextResponse.json({ error: "Note is required" }, { status: 400 });
    }

    const admin = createSupabaseAdminClient();
    await admin.from("admin_notes").insert({
      org_id: orgId,
      note,
      created_by: user.id,
    });

    await logAdminAction({
      actorUserId: user.id,
      action: "admin_note_create",
      targetType: "organization",
      targetId: orgId,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleAdminError(error, '/api/admin/orgs/[orgId]/notes');
  }
}
