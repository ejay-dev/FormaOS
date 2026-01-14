# 🚀 Role-Based System Implementation Guide

**Status**: Ready for implementation  
**Date**: January 14, 2026  
**Target**: Full deployment of unified role-based dashboard

---

## 📦 What Has Been Created

### 1. **Unified Role Model** (`lib/roles.ts`)

- ✅ Standardized database roles: `owner | admin | member | viewer`
- ✅ Clear role group classification (employer vs employee)
- ✅ Comprehensive permission matrix
- ✅ Module access control by role
- ✅ Helper functions for permission checks

**Key Types & Functions**:

- `DatabaseRole` - Role stored in `org_members.role`
- `Permission` - Fine-grained permission keys
- `ROLE_CAPABILITIES` - Role → Permissions mapping
- `MODULE_ACCESS` - Role → Module State mapping
- `hasPermission(role, permission)` - Check permission
- `canAccessModule(role, module)` - Check module access
- `isEmployerRole(role)` - Quick role group check

### 2. **Unified Dashboard Layout** (`components/dashboard/unified-dashboard-layout.tsx`)

- ✅ Single dashboard shell for all roles
- ✅ Sidebar navigation (dynamically populated per role)
- ✅ Node visualization with state indicators
- ✅ Lock icons for restricted/locked modules
- ✅ Role detection and context display

**Key Components**:

- `UnifiedDashboardLayout` - Main shell component
- `DashboardSectionCard` - Reusable card with lock state
- `NodeBadge` - Visual indicator for node state

### 3. **Employer Dashboard Sections** (`components/dashboard/employer-dashboard.tsx`)

- ✅ Organization health overview (KPIs)
- ✅ Team compliance table
- ✅ Certificates & licenses expiry tracking
- ✅ Evidence review interface
- ✅ Task management for team
- ✅ Audit activity log

**Key Components**:

- `OrgHealthOverview` - KPI cards
- `TeamComplianceTable` - Employee compliance list
- `CertificatesExpiry` - Cert tracking
- `EvidenceReview` - Submission approval
- `TaskManagement` - Task assignment
- `AuditActivityLog` - Activity history
- `EmployerDashboard` - Complete dashboard

### 4. **Employee Dashboard Sections** (`components/dashboard/employee-dashboard.tsx`)

- ✅ Personal compliance status
- ✅ My certificates & licenses
- ✅ Assigned tasks interface
- ✅ Evidence upload feature
- ✅ Training & learning modules

**Key Components**:

- `MyComplianceStatus` - Personal compliance view
- `MyCertificates` - Own certs only
- `MyTasks` - Assigned tasks only
- `UploadEvidence` - Submit evidence
- `Training` - Learning modules
- `EmployeeDashboard` - Complete dashboard

### 5. **API Permission Guards** (`lib/api-permission-guards.ts`)

- ✅ `UserContext` interface
- ✅ `getUserContext()` - Fetch auth + org membership
- ✅ `requirePermission()` - Verify permission
- ✅ `canAccessUserData()` - Cross-user access validation
- ✅ `canModifyResource()` - Modification checks
- ✅ `requireAuth()` - Middleware helper
- ✅ Query builders for RLS-aware queries

---

## 🔧 Next Steps - Implementation Checklist

### Phase 1: Update Main Dashboard Route (/app/page.tsx)

**Goal**: Replace current dashboard with unified layout

```typescript
// OLD: /app/page.tsx (lines 487-1261)
// - Single generic dashboard for all
// - No role-based sections
// - Mixes employer and employee logic

// NEW: /app/page.tsx
// - Detect user role
// - Import UnifiedDashboardLayout
// - Import EmployerDashboard or EmployeeDashboard
// - Render appropriate sections
// - Pass role to layout
```

**Key Changes**:

1. Add role detection at top of page
2. Import new dashboard components
3. Replace current render with `<UnifiedDashboardLayout>` + role-specific sections
4. Remove `/app/staff/page.tsx` (consolidate into main `/app`)
5. Test both employer and employee flows

### Phase 2: Update API Routes

