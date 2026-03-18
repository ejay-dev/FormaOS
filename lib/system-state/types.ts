/**
 * =========================================================
 * FORMAOS SYSTEM STATE - TYPE DEFINITIONS
 * =========================================================
 * Core types for the OS brain that controls all node/wire behavior.
 * This is the single source of truth for system configuration.
 */

// Plan tiers
export type PlanTier = "trial" | "basic" | "pro" | "enterprise";

// User roles within an organization
export type UserRole = "viewer" | "member" | "admin" | "owner";

// Module identifiers - each represents a node in the system
export type ModuleId = 
  | "controls"
  | "evidence"
  | "audits"
  | "policies"
  | "tasks"
  | "vault"
  | "reports"
  | "registers"
  | "team"
  | "billing"
  | "settings"
  | "admin";

// Node states
export type NodeState = 
  | "locked"      // Dim/hollow - feature not available
  | "activating"  // Pulsing - currently enabling
  | "active"      // Solid glow - fully functional
  | "restricted"  // Amber - limited access
  | "error"       // Red flicker - something wrong
  | "processing"; // Loading state

// Wire states
export type WireState = 
  | "none"        // No connection
  | "animating"   // Currently flowing
  | "connected"   // Stable connection
  | "partial"     // Restricted flow
  | "broken";     // Error state

// Module configuration
export interface ModuleConfig {
  id: ModuleId;
  label: string;
  description: string;
  icon: string;
  nodeType: "policy" | "control" | "evidence" | "audit" | "risk" | "task" | "entity";
  requiredPlan: PlanTier;
  requiredRole: UserRole;
  dependencies: ModuleId[];
  state: NodeState;
}

// User entitlements
export interface UserEntitlements {
  plan: PlanTier;
  role: UserRole;
  trialActive: boolean;
  trialDaysRemaining: number;
  enabledModules: ModuleId[];
  permissions: {
    canCreatePolicies: boolean;
    canManageTeam: boolean;
    canViewAudit: boolean;
    canExportReports: boolean;
    canManageBilling: boolean;
    canAccessAdmin: boolean;
    canEditSettings: boolean;
  };
}

// System state
export interface SystemState {
  initialized: boolean;
  loading: boolean;
  user: {
    id: string;
    email: string;
    name: string;
  } | null;
  organization: {
    id: string;
    name: string;
    plan: PlanTier;
    onboardingCompleted: boolean;
  } | null;
  entitlements: UserEntitlements;
  modules: Map<ModuleId, ModuleConfig>;
  activeFlows: SystemFlow[];
  pendingOperations: PendingOperation[];
}

// System flow - represents data moving between nodes
export interface SystemFlow {
  id: string;
  sourceModule: ModuleId;
  targetModule: ModuleId;
  flowType: "data" | "permission" | "activation";
  state: WireState;
  progress: number; // 0-100
  message?: string;
}

// Pending operation - async work in progress
export interface PendingOperation {
  id: string;
  type: "plan_upgrade" | "feature_enable" | "audit_generate" | "role_change" | "data_sync";
  module: ModuleId;
  startedAt: Date;
  message: string;
  progress: number;
}

// Plan feature matrix
export const PLAN_FEATURES: Record<PlanTier, ModuleId[]> = {
  trial: ["controls", "evidence", "policies", "tasks", "settings"],
  basic: ["controls", "evidence", "policies", "tasks", "vault", "settings"],
  pro: ["controls", "evidence", "policies", "tasks", "vault", "audits", "reports", "team", "settings"],
  enterprise: ["controls", "evidence", "policies", "tasks", "vault", "audits", "reports", "registers", "team", "billing", "settings", "admin"],
};

