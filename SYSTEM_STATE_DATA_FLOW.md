# System State Engine - Data Flow Architecture

## Overview

FormaOS operates as a **true operating system layer** on top of the existing platform. All system state values are bound to real backend data, and **no UI action can unlock features without backend authorization**.

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USER ACTION                                      │
│  (Click upgrade, access module, change role, etc.)                           │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SERVER ACTIONS                                      │
│  /lib/system-state/actions.ts                                                │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐              │
│  │ canAccessModule │  │ checkPermission │  │ initiatePlanUpgrade │          │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐              │
│  │ changeUserRole  │  │ getSystemState  │  │ confirmPlanUpgrade │           │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          SERVER DATA LAYER                                    │
│  /lib/system-state/server.ts                                                 │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ fetchSystemState()                                                   │    │
│  │ - getSubscriptionData(orgId)  → org_subscriptions table             │    │
│  │ - getEntitlements(orgId)      → org_entitlements table              │    │
│  │ - getMembershipData()         → org_members + organizations         │    │
│  │ - isFounder()                 → founder_status column               │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ validateModuleAccess(moduleId)  → checks entitlements + permissions  │    │
│  │ validatePermission(key)         → checks role-based permissions      │    │
│  │ calculateModuleState(moduleId)  → returns locked/unlocked/gated      │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            BACKEND (Supabase)                                 │
│                                                                               │
│  ┌──────────────────────┐  ┌──────────────────────┐                         │
│  │   org_subscriptions  │  │   org_entitlements   │                         │
│  │   ─────────────────  │  │   ─────────────────  │                         │
│  │   plan_key           │  │   feature_key        │                         │
│  │   status             │  │   enabled            │                         │
│  │   trial_ends_at      │  │   limit_value        │                         │
│  │   stripe_subscription│  │   org_id             │                         │
│  └──────────────────────┘  └──────────────────────┘                         │
│                                                                               │
│  ┌──────────────────────┐  ┌──────────────────────┐                         │
│  │     org_members      │  │     organizations    │                         │
│  │   ─────────────────  │  │   ─────────────────  │                         │
│  │   role               │  │   name               │                         │
│  │   user_id            │  │   founder_status     │                         │
│  │   organization_id    │  │   industry           │                         │
│  └──────────────────────┘  └──────────────────────┘                         │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SYSTEM STATE CONTEXT                                │
│  /lib/system-state/context.tsx                                               │
│                                                                               │
│  State (from HYDRATE_FROM_SERVER):                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ {                                                                    │    │
│  │   planTier: 'trial' | 'basic' | 'pro' | 'enterprise',               │    │
│  │   userRole: 'owner' | 'admin' | 'member' | 'viewer',                │    │
│  │   trialState: { isActive, daysRemaining, endDate },                 │    │
│  │   isFounder: boolean,                                                │    │
│  │   moduleStates: Map<moduleId, 'locked' | 'unlocked' | 'gated'>,     │    │
│  │   permissionCache: Map<permissionKey, boolean>,                      │    │
│  │   isHydrated: boolean                                                │    │
│  │ }                                                                    │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          NODE & WIRE SYSTEM                                   │
│  /components/system-os/*                                                     │
│                                                                               │
│  Nodes:                                                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ OSNode receives state from useSystemState():                        │    │
│  │ - getModuleNodeState(moduleId) → NodeState                          │    │
│  │ - NodeState.status determines visual appearance                      │    │
│  │ - NodeState.canActivate determines interactivity                     │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                               │
│  Wires:                                                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ WireConnection animates ONLY after state confirmation:              │    │
│  │ - Wire inactive = source or target module locked                     │    │
│  │ - Wire active = both modules unlocked                                │    │
│  │ - Animation triggers on state transition, not user click             │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Type Mappings

### Plan Tiers

| Backend (`PlanKey`)  | System State (`PlanTier`) |
|----------------------|---------------------------|
| `null` (no subscription) | `trial`              |
| `basic`              | `basic`                   |
| `pro`                | `pro`                     |
| `enterprise`         | `enterprise`              |

### User Roles

| Backend (`RoleKey`)    | System State (`UserRole`) |
|------------------------|---------------------------|
| `OWNER`                | `owner`                   |
| `COMPLIANCE_OFFICER`   | `admin`                   |
| `MANAGER`              | `admin`                   |
| `STAFF`                | `member`                  |
| `AUDITOR`              | `member`                  |
| `VIEWER`               | `viewer`                  |

---

## SSR Hydration Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  1. Request arrives at /app/*                                                │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  2. app/app/layout.tsx (Server Component)                                    │
│     └─ <SystemStateHydrator> wraps content                                   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  3. lib/system-state/hydrator.tsx (Server Component)                         │
│     └─ Calls fetchSystemState() server-side                                  │
│     └─ Passes initialState to SystemStateProvider                            │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  4. lib/system-state/context.tsx (Client Component)                          │
│     └─ SystemStateProvider receives initialState                             │
│     └─ Dispatches HYDRATE_FROM_SERVER with server data                       │
│     └─ Sets isHydrated = true                                                │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  5. Components render with server-validated state                            │
│     └─ No flash of incorrect state                                           │
│     └─ All module states match database                                      │
│     └─ Nodes and wires reflect real permissions                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Critical Flows

### 1. Module Access Request

```typescript
// User clicks on a module node
async function handleModuleClick(moduleId: string) {
  // 1. Check client-side cache first (fast)
  const cachedState = getModuleNodeState(moduleId);
  if (cachedState.status === 'locked') {
    showUpgradePrompt();
    return;
  }
  
  // 2. Validate server-side (authoritative)
  const { allowed, reason } = await validateModuleAccess(moduleId);
  
  if (!allowed) {
    // 3. Update client state to match server
    refreshFromServer();
    showAccessDenied(reason);
    return;
  }
  
  // 4. Navigate to module
  router.push(`/app/${moduleId}`);
}
```

### 2. Plan Upgrade Flow

```typescript
// User initiates upgrade
async function handleUpgrade(plan: PlanTier) {
  // 1. Call server action
  const result = await initiatePlanUpgrade(plan);
  
  if (result.requiresPayment) {
    // 2. Redirect to Stripe checkout
    window.location.href = result.checkoutUrl;
    // ... after payment success, Stripe webhook fires ...
    // ... confirmPlanUpgrade() is called ...
    return;
  }
  
  if (result.success) {
    // 3. ONLY after server confirms, update client state
    dispatch({ type: 'SET_PLAN_TIER', payload: plan });
    
    // 4. Wire animations trigger from state change
    // (not from button click)
  }
}
```

### 3. Role Change Flow

```typescript
// Admin changes user role
async function handleRoleChange(userId: string, newRole: UserRole) {
  // 1. Validate permission server-side
  const canChange = await checkPermission('team:manage');
  if (!canChange) {
    showPermissionDenied();
    return;
  }
  
  // 2. Execute role change
  const result = await changeUserRole(userId, newRole);
  
  if (result.success) {
    // 3. Refresh system state
    await refreshFromServer();
    
    // 4. UI updates to reflect new permissions
  }
}
```

---

## Security Guarantees

### ✅ Backend Authority

- All feature gates check `org_entitlements` table
- All permissions check `org_members.role` column
- All plan tiers come from `org_subscriptions` table
- Client state is a **cache**, not the source of truth

### ✅ No Optimistic Updates for Critical Operations

- Plan upgrades wait for Stripe webhook confirmation
- Role changes wait for database update confirmation
- Module unlocks require server validation

### ✅ SSR Hydration

- Initial page load has correct state from server
- No flash of "all modules unlocked" then correction
- Founder status determined server-side

### ✅ Wire Animations Follow State

- Wires don't animate on button click
- Wires animate when `moduleStates` map changes
- State only changes after server confirmation

---

## File Reference

| File | Purpose |
|------|---------|
| [lib/system-state/server.ts](lib/system-state/server.ts) | Server-side data fetching, validation |
| [lib/system-state/actions.ts](lib/system-state/actions.ts) | Server actions for client-server communication |
| [lib/system-state/context.tsx](lib/system-state/context.tsx) | React context with reducer, client state |
| [lib/system-state/hydrator.tsx](lib/system-state/hydrator.tsx) | SSR hydration wrapper component |
| [lib/system-state/types.ts](lib/system-state/types.ts) | TypeScript type definitions |
| [lib/system-state/index.ts](lib/system-state/index.ts) | Public exports |

---

## Testing Checklist

- [ ] Trial user sees locked modules for pro/enterprise features
- [ ] Plan upgrade unlocks correct modules after webhook
- [ ] Role change updates visible permissions immediately
- [ ] Founder users have full access regardless of plan
- [ ] SSR renders correct state (check view-source)
- [ ] Wire animations only fire after state confirmation
- [ ] Refreshing page maintains correct state
- [ ] Multiple browser tabs sync state correctly

---

*Last updated: Auto-generated during system-state backend integration*
