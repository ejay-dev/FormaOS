"use server"

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { requirePermission } from "@/app/app/actions/rbac";
import { logAuditEvent } from "@/app/app/actions/audit-events";
import { actionError, isNextInternalError } from "@/lib/actions/safe";

const REGISTER_RISK_LEVELS = new Set(["low", "medium", "high", "critical"]);

function slugifyRegisterCode(input: string): string {
  return (
    input
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 64) || `register_${Date.now()}`
  );
}

/**
 * Create a typed register entry on org_registers. Used by the new-register
 * sheet on /app/registers. The `type` field is required so NDIS evaluators
 * have something to look for (predicates skip rows with NULL type).
 */
export async function createRegisterEntry(formData: FormData) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");
    const permissionCtx = await requirePermission("EDIT_CONTROLS");

    const name = String(formData.get("name") ?? "").trim();
    const type = String(formData.get("type") ?? "").trim();
    if (!name) throw new Error("Register name is required.");
    if (!type) throw new Error("Register type is required.");

    const description = (formData.get("description") as string | null)?.trim() || null;
    const category = (formData.get("category") as string | null)?.trim() || null;
    const riskLevel = String(formData.get("risk_level") ?? "low");
    if (!REGISTER_RISK_LEVELS.has(riskLevel)) {
      throw new Error("Invalid risk_level.");
    }

    const explicitCode = String(formData.get("code") ?? "").trim();
    const code = explicitCode ? slugifyRegisterCode(explicitCode) : slugifyRegisterCode(name);

    const { data: inserted, error } = await supabase
      .from("org_registers")
      .insert({
        org_id: permissionCtx.orgId,
        code,
        name,
        type,
        description,
        category,
        risk_level: riskLevel,
        fields: [],
        is_active: true,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    await logAuditEvent(
      {
        organizationId: permissionCtx.orgId,
        actorUserId: user.id,
        actorRole: permissionCtx.role,
        entityType: "register",
        entityId: inserted?.id ?? null,
        actionType: "REGISTER_CREATED",
        afterState: { name, type, code, riskLevel },
        reason: "create_register_entry",
      },
      { required: true },
    );

    revalidatePath("/app/registers");
    return { success: true };
  } catch (error) {
    if (isNextInternalError(error)) throw error;
    return actionError(error);
  }
}

export async function createAsset(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  
  // 1. Get User Context
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  const permissionCtx = await requirePermission("EDIT_CONTROLS");

  // 2. Get Organization ID
  const { data: membership } = await supabase
    .from("org_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) throw new Error("No organization found");
  if (membership.organization_id !== permissionCtx.orgId) {
    throw new Error("Organization mismatch.");
  }

  // 3. Extract Data
  const name = formData.get("name") as string;
  const type = formData.get("type") as string;
  const owner = formData.get("owner") as string;
  const criticality = formData.get("criticality") as string;
  const containsPhi = formData.get("contains_phi") === "true";
  const encryptedAtRest = formData.get("encrypted_at_rest") === "true";
  const encryptedInTransit = formData.get("encrypted_in_transit") === "true";

  // 4. Insert into DB
  const { error } = await supabase.from("org_assets").insert({
    organization_id: membership.organization_id,
    name,
    type,
    owner,
    criticality,
    contains_phi: containsPhi,
    encrypted_at_rest: encryptedAtRest,
    encrypted_in_transit: encryptedInTransit,
  });

  if (error) throw new Error(error.message);

  await logAuditEvent({
    organizationId: membership.organization_id,
    actorUserId: user.id,
    actorRole: permissionCtx.role,
    entityType: "asset",
    entityId: null,
    actionType: "ASSET_CREATED",
    afterState: { name, type, owner, criticality },
    reason: "asset_create",
  });

  // 5. Refresh
  revalidatePath("/app/registers");
}

export async function deleteAsset(assetId: string) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");
    const permissionCtx = await requirePermission("EDIT_CONTROLS");

    const { data: asset } = await supabase
      .from("org_assets")
      .select("id, organization_id, name")
      .eq("id", assetId)
      .eq("organization_id", permissionCtx.orgId)
      .maybeSingle();
    if (!asset) throw new Error("Asset not found");
    if (asset.organization_id !== permissionCtx.orgId) {
      throw new Error("Organization mismatch.");
    }

    await supabase
      .from("org_assets")
      .delete()
      .eq("id", assetId)
      .eq("organization_id", asset.organization_id);

    await logAuditEvent({
      organizationId: asset.organization_id,
      actorUserId: user.id,
      actorRole: permissionCtx.role,
      entityType: "asset",
      entityId: assetId,
      actionType: "ASSET_DELETED",
      beforeState: { name: asset.name },
      reason: "asset_delete",
    });
    revalidatePath("/app/registers");
}