**Goal**: Add permission guards to all API endpoints

**Files to Update**:

- `app/api/org/members/*/route.ts` - Team management
- `app/api/org/[orgId]/certificates/route.ts` - Cert endpoints (create if missing)
- `app/api/org/[orgId]/evidence/route.ts` - Evidence endpoints (create if missing)
- `app/api/org/[orgId]/tasks/route.ts` - Task endpoints (create if missing)
- `app/api/org/[orgId]/audit/route.ts` - Audit endpoints

**Pattern to Add**:

```typescript
import { requireAuth } from '@/lib/api-permission-guards';

export async function POST(request: Request) {
  // 1. Get user context with permission check
  const { error, context } = await requireAuth('permission:name');
  if (error) return error;

  // 2. Use context to filter data
  const { orgId, userId, role } = context;

  // 3. Query already filtered by RLS
  const { data } = await supabase
    .from('table')
    .select('*')
    .eq('organization_id', orgId);

  return NextResponse.json(data);
}
```

### Phase 3: Create Missing API Endpoints

**Create** (if not existing):

- `app/api/org/[orgId]/members/route.ts` - List org members
- `app/api/org/[orgId]/members/invite/route.ts` - Invite new member
- `app/api/org/[orgId]/certificates/route.ts` - List certs
- `app/api/org/[orgId]/evidence/route.ts` - List evidence
- `app/api/org/[orgId]/tasks/route.ts` - List tasks
- `app/api/org/[orgId]/audit/route.ts` - Audit logs

**Pattern**: Each follows CRUD + permission checks

### Phase 4: Update Onboarding Flow

**Goal**: Ensure new users get correct role assignment

**File**: `app/onboarding/page.tsx`

**Current Issue**:

```typescript
// Lines 28-29
const ROLE_OPTIONS = [
  { id: 'employer', label: 'Employer / Organization admin', role: 'owner' },
  { id: 'employee', label: 'Employee / Field staff', role: 'staff' }, // ← Wrong! Should be "member"
];
```

**Fix**:

```typescript
const ROLE_OPTIONS = [
  { id: 'employer', label: 'Employer / Organization admin', role: 'owner' },
  { id: 'employee', label: 'Employee / Field staff', role: 'member' }, // ← Correct
];
```

### Phase 5: Verify RLS Policies

**File**: `supabase/migrations/20260401_safe_rls_policies.sql`

Status: ✅ Already implemented correctly

**Policies in place**:

- ✅ Organization isolation
- ✅ Org members isolation
- ✅ Subscriptions isolation
- ✅ Evidence isolation
- ✅ Task isolation
- ✅ Audit log isolation

No changes needed - existing RLS is working correctly.

---

## 🧪 Testing Checklist

### Pre-Deployment Testing

#### 1. Authentication & Routing

- [ ] Employer (owner) can access `/app` → sees employer dashboard
- [ ] Employee (member) can access `/app` → sees employee dashboard
- [ ] Employee cannot access locked modules → sees lock icon
- [ ] Non-authenticated user → redirects to `/auth/signin`

#### 2. Data Access

- [ ] Employer can see all employees' data
- [ ] Employee cannot see other employees' data (RLS enforced)
- [ ] Employer sees org overview section
- [ ] Employee sees only personal sections
- [ ] API returns 403 if permission denied

#### 3. Employer Features

- [ ] Can invite new team members
- [ ] Can view team compliance table
- [ ] Can see certificate expiry list
- [ ] Can review evidence submissions
- [ ] Can create and assign tasks
- [ ] Can view audit logs
- [ ] Can manage billing (if owner, not admin)

#### 4. Employee Features

- [ ] Can view personal compliance score
- [ ] Can see only own certificates
- [ ] Can see assigned tasks
- [ ] Can upload evidence
- [ ] Can view training modules
- [ ] Cannot create tasks for others (locked)
- [ ] Cannot view team members (locked)

#### 5. UI/UX

- [ ] Navigation items change based on role
- [ ] Locked modules show lock icon
- [ ] All buttons are functional
- [ ] Responsive design works (mobile, tablet, desktop)
- [ ] Dark theme consistent

