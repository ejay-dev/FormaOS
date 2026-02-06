"use server";

import { revalidatePath } from "next/cache";
import { requireFounderAccess } from "@/app/app/admin/access";
import {
  ensureOrgProvisioning,
  ensureUserProvisioning,
} from "@/lib/provisioning/ensure-provisioning";

export async function repairUserProvisioning(formData: FormData) {
  await requireFounderAccess();
  const userId = String(formData.get("userId") ?? "").trim();
  if (!userId) {
    throw new Error("Missing userId");
  }

  await ensureUserProvisioning({ userId });
  revalidatePath("/admin/support");
}

export async function repairOrgProvisioning(formData: FormData) {
  await requireFounderAccess();
  const orgId = String(formData.get("orgId") ?? "").trim();
  if (!orgId) {
    throw new Error("Missing orgId");
  }

  await ensureOrgProvisioning({ orgId });
  revalidatePath("/admin/support");
}
