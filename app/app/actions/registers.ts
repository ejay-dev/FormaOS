"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/logger";
import { requirePermission } from "@/app/app/actions/rbac";

export type AssetType = "hardware" | "software" | "data" | "people" | "facility";
export type RiskCategory = "security" | "compliance" | "operational" | "financial" | "reputational";

async function getOrgContextOrThrow(supabase: any, userId: string) {
  const { data: membership, error } = await supabase
    .from("org_members")
    .select("organization_id")
    .eq("user_id", userId)
    .single();

  if (error || !membership) throw new Error("Access Denied");
  return membership as { organization_id: string };
}

/* =========================
   TRAINING RECORDS (yours, hardened)
   ========================= */
export async function addTrainingRecord(data: {
  userId: string;
  trainingTitle: string;
  completionDate: string;
  expiryDate?: string;
}) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const permissionCtx = await requirePermission("EDIT_CONTROLS");
  const membership = await getOrgContextOrThrow(supabase, user.id);
  if (membership.organization_id !== permissionCtx.orgId) {
    throw new Error("Organization mismatch.");
  }

  const { error } = await supabase.from("org_training_records").insert({
    organization_id: membership.organization_id,
    user_id: data.userId,
    title: data.trainingTitle,
    completion_date: data.completionDate,
    expiry_date: data.expiryDate ?? null,
    verified_by: user.id,
  });

  if (error) throw error;

  // Keep your logger contract: (orgId, eventType, message)
  await logActivity(
    membership.organization_id,
    "register_updated",
    `Recorded training "${data.trainingTitle}" for user ${data.userId}.`
  );

  revalidatePath("/app/registers/training");
  return { success: true };
}

/* =========================
   ASSETS (new)
   ========================= */
export async function createAsset(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const permissionCtx = await requirePermission("EDIT_CONTROLS");
  const membership = await getOrgContextOrThrow(supabase, user.id);
  if (membership.organization_id !== permissionCtx.orgId) {
    throw new Error("Organization mismatch.");
  }

  const name = (formData.get("name") as string) || "";
  const type = (formData.get("type") as AssetType) || "software";
  const owner = (formData.get("owner") as string) || null;
  const criticality = (formData.get("criticality") as string) || "medium";

  if (!name.trim()) throw new Error("Asset name is required");

  const { data: asset, error } = await supabase
    .from("org_assets")
    .insert({
      organization_id: membership.organization_id,
      name,
      type,
      owner,
      criticality,
      confidentiality_req: (formData.get("confidentiality_req") as string) || "low",
      integrity_req: (formData.get("integrity_req") as string) || "low",
      availability_req: (formData.get("availability_req") as string) || "low",
    })
    .select("id, name")
    .single();

  if (error) throw error;

  await logActivity(
    membership.organization_id,
    "register_updated",
    `Asset registered: "${asset?.name ?? name}".`
  );

  revalidatePath("/app/registers");
  return { success: true, assetId: asset?.id };
}

/* =========================
   RISKS (new)
   ========================= */
export async function createRisk(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const permissionCtx = await requirePermission("EDIT_CONTROLS");
  const membership = await getOrgContextOrThrow(supabase, user.id);
  if (membership.organization_id !== permissionCtx.orgId) {
    throw new Error("Organization mismatch.");
  }

  const title = (formData.get("title") as string) || "";
  if (!title.trim()) throw new Error("Risk title is required");

  const likelihood = Number(formData.get("likelihood") ?? 1);
  const impact = Number(formData.get("impact") ?? 1);

  if (Number.isNaN(likelihood) || likelihood < 1 || likelihood > 5) throw new Error("Likelihood must be 1–5");
  if (Number.isNaN(impact) || impact < 1 || impact > 5) throw new Error("Impact must be 1–5");

  const { data: risk, error } = await supabase
    .from("org_risks")
    .insert({
      organization_id: membership.organization_id,
      title,
      description: (formData.get("description") as string) || null,
      category: (formData.get("category") as RiskCategory) || "security",
      likelihood,
      impact,
      status: "open",
      mitigation_strategy: (formData.get("mitigation_strategy") as string) || null,
      owner_id: (formData.get("owner_id") as string) || null,
    })
    .select("id, title, risk_score")
    .single();

  if (error) throw error;

  const score = risk?.risk_score ?? likelihood * impact;
  const severity =
    score >= 15 ? "critical" :
    score >= 10 ? "high" :
    score >= 6 ? "medium" : "low";

  await logActivity(
    membership.organization_id,
    "security_alert",
    `Risk identified: "${risk?.title ?? title}" (score ${score}, ${severity}).`
  );

  revalidatePath("/app/registers");
  return { success: true, riskId: risk?.id, riskScore: score, severity };
}
