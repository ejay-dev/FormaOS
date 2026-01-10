"use server"

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { INDUSTRY_PACKS } from "@/lib/industry-packs"; // Verify this path matches where you saved the file
import { logActivity } from "@/lib/logger";

export async function applyIndustryPack(packId: string) {
  const supabase = await createSupabaseServerClient();
  
  // 1. Identify User
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // 2. Identify Organization
  const { data: membership } = await supabase
    .from("org_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .single();

  if (!membership) throw new Error("No organization found");
  const orgId = membership.organization_id;

  // 3. Get the Pack Data
  // We use the ID string (e.g. "ndis") to look up the object
  const pack = INDUSTRY_PACKS[packId];
  if (!pack) throw new Error("Invalid industry pack");

  // 4. Insert Policies
  const policiesToInsert = pack.policies.map(p => ({
    organization_id: orgId,
    title: p.title,
    content: p.content,
    status: 'published',
    version: 'v1.0',
    author: 'System Template'
  }));
  
  if (policiesToInsert.length > 0) {
    await supabase.from("org_policies").insert(policiesToInsert);
  }

  // 5. Insert Tasks
  const tasksToInsert = pack.tasks.map(t => ({
    organization_id: orgId,
    title: t.title,
    description: t.description,
    status: 'pending'
  }));

  if (tasksToInsert.length > 0) {
    await supabase.from("org_tasks").insert(tasksToInsert);
  }

  // 6. Insert Assets (Registers)
  // Mapping 'criticality' from your TS file to 'risk_level' in DB
  const assetsToInsert = pack.assets.map(a => ({
    organization_id: orgId,
    name: a.name,
    type: a.type,
    risk_level: a.criticality // Auto-mapping
  }));

  if (assetsToInsert.length > 0) {
    await supabase.from("org_assets").insert(assetsToInsert);
  }

  // 7. Log and Refresh
  await logActivity(orgId, "created_policy", `Applied ${pack.name} Framework`);

  revalidatePath("/app");
}