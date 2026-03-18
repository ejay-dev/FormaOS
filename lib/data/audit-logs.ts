import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getAuditLogs(orgId: string) {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("org_audit_logs")
    .select("*")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching audit logs:", error);
    return [];
  }

  return data;
}