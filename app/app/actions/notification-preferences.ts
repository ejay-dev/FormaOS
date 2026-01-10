"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getNotificationPreferences() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("org_notification_prefs")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (error) throw error;
  return data;
}

export async function updateNotificationPreferences(updates: {
  in_app_enabled?: boolean;
  email_enabled?: boolean;
  policy_updates?: boolean;
  evidence_updates?: boolean;
  task_updates?: boolean;
  security_updates?: boolean;
}) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("org_notification_prefs")
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq("user_id", user.id);

  if (error) throw error;

  return { success: true };
}