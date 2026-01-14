# 🔍 FormaOS Role-Based System Audit & Implementation Plan

**Date**: January 14, 2026  
**Status**: Audit Complete - Ready for Implementation  
**Objective**: Implement unified organizational system with role-based visibility, not separate dashboards

---

## 📊 Current System Analysis

### ✅ What Exists

1. **Database Foundation**
   - `organizations` table (org ownership)
   - `org_members` table (user-org relationships with roles)
   - RLS policies for org isolation
   - Roles: `owner`, `admin`, `member`, `viewer`

2. **Authentication & Routing**
   - Supabase auth with JWT
   - Middleware routing guards for `/app`, `/admin`, `/auth`
   - Founder-specific admin access (`/admin`)
   - Role-based redirects in auth flow

3. **Role System**
   - Defined roles in `lib/system-state/types.ts`
   - RBAC module in `app/app/actions/rbac.ts`
   - Role permissions matrix partially defined

4. **Dashboard Infrastructure**
   - `/app/page.tsx` - Main dashboard (1261 lines)
   - `/app/staff/page.tsx` - Staff-specific view (285 lines)
   - Module system with states (locked/active/restricted)

### ⚠️ Current Issues & Gaps

#### 1. **Role Confusion**

- Database uses: `owner`, `admin`, `member`, `viewer`
- App code uses: `OWNER`, `COMPLIANCE_OFFICER`, `MANAGER`, `STAFF`, `VIEWER`, `AUDITOR`
- Onboarding offers: "employer" (role: `owner`) vs "employee" (role: `staff`)
- **Mismatch**: Inconsistent role naming across layers

#### 2. **Dashboard Split (Anti-Pattern)**

```
Current: /app/page.tsx (general) + /app/staff/page.tsx (staff-only)
Problem: Separate view logic by role - violates unified system principle
Issue: Staff redirected away if role !== "STAFF" - not inclusive
```

#### 3. **Missing Employer Dashboard**

- No dedicated employer/admin dashboard
- `/app` shows generic dashboard for all roles
- Employer features buried or missing:
  - Organization health overview
  - Team compliance status
  - Certificate/license expiry tracking
  - Evidence approval workflow
  - Task assignment interface
  - Audit activity logs
  - Admin controls

#### 4. **Incomplete Permission Model**

- Permissions defined but not fully enforced at API level
- No node/wire permission mapping
- UI gating exists but not comprehensive

#### 5. **Routing Architecture Issue**

```
Current: Role-based routing (staff → /app/staff → redirect if wrong role)
Better: Role-based filtering in unified dashboard
Issue: Not a true unified system
```

#### 6. **Onboarding Disconnect**

- Onboarding asks "employer vs employee" but assigns roles `owner` vs `staff`
- No invite flow for employees
- No employee signup to existing organization

---

## 🎯 Required Implementation

### Phase 1: Role Model Standardization

**Standardize on Database Roles** (what should live in `org_members.role`):

```
owner      → Organization owner/employer
admin      → Organization administrator
member     → Team member/employee
viewer     → Read-only access
```

**Map Clearly**:

- Employer/Admin user group → roles: `owner` or `admin`
- Employee/Worker user group → role: `member` or `viewer`
- No mixing in the same user

**Code References to Update**:

- `ROLE_ALIASES` in `app/app/actions/rbac.ts`
- `lib/roles.ts` - standardize role types
- `lib/system-state/types.ts` - ensure `UserRole` matches DB

---

### Phase 2: Unified Dashboard Architecture

**Principle**: One dashboard shell for all users in one organization

```
/app → Single entry point (unified dashboard)
  ↓
System detects user role + plan
  ↓
Dashboard renders:
  - Available modules (based on plan)
  - Visible sections (based on role)
  - Enabled actions (based on role)
  - All data pre-filtered at DB layer (RLS)
```

**Key Difference**:

- ❌ OLD: `/app/staff` (conditional redirect if role !== staff)
- ✅ NEW: `/app` (renders employer or employee sections based on role)

---

### Phase 3: Employer Dashboard Components

**Only rendered if user role is `owner` or `admin`**:

1. **Organization Health (KPIs)**
   - Total employees
   - Compliance score %
   - Expiring certificates count
   - Open tasks count

2. **Team Compliance**
   - List all employees with:
     - Name, role, email
     - Compliance % by person
     - Active/inactive status
     - Last action date

3. **Certificates & Licences**
   - Organization-wide view
   - Filter by employee or expiry date
   - Expiry alerts

4. **Evidence & Files**
   - All submitted evidence (organization-level)
   - Approval/rejection interface
   - Status tracking

5. **Tasks & Playbooks**
   - Create tasks for employees
   - Assign to individuals or groups
   - Track completion
   - View playbook library

6. **Audit Logs**
   - Organization activity history
   - Filter by user, action, date
   - Export capability

