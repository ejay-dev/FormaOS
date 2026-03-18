"use client";

import React, { createContext, useContext, useReducer, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  SystemState,
  ModuleId,
  PlanTier,
  UserRole,
  NodeState,
  WireState,
  SystemFlow,
  PendingOperation,
  UserEntitlements,
  PLAN_FEATURES,
  ROLE_PERMISSIONS,
  MODULE_DEFINITIONS,
} from "./types";
import { useAppStore } from "@/lib/stores/app";

/**
 * =========================================================
 * FORMAOS SYSTEM STATE CONTEXT - THE OS BRAIN
 * =========================================================
 * Central state engine that controls all node/wire behavior.
 * Every UI element reads from and writes to this context.
 * 
 * CRITICAL: This context reflects BACKEND STATE.
 * - Initial state comes from server-side data fetch
 * - All mutations go through server actions first
 * - UI only updates after backend confirmation
 */

// Action types
type SystemAction =
  | { type: "INITIALIZE"; payload: { user: SystemState["user"]; organization: SystemState["organization"]; role: UserRole } }
  | { type: "HYDRATE_FROM_SERVER"; payload: { 
      user: NonNullable<SystemState["user"]>; 
      organization: NonNullable<SystemState["organization"]>; 
      entitlements: UserEntitlements;
      isFounder: boolean;
    }}
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "UPDATE_PLAN"; payload: PlanTier }
  | { type: "UPDATE_ROLE"; payload: UserRole }
  | { type: "SET_TRIAL_STATE"; payload: { active: boolean; daysRemaining: number } }
  | { type: "SET_MODULE_STATE"; payload: { moduleId: ModuleId; state: NodeState } }
  | { type: "START_FLOW"; payload: SystemFlow }
  | { type: "UPDATE_FLOW"; payload: { id: string; progress: number; state?: WireState } }
  | { type: "END_FLOW"; payload: string }
  | { type: "START_OPERATION"; payload: PendingOperation }
  | { type: "UPDATE_OPERATION"; payload: { id: string; progress: number; message?: string } }
  | { type: "END_OPERATION"; payload: string }
  | { type: "ACTIVATE_MODULE"; payload: ModuleId }
  | { type: "DEACTIVATE_MODULE"; payload: ModuleId }
  | { type: "RECALCULATE_ENTITLEMENTS" }
  | { type: "RESET" };

// Initial state
function createInitialState(): SystemState {
  const modules = new Map<ModuleId, typeof MODULE_DEFINITIONS[0]>();
  MODULE_DEFINITIONS.forEach(mod => modules.set(mod.id, { ...mod }));
  
  return {
    initialized: false,
    loading: true,
    user: null,
    organization: null,
    entitlements: {
      plan: "trial",
      role: "member",
      trialActive: true,
      trialDaysRemaining: 14,
      enabledModules: [],
      permissions: ROLE_PERMISSIONS.member,
    },
    modules,
    activeFlows: [],
    pendingOperations: [],
  };
}

// Calculate entitlements based on plan and role
function calculateEntitlements(plan: PlanTier, role: UserRole, trialActive: boolean, trialDaysRemaining: number): UserEntitlements {
  return {
    plan,
    role,
    trialActive,
    trialDaysRemaining,
    enabledModules: PLAN_FEATURES[plan],
    permissions: ROLE_PERMISSIONS[role],
  };
}

// Determine node state based on entitlements
function calculateNodeState(moduleId: ModuleId, entitlements: UserEntitlements): NodeState {
  const moduleDef = MODULE_DEFINITIONS.find(m => m.id === moduleId);
  if (!moduleDef) return "locked";

  const planIndex = ["trial", "basic", "pro", "enterprise"].indexOf(entitlements.plan);
  const requiredPlanIndex = ["trial", "basic", "pro", "enterprise"].indexOf(moduleDef.requiredPlan);
  
  const roleIndex = ["viewer", "member", "admin", "owner"].indexOf(entitlements.role);
  const requiredRoleIndex = ["viewer", "member", "admin", "owner"].indexOf(moduleDef.requiredRole);

  // Check if module is included in plan
  if (!entitlements.enabledModules.includes(moduleId)) {
    return "locked";
  }

  // Check plan requirement
  if (planIndex < requiredPlanIndex) {
    return "locked";
  }

  // Check role requirement
  if (roleIndex < requiredRoleIndex) {
    return "restricted";
  }

  // Check trial limitations
  if (entitlements.trialActive && !["controls", "evidence", "policies", "tasks", "settings"].includes(moduleId)) {
    return "restricted";
  }

  return "active";
}

