"use server"

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { INDUSTRY_PACKS } from "@/lib/industry-packs";
import { logActivity } from "@/lib/logger";
import { revalidatePath } from "next/cache";

export async function applyIndustryPack(industryId: string) {
  console.log(`🚀 Starting Industry Pack: ${industryId}`);

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    console.error("❌ No User Found");
    throw new Error("Unauthorized: Please log in.");
  }

  // 1. Get Organization (SAFE VERSION — no crashes)
  const { data: membership, error: memError } = await supabase
    .from("org_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .maybeSingle(); // <-- CRITICAL FIX

  if (memError) {
    console.error("❌ Membership Query Error:", memError);
    throw new Error("Failed to verify organization membership.");
  }

  const orgId = membership?.organization_id;

  if (!orgId) {
    console.error("❌ No organization_id found for user:", user.id);
    throw new Error("Organization not found.");
  }

  const pack = INDUSTRY_PACKS[industryId];
  if (!pack) throw new Error("Invalid industry pack ID.");

  // 2. INSERT POLICIES
  const policiesToInsert = pack.policies.map(p => ({
    organization_id: orgId,
    title: p.title,
    content: p.content,
    status: "draft",
    version: "v0.1",
    author: "System Template"
  }));

  const { error: policyError } = await supabase
    .from("org_policies")
    .insert(policiesToInsert);

  if (policyError) {
    console.error("❌ Policy Insert Error:", policyError.message);
    throw new Error("Failed to create policies: " + policyError.message);
  }

  // 3. INSERT TASKS
  const tasksToInsert = pack.tasks.map(t => ({
    organization_id: orgId,
    title: t.title,
    description: t.description,
    status: "pending",
    priority: "high"
  }));

  const { error: taskError } = await supabase
    .from("org_tasks")
    .insert(tasksToInsert);

  if (taskError) {
    console.error("❌ Task Insert Error:", taskError.message);
    throw new Error("Failed to create tasks: " + taskError.message);
  }

  // 4. INSERT ASSETS
  const assetsToInsert = pack.assets.map(a => ({
    organization_id: orgId,
    name: a.name,
    type: a.type,
    criticality: a.criticality,
    owner: "Unassigned"
  }));

  const { error: assetError } = await supabase
    .from("org_assets")
    .insert(assetsToInsert);

  if (assetError) {
    console.error("❌ Asset Insert Error:", assetError.message);
    throw new Error("Failed to create assets: " + assetError.message);
  }

  // 5. Success Log
  await logActivity(orgId, "applied_industry_pack", pack.name);
  revalidatePath("/app");

  console.log("✅ Industry pack applied successfully:", pack.name);

  return { success: true };
}