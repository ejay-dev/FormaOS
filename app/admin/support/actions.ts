"use server";

import { revalidatePath } from "next/cache";
import { requireAdminAccess } from "@/app/app/admin/access";
import {
  ensureOrgProvisioning,
  ensureUserProvisioning,
} from "@/lib/provisioning/ensure-provisioning";
import { logAdminAction } from "@/lib/admin/audit";

export async function repairUserProvisioning(formData: FormData) {
  const access = await requireAdminAccess({ permission: "support:manage" });
  const userId = String(formData.get("userId") ?? "").trim();
  if (!userId) {
    throw new Error("Missing userId");
  }

  await ensureUserProvisioning({ userId });
  await logAdminAction({
    actorUserId: access.user.id,
    action: "repair_user",
    targetType: "user",
    targetId: userId,
  });
  revalidatePath("/admin/support");
}

export async function repairOrgProvisioning(formData: FormData) {
  const access = await requireAdminAccess({ permission: "support:manage" });
  const orgId = String(formData.get("orgId") ?? "").trim();
  if (!orgId) {
    throw new Error("Missing orgId");
  }

  await ensureOrgProvisioning({ orgId });
  await logAdminAction({
    actorUserId: access.user.id,
    action: "repair_org",
    targetType: "organization",
    targetId: orgId,
  });
  revalidatePath("/admin/support");
}