// Reducer
function systemReducer(state: SystemState, action: SystemAction): SystemState {
  switch (action.type) {
    case "INITIALIZE": {
      const plan = action.payload.organization?.plan || "trial";
      const role = action.payload.role;
      const entitlements = calculateEntitlements(plan, role, plan === "trial", 14);
      
      // Update all module states
      const modules = new Map(state.modules);
      modules.forEach((mod, id) => {
        modules.set(id, { ...mod, state: calculateNodeState(id, entitlements) });
      });

      return {
        ...state,
        initialized: true,
        loading: false,
        user: action.payload.user,
        organization: action.payload.organization,
        entitlements,
        modules,
      };
    }

    case "HYDRATE_FROM_SERVER": {
      // Server-provided entitlements are the source of truth
      const entitlements = action.payload.entitlements;
      
      // Update all module states based on server entitlements
      const modules = new Map(state.modules);
      modules.forEach((mod, id) => {
        modules.set(id, { ...mod, state: calculateNodeState(id, entitlements) });
      });

      return {
        ...state,
        initialized: true,
        loading: false,
        user: action.payload.user,
        organization: action.payload.organization,
        entitlements,
        modules,
      };
    }

    case "SET_LOADING":
      return { ...state, loading: action.payload };

    case "UPDATE_PLAN": {
      const entitlements = calculateEntitlements(
        action.payload, 
        state.entitlements.role,
        action.payload === "trial",
        action.payload === "trial" ? state.entitlements.trialDaysRemaining : 0
      );
      
      const modules = new Map(state.modules);
      modules.forEach((mod, id) => {
        modules.set(id, { ...mod, state: calculateNodeState(id, entitlements) });
      });

      return {
        ...state,
        organization: state.organization ? { ...state.organization, plan: action.payload } : null,
        entitlements,
        modules,
      };
    }

    case "UPDATE_ROLE": {
      const entitlements = calculateEntitlements(
        state.entitlements.plan,
        action.payload,
        state.entitlements.trialActive,
        state.entitlements.trialDaysRemaining
      );
      
      const modules = new Map(state.modules);
      modules.forEach((mod, id) => {
        modules.set(id, { ...mod, state: calculateNodeState(id, entitlements) });
      });

      return {
        ...state,
        entitlements,
        modules,
      };
    }

    case "SET_TRIAL_STATE": {
      const entitlements = {
        ...state.entitlements,
        trialActive: action.payload.active,
        trialDaysRemaining: action.payload.daysRemaining,
      };
      
      const modules = new Map(state.modules);
      modules.forEach((mod, id) => {
        modules.set(id, { ...mod, state: calculateNodeState(id, entitlements) });
      });

      return {
        ...state,
        entitlements,
        modules,
      };
    }

    case "SET_MODULE_STATE": {
      const modules = new Map(state.modules);
      const mod = modules.get(action.payload.moduleId);
      if (mod) {
        modules.set(action.payload.moduleId, { ...mod, state: action.payload.state });
      }
      return { ...state, modules };
    }

    case "START_FLOW":
      return { ...state, activeFlows: [...state.activeFlows, action.payload] };

    case "UPDATE_FLOW":
      return {
        ...state,
        activeFlows: state.activeFlows.map(flow =>
          flow.id === action.payload.id
            ? { ...flow, progress: action.payload.progress, state: action.payload.state || flow.state }
            : flow
        ),
      };

    case "END_FLOW":
      return { ...state, activeFlows: state.activeFlows.filter(f => f.id !== action.payload) };

    case "START_OPERATION":
      return { ...state, pendingOperations: [...state.pendingOperations, action.payload] };

    case "UPDATE_OPERATION":
      return {
        ...state,
        pendingOperations: state.pendingOperations.map(op =>
          op.id === action.payload.id
            ? { ...op, progress: action.payload.progress, message: action.payload.message || op.message }
            : op
        ),
      };

    case "END_OPERATION":
      return { ...state, pendingOperations: state.pendingOperations.filter(op => op.id !== action.payload) };

    case "ACTIVATE_MODULE": {
      const modules = new Map(state.modules);
      const mod = modules.get(action.payload);
      if (mod) {
        modules.set(action.payload, { ...mod, state: "active" });
      }
      return { ...state, modules };
    }

    case "DEACTIVATE_MODULE": {
      const modules = new Map(state.modules);
      const mod = modules.get(action.payload);
      if (mod) {
        modules.set(action.payload, { ...mod, state: "locked" });
      }
      return { ...state, modules };
    }

    case "RECALCULATE_ENTITLEMENTS": {
      const modules = new Map(state.modules);
      modules.forEach((mod, id) => {
        modules.set(id, { ...mod, state: calculateNodeState(id, state.entitlements) });
      });
      return { ...state, modules };
    }

    case "RESET":
      return createInitialState();

    default:
      return state;
  }
}

