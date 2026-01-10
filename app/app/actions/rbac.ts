import { createSupabaseServerClient } from "@/lib/supabase/server";

export type PermissionKey =
  | "VIEW_CONTROLS"
  | "EDIT_CONTROLS"
  | "UPLOAD_EVIDENCE"
  | "APPROVE_EVIDENCE"
  | "REJECT_EVIDENCE"
  | "RESOLVE_COMPLIANCE_BLOCK"
  | "EXPORT_REPORTS"
  | "GENERATE_CERTIFICATIONS"
  | "MANAGE_USERS"
  | "VIEW_AUDIT_LOGS";

export type RoleKey = "OWNER" | "COMPLIANCE_OFFICER" | "MANAGER" | "STAFF" | "VIEWER" | "AUDITOR";

const ROLE_ALIASES: Record<string, RoleKey> = {
  owner: "OWNER",
  admin: "COMPLIANCE_OFFICER",
  compliance_officer: "COMPLIANCE_OFFICER",
  manager: "MANAGER",
  staff: "STAFF",
  member: "STAFF",
  viewer: "VIEWER",
  auditor: "VIEWER",
};

const ROLE_PERMISSIONS: Record<RoleKey, PermissionKey[]> = {
  OWNER: [
    "VIEW_CONTROLS",
    "EDIT_CONTROLS",
    "UPLOAD_EVIDENCE",
    "APPROVE_EVIDENCE",
    "REJECT_EVIDENCE",
    "RESOLVE_COMPLIANCE_BLOCK",
    "EXPORT_REPORTS",
    "GENERATE_CERTIFICATIONS",
    "MANAGE_USERS",
    "VIEW_AUDIT_LOGS",
  ],
  COMPLIANCE_OFFICER: [
    "VIEW_CONTROLS",
    "EDIT_CONTROLS",
    "UPLOAD_EVIDENCE",
    "APPROVE_EVIDENCE",
    "REJECT_EVIDENCE",
    "RESOLVE_COMPLIANCE_BLOCK",
    "EXPORT_REPORTS",
    "GENERATE_CERTIFICATIONS",
    "VIEW_AUDIT_LOGS",
  ],
  MANAGER: [
    "VIEW_CONTROLS",
    "EDIT_CONTROLS",
    "UPLOAD_EVIDENCE",
    "APPROVE_EVIDENCE",
    "REJECT_EVIDENCE",
    "RESOLVE_COMPLIANCE_BLOCK",
    "EXPORT_REPORTS",
    "VIEW_AUDIT_LOGS",
  ],
  STAFF: ["VIEW_CONTROLS", "UPLOAD_EVIDENCE"],
  VIEWER: ["VIEW_CONTROLS", "EXPORT_REPORTS", "VIEW_AUDIT_LOGS"],
  AUDITOR: ["VIEW_CONTROLS", "EXPORT_REPORTS", "VIEW_AUDIT_LOGS"],
};

export function normalizeRole(role?: string | null): RoleKey {
  if (!role) return "STAFF";
  const key = role.toLowerCase();
  return ROLE_ALIASES[key] || "STAFF";
}

export async function getUserOrgMembership() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: membership, error } = await supabase
    .from("org_members")
    .select("organization_id, role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !membership?.organization_id) {
    throw new Error("Organization context lost");
  }

  const role = normalizeRole(membership.role as string | null);
  return { orgId: membership.organization_id as string, role, userId: user.id };
}

export async function getEntityScopeForUser() {
  const supabase = await createSupabaseServerClient();
  const membership = await getUserOrgMembership();

  try {
    const { data: entities } = await supabase
      .from("org_entity_members")
      .select("entity_id")
      .eq("organization_id", membership.orgId)
      .eq("user_id", membership.userId);

    const entityIds = (entities ?? []).map((row: any) => row.entity_id).filter(Boolean);
    return { ...membership, entityIds };
  } catch {
    return { ...membership, entityIds: [] as string[] };
  }
}

export function hasPermission(role: RoleKey, permission: PermissionKey) {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export async function requirePermission(permission: PermissionKey) {
  const membership = await getUserOrgMembership();
  if (!hasPermission(membership.role, permission)) {
    throw new Error(`Access denied: missing permission ${permission}`);
  }
  return membership;
}