// Role permission matrix
export const ROLE_PERMISSIONS: Record<UserRole, UserEntitlements["permissions"]> = {
  viewer: {
    canCreatePolicies: false,
    canManageTeam: false,
    canViewAudit: true,
    canExportReports: false,
    canManageBilling: false,
    canAccessAdmin: false,
    canEditSettings: false,
  },
  member: {
    canCreatePolicies: true,
    canManageTeam: false,
    canViewAudit: true,
    canExportReports: true,
    canManageBilling: false,
    canAccessAdmin: false,
    canEditSettings: false,
  },
  admin: {
    canCreatePolicies: true,
    canManageTeam: true,
    canViewAudit: true,
    canExportReports: true,
    canManageBilling: true,
    canAccessAdmin: false,
    canEditSettings: true,
  },
  owner: {
    canCreatePolicies: true,
    canManageTeam: true,
    canViewAudit: true,
    canExportReports: true,
    canManageBilling: true,
    canAccessAdmin: true,
    canEditSettings: true,
  },
};

// Module definitions
export const MODULE_DEFINITIONS: ModuleConfig[] = [
  {
    id: "controls",
    label: "Controls",
    description: "Compliance control framework",
    icon: "Shield",
    nodeType: "control",
    requiredPlan: "trial",
    requiredRole: "viewer",
    dependencies: [],
    state: "locked",
  },
  {
    id: "evidence",
    label: "Evidence",
    description: "Evidence collection & storage",
    icon: "FileCheck",
    nodeType: "evidence",
    requiredPlan: "trial",
    requiredRole: "member",
    dependencies: ["controls"],
    state: "locked",
  },
  {
    id: "policies",
    label: "Policies",
    description: "Policy management",
    icon: "FileText",
    nodeType: "policy",
    requiredPlan: "trial",
    requiredRole: "member",
    dependencies: [],
    state: "locked",
  },
  {
    id: "tasks",
    label: "Tasks",
    description: "Compliance task tracking",
    icon: "CheckSquare",
    nodeType: "task",
    requiredPlan: "trial",
    requiredRole: "member",
    dependencies: ["controls"],
    state: "locked",
  },
  {
    id: "vault",
    label: "Vault",
    description: "Secure document storage",
    icon: "Lock",
    nodeType: "evidence",
    requiredPlan: "basic",
    requiredRole: "member",
    dependencies: ["evidence"],
    state: "locked",
  },
  {
    id: "audits",
    label: "Audits",
    description: "Audit trail & history",
    icon: "History",
    nodeType: "audit",
    requiredPlan: "pro",
    requiredRole: "viewer",
    dependencies: ["controls", "evidence"],
    state: "locked",
  },
  {
    id: "reports",
    label: "Reports",
    description: "Compliance reporting",
    icon: "BarChart3",
    nodeType: "audit",
    requiredPlan: "pro",
    requiredRole: "member",
    dependencies: ["audits"],
    state: "locked",
  },
  {
    id: "registers",
    label: "Registers",
    description: "Asset & training registers",
    icon: "Database",
    nodeType: "control",
    requiredPlan: "enterprise",
    requiredRole: "member",
    dependencies: [],
    state: "locked",
  },
  {
    id: "team",
    label: "Team",
    description: "Team management",
    icon: "Users",
    nodeType: "entity",
    requiredPlan: "pro",
    requiredRole: "admin",
    dependencies: [],
    state: "locked",
  },
  {
    id: "billing",
    label: "Billing",
    description: "Subscription management",
    icon: "CreditCard",
    nodeType: "entity",
    requiredPlan: "enterprise",
    requiredRole: "admin",
    dependencies: [],
    state: "locked",
  },
  {
    id: "settings",
    label: "Settings",
    description: "Organization settings",
    icon: "Settings",
    nodeType: "entity",
    requiredPlan: "trial",
    requiredRole: "admin",
    dependencies: [],
    state: "locked",
  },
  {
    id: "admin",
    label: "Admin",
    description: "Platform administration",
    icon: "ShieldAlert",
    nodeType: "entity",
    requiredPlan: "enterprise",
    requiredRole: "owner",
    dependencies: [],
    state: "locked",
  },
];
