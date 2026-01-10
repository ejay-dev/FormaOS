"use server"

import { createSupabaseServerClient } from "@/lib/supabase/server";
// UPGRADE: Importing your new robust logger
import { logActivity } from "@/lib/audit-logger"; 

export async function inviteMember(email: string, role: string) {
  const supabase = await createSupabaseServerClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: membership } = await supabase
    .from("org_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .single();

  if (!membership) throw new Error("No organization found");

  // 1. Create Invite & Return the ID
  // We added .select().single() so we can track exactly WHICH record was created
  const { data: newInvite, error } = await supabase.from("org_invites").insert({
    email,
    role,
    organization_id: membership.organization_id,
    status: 'pending'
  }).select().single();

  if (error) throw error;

  // 2. Audit Log (Connected to the new Vault)
  await logActivity({
    orgId: membership.organization_id,
    action: 'MEMBER_INVITE',
    targetId: newInvite.id, // Now links directly to the specific invite ID
    metadata: { 
      email: email, 
      role: role 
    },
    diff: {
      before: null, // New creation, so "before" is null
      after: { status: 'pending', role: role }
    }
  });

  return { success: true };
}