#### 6. Permissions

- [ ] API guards return 403 for unauthorized requests
- [ ] RLS filters data at database level
- [ ] Frontend hides locked UI elements
- [ ] No data leakage between users

---

## 📋 Migration Plan

### Step 1: Deploy New Components

1. Merge `lib/roles.ts` → replaces old role definition
2. Merge `components/dashboard/unified-dashboard-layout.tsx` → new component
3. Merge `components/dashboard/employer-dashboard.tsx` → new component
4. Merge `components/dashboard/employee-dashboard.tsx` → new component
5. Merge `lib/api-permission-guards.ts` → new utility

### Step 2: Update Main Dashboard

1. Backup current `/app/page.tsx`
2. Refactor to use new layout
3. Import role detection
4. Wire up employer/employee sections
5. Remove old `/app/staff/page.tsx` or consolidate
6. Test thoroughly

### Step 3: Add Permission Guards to APIs

1. Update existing API routes
2. Add new routes as needed
3. Test each endpoint with different roles

### Step 4: Test Complete Flow

1. Create test accounts (employer + employee)
2. Run full validation checklist
3. Monitor logs for errors

### Step 5: Deploy

1. Deploy to staging
2. Run smoke tests
3. Deploy to production
4. Monitor for issues

---

## 🔍 Validation After Deployment

### Logs to Monitor

- `[Middleware] FOUNDER CHECK` - Verify founder detection
- Permission check logs in API routes
- RLS policy enforcement

### Metrics to Watch

- User sign-ups by role type
- Dashboard load times
- Permission denial rate (should be 0 if correctly configured)
- Error rate on API endpoints

### Common Issues & Fixes

| Issue                                | Cause                       | Fix                                  |
| ------------------------------------ | --------------------------- | ------------------------------------ |
| Employee sees employer modules       | Frontend gating not applied | Check `MODULE_ACCESS` in roles.ts    |
| API returns 403 for valid user       | Permission not in matrix    | Add to `ROLE_CAPABILITIES`           |
| Employer can't access admin features | Role not checked in API     | Add `requireAuth("permission:name")` |
| RLS errors on queries                | User not in org             | Verify `org_members` entry exists    |

---

## 📚 Developer Reference

### Key Files

- **Role definitions**: `lib/roles.ts`
- **UI components**: `components/dashboard/`
- **API guards**: `lib/api-permission-guards.ts`
- **RLS policies**: `supabase/migrations/20260401_safe_rls_policies.sql`

### Importing Helpers

```typescript
// In API routes
import { requireAuth, getUserContext } from '@/lib/api-permission-guards';
import { hasPermission, canAccessModule } from '@/lib/roles';

// In React components
import { UnifiedDashboardLayout } from '@/components/dashboard/unified-dashboard-layout';
import { EmployerDashboard } from '@/components/dashboard/employer-dashboard';
import { EmployeeDashboard } from '@/components/dashboard/employee-dashboard';
```

### Common Patterns

**Check permission in API**:

```typescript
const { error, context } = await requireAuth('cert:view_all');
if (error) return error;
```

**Check permission in component**:

```typescript
import { hasPermission } from '@/lib/roles';

if (hasPermission(userRole, 'cert:create')) {
  // Show button
}
```

**Check module access**:

```typescript
import { canAccessModule } from '@/lib/roles';

if (canAccessModule(userRole, 'certificates')) {
  // Show module
}
```

---

## ✅ Success Criteria

- ✅ One unified dashboard for all organization members
- ✅ Employer sees organization-wide view
- ✅ Employee sees personal-only view
- ✅ No separate dashboards or parallel apps
- ✅ RLS enforced at database layer
- ✅ API guards check permissions
- ✅ UI gates features by role
- ✅ All tests pass
- ✅ Zero data leakage between roles
- ✅ Smooth deployment with no downtime

---

**Ready to implement?** Start with Phase 1 - Update `/app/page.tsx` to use the new unified dashboard layout.
