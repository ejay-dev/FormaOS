export type Role = "owner" | "employee";

export const ROLE_CAPABILITIES = {
  owner: {
    canManagePeople: true,
    canViewAudit: true,
    canManageBilling: true,
  },
  employee: {
    canManagePeople: false,
    canViewAudit: false,
    canManageBilling: false,
  },
} as const;