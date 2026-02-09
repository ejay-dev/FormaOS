import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireFounderAccess } from "@/app/app/admin/access";
import { parsePageParams } from "@/app/api/admin/_utils";
import { handleAdminError } from '@/app/api/admin/_helpers';

export async function GET(request: Request) {
  try {
    await requireFounderAccess();
    const admin = createSupabaseAdminClient();
    const url = new URL(request.url);
    const { page, limit, from, to } = parsePageParams(url.searchParams);

    const { data, count } = await admin
      .from("admin_audit_log")
      .select(`
        id,
        actor_user_id,
        action,
        target_type,
        target_id,
        metadata,
        created_at
      `, { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    return NextResponse.json({
      data: data ?? [],
      pagination: {
        page,
        limit,
        total: count ?? 0,
        totalPages: Math.ceil((count ?? 0) / limit),
      },
    });
  } catch (error) {
    return handleAdminError(error, '/api/admin/audit');
  }
}