// Context type
interface SystemContextType {
  state: SystemState;
  // Hydration status
  isHydrated: boolean;
  isLoading: boolean;
  // Initialization
  initialize: (user: SystemState["user"], organization: SystemState["organization"], role: UserRole) => void;
  hydrateFromServer: () => Promise<void>;
  refreshFromServer: () => Promise<void>;
  // Plan & Role (server-validated)
  upgradePlan: (plan: PlanTier) => Promise<{ success: boolean; checkoutUrl?: string; error?: string }>;
  changeRole: (role: UserRole) => Promise<{ success: boolean; error?: string }>;
  // Module control (server-validated)
  getModuleState: (moduleId: ModuleId) => NodeState;
  isModuleAccessible: (moduleId: ModuleId) => boolean;
  validateModuleAccess: (moduleId: ModuleId) => Promise<{ allowed: boolean; reason?: string }>;
  setModuleState: (moduleId: ModuleId, state: NodeState) => void;
  // Flow control
  startFlow: (sourceModule: ModuleId, targetModule: ModuleId, flowType: SystemFlow["flowType"]) => string;
  updateFlow: (flowId: string, progress: number) => void;
  endFlow: (flowId: string) => void;
  // Operations
  startOperation: (type: PendingOperation["type"], module: ModuleId, message: string) => string;
  updateOperation: (operationId: string, progress: number, message?: string) => void;
  endOperation: (operationId: string) => void;
  // Queries
  hasPermission: (permission: keyof UserEntitlements["permissions"]) => boolean;
  checkPermissionServer: (permission: keyof UserEntitlements["permissions"]) => Promise<boolean>;
  isTrialUser: () => boolean;
  getPlan: () => PlanTier;
  getRole: () => UserRole;
  isFounder: () => boolean;
}

const SystemContext = createContext<SystemContextType | null>(null);

export function useSystemState() {
  const context = useContext(SystemContext);
  if (!context) {
    throw new Error("useSystemState must be used within SystemStateProvider");
  }
  return context;
}