7. **Admin Controls**
   - User management (invite, roles, remove)
   - Organization settings
   - Plan & billing (if pro/enterprise)

---

### Phase 4: Employee Dashboard Components

**Only rendered if user role is `member` or `viewer`**:

1. **My Compliance Status**
   - Personal compliance % (vs org avg)
   - Days until next audit
   - Certification status

2. **My Certificates & Licences**
   - Only their own certs/licenses
   - Expiry warnings
   - Renewal status

3. **My Tasks**
   - Assigned to them
   - Filter by status (pending, completed, overdue)
   - Mark complete

4. **Upload Evidence**
   - Submit documents
   - Track status (pending approval, approved, rejected)
   - View feedback

5. **Training / Learning**
   - Assigned training modules
   - View completed training
   - Required certifications

---

### Phase 5: Node & Wire Permission Mapping

**Nodes** (features/modules):

| Node             | Owner/Admin | Member      | Viewer      |
| ---------------- | ----------- | ----------- | ----------- |
| Org Overview     | ✅ Active   | ❌ Locked   | ❌ Locked   |
| User Management  | ✅ Active   | ❌ Locked   | ❌ Locked   |
| All Certificates | ✅ Active   | ❌ Locked   | ❌ Locked   |
| My Certificates  | ✅ Full     | ✅ Own Only | ✅ Own Only |
| Evidence Review  | ✅ Active   | ❌ Locked   | ❌ Locked   |
| My Evidence      | ✅ Full     | ✅ Own Only | ✅ Own Only |
| Task Creation    | ✅ Active   | ❌ Locked   | ❌ Locked   |
| My Tasks         | ✅ Full     | ✅ Own Only | ✅ Own Only |
| Audit Logs       | ✅ Active   | ❌ Locked   | ❌ Locked   |
| Billing          | ✅ Active   | ❌ Locked   | ❌ Locked   |
| Admin Settings   | ✅ Active   | ❌ Locked   | ❌ Locked   |

**Wires** (data flow):

- Owner → All organization data
- Member → Only their own data + org-level read-only
- Viewer → Read-only to everything in org

---

### Phase 6: RLS Policy Validation

**Current RLS Policies** (from `20260401_safe_rls_policies.sql`):
✅ Organization isolation
✅ Org members isolation
✅ Subscriptions isolation
✅ Onboarding status isolation
✅ Team invitations
✅ Audit logs isolation
✅ Audit events isolation
✅ Files isolation

**Action Required**:

- ✅ Already in place - no changes needed to RLS

---

### Phase 7: API Permission Guards

**Locations to add permission checks**:

1. `app/api/auth/signup/route.ts`
   - Ensure new users get correct role assignment

2. `app/api/org/members/invite/route.ts` (create if missing)
   - Only owner/admin can invite
   - Only assign valid roles

3. `app/api/org/[orgId]/*/route.ts` (all org endpoints)
   - Verify requester has permission
   - Filter data by role

4. `app/app/actions/rbac.ts`
   - Expand permission checks
   - Add role-based filtering

---

## 📋 Validation Checklist

Before deployment:

### Routing

- [ ] Both employer and employee land on `/app` (not separate routes)
- [ ] Dashboard detects role on first load
- [ ] No manual role-based redirects (only auth-based)

### Data Access

- [ ] Employer sees all org employees
- [ ] Employee sees only own data
- [ ] RLS enforces at DB layer
- [ ] No data leakage via API

### UI/UX

- [ ] Employer dashboard shows org-wide modules
- [ ] Employee dashboard shows only personal modules
- [ ] Locked nodes are visually disabled
- [ ] Clear labeling of what's available vs restricted

### Functionality

- [ ] Employer can assign tasks to employees
- [ ] Employee can submit evidence
- [ ] Employer can approve/reject evidence
- [ ] Employee can view own compliance %
- [ ] Audit logs reflect both roles appropriately

---

## 🔧 Implementation Steps

1. **Standardize role model** (`lib/roles.ts`, `lib/system-state/types.ts`)
2. **Create unified dashboard layout** (components)
3. **Build employer sections** (org overview, team, certificates, etc.)
4. **Build employee sections** (my tasks, my evidence, my certs, etc.)
5. **Implement permission guards** (API + Frontend)
6. **Add node/wire visualization** (if needed)
7. **Test all role combinations** (owner, admin, member, viewer)
8. **Validate RLS enforcement**
9. **Deploy and monitor**

---

## 🚀 Success Criteria

✅ One unified dashboard for all organization members  
✅ Clear visual distinction between employer and employee views  
✅ No role-based routing (only permission-based UI gating)  
✅ All data centrally connected via organization  
✅ RLS enforced at database layer  
✅ No data leakage between roles  
✅ Smooth onboarding for both employer and employee flows

---

**Next**: Proceed to Phase 1 - Role Model Standardization
