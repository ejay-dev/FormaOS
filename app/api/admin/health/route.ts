import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireFounderAccess } from "@/app/app/admin/access";
import { handleAdminError } from '@/app/api/admin/_helpers';

export async function GET() {
  try {
    await requireFounderAccess();
    const admin = createSupabaseAdminClient();

    const [{ data: billingEvents }, { data: auditEvents }] = await Promise.all([
      admin
        .from("billing_events")
        .select("id, event_type, processed_at")
        .order("processed_at", { ascending: false })
        .limit(20),
      admin
        .from("admin_audit_log")
        .select("id, action, target_type, target_id, created_at")
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

    return NextResponse.json({
      billingEvents: billingEvents ?? [],
      adminAudit: auditEvents ?? [],
    });
  } catch (error) {
    return handleAdminError(error, '/api/admin/health');
  }
}