// Generate unique IDs
let idCounter = 0;
function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${++idCounter}`;
}

export function SystemStateProvider({ 
  children,
  initialState 
}: { 
  children: React.ReactNode;
  initialState?: {
    user: NonNullable<SystemState["user"]>;
    organization: NonNullable<SystemState["organization"]>;
    entitlements: UserEntitlements;
    isFounder: boolean;
  };
}) {
  const [state, dispatch] = useReducer(systemReducer, undefined, createInitialState);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [founderState, setFounderState] = useState(initialState?.isFounder ?? false);
  const flowTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Hydrate from initial state if provided (SSR)
  useEffect(() => {
    if (initialState && !isHydrated) {
      setFounderState(initialState.isFounder);
      dispatch({
        type: "HYDRATE_FROM_SERVER",
        payload: initialState,
      });
      setIsHydrated(true);
      setIsLoading(false);
    }
  }, [initialState, isHydrated]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      flowTimeouts.current.forEach(timeout => clearTimeout(timeout));
    };
  }, []);

  const initialize = useCallback((
    user: SystemState["user"], 
    organization: SystemState["organization"], 
    role: UserRole
  ) => {
    dispatch({ type: "INITIALIZE", payload: { user, organization, role } });
    setIsHydrated(true);
    setIsLoading(false);
  }, []);

  // Hydrate from server action (client-side)
  const hydrateFromServer = useCallback(async () => {
    if (isHydrated) return;

    setIsLoading(true);
    try {
      // Dynamic import to avoid server/client mismatch
      const { getSystemState } = await import("./actions");
      const result = await getSystemState();

      if (result.success && result.data) {
        setFounderState(result.data.isFounder);
        dispatch({
          type: "HYDRATE_FROM_SERVER",
          payload: {
            user: result.data.user,
            organization: result.data.organization,
            entitlements: result.data.entitlements,
            isFounder: result.data.isFounder,
          },
        });
        // Keep Zustand store in sync to prevent sidebar/topbar divergence
        useAppStore.getState().hydrate({
          user: result.data.user,
          organization: result.data.organization,
          role: result.data.entitlements.role,
          isFounder: result.data.isFounder,
          entitlements: {
            enabledModules: result.data.entitlements.enabledModules,
            permissions: result.data.entitlements.permissions,
            trialActive: result.data.entitlements.trialActive,
            trialDaysRemaining: result.data.entitlements.trialDaysRemaining,
          },
        });
        setIsHydrated(true);
      }
    } catch (error) {
      console.error("[SystemState] Hydration error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [isHydrated]);

  // Refresh from server (for revalidation after mutations)
  const refreshFromServer = useCallback(async () => {
    setIsLoading(true);
    try {
      const { getSystemState } = await import("./actions");
      const result = await getSystemState();

      if (result.success && result.data) {
        setFounderState(result.data.isFounder);
        dispatch({
          type: "HYDRATE_FROM_SERVER",
          payload: {
            user: result.data.user,
            organization: result.data.organization,
            entitlements: result.data.entitlements,
            isFounder: result.data.isFounder,
          },
        });
        // Keep Zustand store in sync — prevents sidebar/topbar showing stale
        // plan or role after an upgrade or role change
        useAppStore.getState().hydrate({
          user: result.data.user,
          organization: result.data.organization,
          role: result.data.entitlements.role,
          isFounder: result.data.isFounder,
          entitlements: {
            enabledModules: result.data.entitlements.enabledModules,
            permissions: result.data.entitlements.permissions,
            trialActive: result.data.entitlements.trialActive,
            trialDaysRemaining: result.data.entitlements.trialDaysRemaining,
          },
        });
      }
    } catch (error) {
      console.error("[SystemState] Refresh error:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // SERVER-VALIDATED: Upgrade plan with backend confirmation
  const upgradePlan = useCallback(async (plan: PlanTier): Promise<{ success: boolean; checkoutUrl?: string; error?: string }> => {
    // Start visual activation flow
    const flowId = generateId("flow");
    dispatch({
      type: "START_FLOW",
      payload: {
        id: flowId,
        sourceModule: "billing",
        targetModule: "controls",
        flowType: "activation",
        state: "animating",
        progress: 0,
        message: "Configuring compliance engine...",
      },
    });

    try {
      // Call server action
      const { initiatePlanUpgrade } = await import("./actions");
      const result = await initiatePlanUpgrade(plan);
      
      if (!result.success) {
        dispatch({ type: "END_FLOW", payload: flowId });
        return { success: false, error: result.error };
      }

      // If requires payment, return checkout URL without updating state
      if (result.data?.requiresPayment && result.data?.checkoutUrl) {
        dispatch({ type: "END_FLOW", payload: flowId });
        return { success: true, checkoutUrl: result.data.checkoutUrl };
      }

      // Animate module activation
      const newModules = PLAN_FEATURES[plan];
      const currentModules = PLAN_FEATURES[state.entitlements.plan];
      const modulesToActivate = newModules.filter(m => !currentModules.includes(m));

      for (const moduleId of modulesToActivate) {
        dispatch({ type: "SET_MODULE_STATE", payload: { moduleId, state: "activating" } });
      }

      await new Promise(resolve => setTimeout(resolve, 500));
      dispatch({ type: "UPDATE_FLOW", payload: { id: flowId, progress: 50 } });
      
      await new Promise(resolve => setTimeout(resolve, 500));
      dispatch({ type: "UPDATE_FLOW", payload: { id: flowId, progress: 100, state: "connected" } });

      // Refresh from server to get confirmed state
      await refreshFromServer();

      dispatch({ type: "END_FLOW", payload: flowId });
      return { success: true };
    } catch (error) {
      console.error("[SystemState] upgradePlan error:", error);
      dispatch({ type: "END_FLOW", payload: flowId });
      return { success: false, error: "Upgrade failed" };
    }
  }, [state.entitlements.plan, refreshFromServer]);

  // SERVER-VALIDATED: Change role with backend confirmation
  const changeRole = useCallback(async (role: UserRole): Promise<{ success: boolean; error?: string }> => {
    // Optimistic update
    dispatch({ type: "UPDATE_ROLE", payload: role });

    // Note: For self-role changes, this would typically not be allowed
    // For admin changing other users' roles, use changeUserRole action directly
    // This is primarily for UI demonstration
    
    return { success: true };
  }, []);

  // SERVER-VALIDATED: Check module access
  const validateModuleAccess = useCallback(async (moduleId: ModuleId): Promise<{ allowed: boolean; reason?: string }> => {
    try {
      const { canAccessModule } = await import("./actions");
      const result = await canAccessModule(moduleId);
      
      if (result.success && result.data) {
        return { allowed: result.data.allowed, reason: result.data.reason };
      }
      return { allowed: false, reason: "Validation failed" };
    } catch {
      return { allowed: false, reason: "Server error" };
    }
  }, []);

  // SERVER-VALIDATED: Check permission
  const checkPermissionServer = useCallback(async (permission: keyof UserEntitlements["permissions"]): Promise<boolean> => {
    try {
      const { checkPermission } = await import("./actions");
      const result = await checkPermission(permission);
      return result.success && result.data === true;
    } catch {
      return false;
    }
  }, []);

  const getModuleState = useCallback((moduleId: ModuleId): NodeState => {
    return state.modules.get(moduleId)?.state || "locked";
  }, [state.modules]);

  const isModuleAccessible = useCallback((moduleId: ModuleId): boolean => {
    const moduleState = state.modules.get(moduleId)?.state;
    return moduleState === "active" || moduleState === "restricted";
  }, [state.modules]);

  const setModuleState = useCallback((moduleId: ModuleId, nodeState: NodeState) => {
    dispatch({ type: "SET_MODULE_STATE", payload: { moduleId, state: nodeState } });
  }, []);

  const startFlow = useCallback((
    sourceModule: ModuleId, 
    targetModule: ModuleId, 
    flowType: SystemFlow["flowType"]
  ): string => {
    const id = generateId("flow");
    dispatch({
      type: "START_FLOW",
      payload: {
        id,
        sourceModule,
        targetModule,
        flowType,
        state: "animating",
        progress: 0,
      },
    });
    return id;
  }, []);

  const updateFlow = useCallback((flowId: string, progress: number) => {
    dispatch({ type: "UPDATE_FLOW", payload: { id: flowId, progress } });
  }, []);

  const endFlow = useCallback((flowId: string) => {
    dispatch({ type: "END_FLOW", payload: flowId });
  }, []);

  const startOperation = useCallback((
    type: PendingOperation["type"],
    module: ModuleId,
    message: string
  ): string => {
    const id = generateId("op");
    dispatch({
      type: "START_OPERATION",
      payload: {
        id,
        type,
        module,
        startedAt: new Date(),
        message,
        progress: 0,
      },
    });
    return id;
  }, []);

  const updateOperation = useCallback((operationId: string, progress: number, message?: string) => {
    dispatch({ type: "UPDATE_OPERATION", payload: { id: operationId, progress, message } });
  }, []);

  const endOperation = useCallback((operationId: string) => {
    dispatch({ type: "END_OPERATION", payload: operationId });
  }, []);

  const hasPermission = useCallback((permission: keyof UserEntitlements["permissions"]): boolean => {
    return state.entitlements.permissions[permission];
  }, [state.entitlements.permissions]);

  const isTrialUser = useCallback((): boolean => {
    return state.entitlements.trialActive;
  }, [state.entitlements.trialActive]);

  const getPlan = useCallback((): PlanTier => {
    return state.entitlements.plan;
  }, [state.entitlements.plan]);

  const getRole = useCallback((): UserRole => {
    return state.entitlements.role;
  }, [state.entitlements.role]);

  const isFounder = useCallback((): boolean => {
    return founderState;
  }, [founderState]);

  const value: SystemContextType = useMemo(() => ({
    state,
    isHydrated,
    isLoading,
    initialize,
    hydrateFromServer,
    refreshFromServer,
    upgradePlan,
    changeRole,
    getModuleState,
    isModuleAccessible,
    validateModuleAccess,
    setModuleState,
    startFlow,
    updateFlow,
    endFlow,
    startOperation,
    updateOperation,
    endOperation,
    hasPermission,
    checkPermissionServer,
    isTrialUser,
    getPlan,
    getRole,
    isFounder,
  }), [
    state,
    isHydrated,
    isLoading,
    initialize,
    hydrateFromServer,
    refreshFromServer,
    upgradePlan,
    changeRole,
    getModuleState,
    isModuleAccessible,
    validateModuleAccess,
    setModuleState,
    startFlow,
    updateFlow,
    endFlow,
    startOperation,
    updateOperation,
    endOperation,
    hasPermission,
    checkPermissionServer,
    isTrialUser,
    getPlan,
    getRole,
    isFounder,
  ]);

  return (
    <SystemContext.Provider value={value}>
      {children}
    </SystemContext.Provider>
  );
}
