"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function setupWorkspaceAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const organizationName = formData.get("organizationName") as string;

  // 1. Resolve Identity
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Authentication required." };

  // 2. Provision Organization
  const { data: activeOrganization, error: orgError } = await supabase
    .from("organizations")
    .insert({ name: organizationName })
    .select()
    .single();

  if (orgError) return { error: orgError.message };

  // 3. Provision Administrative Membership
  const { error: membershipError } = await supabase
    .from("org_members")
    .insert({
      organization_id: activeOrganization.id,
      user_id: user.id,
      role: "admin",
    });

  if (membershipError) return { error: membershipError.message };

  return { success: true };
}