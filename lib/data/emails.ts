import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getOrganizationEmailLogs(orgId: string, limit = 50) {
  const supabase = await createSupabaseServerClient();

  // We are joining with the 'actor' (the admin who triggered the email)
  // and selecting specific metadata for the UI
  const { data, error } = await supabase
    .from("email_logs")
    .select(`
      id,
      email_type,
      recipient_email,
      subject,
      status,
      error_message,
      created_at,
      resend_id,
      user_id
    `)
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[getOrganizationEmailLogs] Forensic Fetch Failed:", error.message);
    return [];
  }

  return data;
}