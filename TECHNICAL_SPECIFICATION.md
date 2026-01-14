# 🎯 FormaOS Role-Based System - Technical Specification

**Document**: Technical Architecture  
**Status**: Final Specification  
**Date**: January 14, 2026

---

## 1. System Overview

FormaOS implements a unified role-based access control (RBAC) system where all users operate within a single organizational context, with permissions controlling visibility and capabilities rather than creating separate applications.

### Core Principle

```
One Organization
  ↓
Multiple Roles (owner, admin, member, viewer)
  ↓
Filtered Access via Permissions
  ↓
Single Unified Dashboard
```

---

## 2. Role Model

### Database Roles (stored in `org_members.role`)

| Role       | Group    | Purpose                    | Permissions                        |
| ---------- | -------- | -------------------------- | ---------------------------------- |
| **owner**  | Employer | Organization founder/owner | All permissions                    |
| **admin**  | Employer | Organization administrator | All except billing                 |
| **member** | Employee | Regular team member        | Limited (own data + collaboration) |
| **viewer** | Employee | Read-only member           | Very limited (own data only)       |

### Role Hierarchy

```
owner
  ├── Full org access
  ├── Billing management
  ├── Team management
  └── Admin console

admin
  ├── Full org access (except billing)
  ├── Team management
  └── Settings

member
  ├── Own data access
  ├── Collaboration features
  └── Limited team view

viewer
  ├── Own data access (read-only)
  └── Limited collaboration
```

---

## 3. Permission System

### Permission Keys

**Format**: `[domain]:[action]`

**Organization**:

- `org:view_overview` - View org dashboard
- `org:manage_settings` - Manage org settings

**Team**:

- `team:invite_members` - Invite new members
- `team:remove_members` - Remove members
- `team:change_roles` - Modify member roles
- `team:view_all_members` - List all members

**Certificates & Licenses**:

- `cert:view_all` - View all org certificates
- `cert:view_own` - View own certificates
- `cert:create` - Create new certificate
- `cert:edit` - Edit certificate
- `cert:delete` - Delete certificate

**Evidence & Files**:

- `evidence:view_all` - View all evidence
- `evidence:view_own` - View own evidence
- `evidence:upload` - Upload evidence
- `evidence:approve` - Approve evidence
- `evidence:reject` - Reject evidence

**Tasks**:

- `task:create_for_others` - Create tasks for team
- `task:create_own` - Create own tasks
- `task:view_all` - View all tasks
- `task:view_own` - View own tasks
- `task:complete_own` - Complete own tasks
- `task:assign` - Assign tasks

**Audit & Compliance**:

- `audit:view_logs` - View audit logs
- `audit:export_reports` - Export compliance reports
- `audit:view_org_compliance` - View org compliance

**Billing**:

- `billing:view` - View billing info
- `billing:manage` - Manage subscription

### Permission Matrix

```typescript
OWNER: [all permissions]
ADMIN: [all except billing:*]
MEMBER: [cert:view_own, evidence:view_own, evidence:upload, task:create_own, task:view_own, task:complete_own, audit:view_org_compliance]
VIEWER: [org:view_overview, cert:view_own, evidence:view_own, task:view_own, audit:view_org_compliance]
```

---

## 4. Module (Node) System

### Available Modules

| Module          | Type         | Owner      | Admin      | Member | Viewer     |
| --------------- | ------------ | ---------- | ---------- | ------ | ---------- |
| org_overview    | Organization | active     | active     | locked | locked     |
| team_management | Team         | active     | active     | locked | locked     |
| certificates    | Compliance   | active     | active     | locked | locked     |
| evidence        | Compliance   | active     | active     | locked | locked     |
| tasks           | Compliance   | active     | active     | locked | locked     |
| audit_logs      | Audit        | active     | active     | locked | locked     |
| billing         | Billing      | active     | locked     | locked | locked     |
| admin_settings  | Admin        | active     | active     | locked | locked     |
| my_compliance   | Personal     | restricted | restricted | active | restricted |
| my_certificates | Personal     | active     | active     | active | restricted |
| my_evidence     | Personal     | active     | active     | active | restricted |
| my_tasks        | Personal     | active     | active     | active | restricted |
| training        | Learning     | active     | active     | active | active     |

### Node States

```
active      → Fully accessible
restricted → Limited access (e.g., can view own data)
locked      → Not accessible (hidden/disabled UI)
loading     → Currently initializing
error       → Error occurred
```

---

## 5. Database Schema

### Relevant Tables

#### `organizations`

```sql
id uuid PRIMARY KEY
name text
plan_key text (trial, basic, pro, enterprise)
onboarding_completed boolean
created_by uuid → auth.users
created_at timestamp
```

#### `org_members`

```sql
id uuid PRIMARY KEY
organization_id uuid → organizations
user_id uuid → auth.users
role text ('owner', 'admin', 'member', 'viewer')
created_at timestamp
```

#### RLS Policies

- ✅ All tables have org-level isolation
- ✅ `org_members` has role-based access (admins can modify)
- ✅ User data tables filtered by `user_id` where applicable
- ✅ No cross-org data access possible

---

## 6. Routing & Navigation

### URL Structure

```
/app                      → Unified dashboard (role-detected)
/app/org-overview         → Organization overview (employer only)
/app/team                 → Team management (employer only)
/app/certificates         → Org certificates (employer only)
/app/evidence             → Evidence review (employer only)
/app/tasks                → Task management (employer only)
/app/audit-logs           → Audit logs (employer only)
/app/billing              → Billing (owner only)
/app/settings             → Settings (admin only)
/app/my-compliance        → Personal compliance (all)
/app/my-certificates      → My certificates (all)
/app/my-tasks             → My tasks (all)
/app/my-evidence          → My evidence (all)
/app/training             → Training modules (all)
```

### No Separate Dashboards

❌ NO `/app/employer-dashboard`  
❌ NO `/app/employee-dashboard`  
❌ NO `/app/staff`  
✅ Single `/app` with role-based sections

---

## 7. Data Flow

### On User Login

```
1. User logs in → auth.users
   ↓
2. Auth callback creates/validates org_members entry
   ↓
3. Middleware redirects to `/app`
   ↓
4. Dashboard page fetches:
   - User context (id, email)
   - Org membership (organization_id, role)
   ↓
5. Dashboard detects role:
   - if (role in ['owner', 'admin']) → render employer sections
   - else → render employee sections
   ↓
6. Each section fetches data via API:
   - API checks permission
   - RLS filters data at database
   - Component renders
```

### Component Rendering

```typescript
// /app/page.tsx
const { role } = await getUserContext();

if (isEmployerRole(role)) {
  return <UnifiedDashboardLayout role={role}>
    <EmployerDashboard />
  </UnifiedDashboardLayout>;
} else {
  return <UnifiedDashboardLayout role={role}>
    <EmployeeDashboard />
  </UnifiedDashboardLayout>;
}
```

---

## 8. API Security

### Permission Guard Flow

```typescript
// Example: POST /api/org/[orgId]/members/invite

export async function POST(request, { params }) {
  // 1. Check authentication + get context
  const { error, context } = await requireAuth('team:invite_members');
  if (error) return error; // 403 Unauthorized

  // 2. Verify org access
  const isValid = await verifyOrgAccess(context.userId, params.orgId);
  if (!isValid) return unauthorizedResponse();

  // 3. Query with auto-filtering (RLS applies)
  const org = await supabase
    .from('organizations')
    .select('*')
    .eq('id', params.orgId)
    .single();

  // 4. Return filtered data
  return NextResponse.json({ org });
}
```

### RLS Enforcement

All queries are pre-filtered by RLS:

```sql
-- User can only see their own organizations
WHERE organization_id IN (
  SELECT organization_id FROM org_members WHERE user_id = auth.uid()
)

-- Admin can modify members only in their org
WHERE organization_id IN (
  SELECT organization_id FROM org_members
  WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
)
```

---

## 9. Frontend Permission Gating

### Three-Layer Approach

**Layer 1: RLS** (Database)

```sql
SELECT * FROM table WHERE org_id = current_user_org
```

**Layer 2: API Guards** (Backend)

```typescript
requireAuth('permission:key');
```

**Layer 3: UI Gating** (Frontend)

```typescript
{canAccessModule(role, "module_id") && <Section />}
```

### Example: Certificate Management

```tsx
// Show "View All Certs" button only to employer
{
  canAccessModule(userRole, 'certificates') && (
    <button onClick={viewAllCerts}>View All Certificates</button>
  );
}

// Employee always sees their own certs
{
  canAccessModule(userRole, 'my_certificates') && <MyCertificates />;
}
```

---

## 10. Data Isolation Examples

### Employer Can See

```
GET /api/org/[orgId]/team
→ RLS: org_members WHERE organization_id = [orgId]
→ Returns: All team members ✅

GET /api/org/[orgId]/evidence
→ RLS: evidence WHERE organization_id = [orgId]
→ Returns: All submissions ✅
```

### Employee Can Only See Own

```
GET /api/org/[orgId]/my-evidence
→ RLS: evidence WHERE organization_id = [orgId] AND user_id = auth.uid()
→ Returns: Only their submissions ✅

GET /api/org/[orgId]/team
→ API Guard: requireAuth("team:view_all_members")
→ Returns: 403 Forbidden ✅
```

---

## 11. Deployment Checklist

### Before Deployment

- [ ] All new components compiled and tested
- [ ] Role types consistent across codebase
- [ ] API routes updated with permission guards
- [ ] RLS policies verified (already in place)
- [ ] Test accounts created for both roles
- [ ] Staging environment matches production

### Deployment Steps

1. Merge to main branch
2. Deploy to staging
3. Run smoke tests with test accounts
4. Monitor logs for errors
5. Deploy to production
6. Monitor production logs

### Rollback Plan

If issues occur:

1. Revert to previous dashboard (keep RLS intact)
2. All data remains secure (RLS independent of UI)
3. Users can continue working with previous dashboard

---

## 12. Monitoring & Logging

### Key Metrics

```
Dashboard Load Time (should be < 2s)
API Response Time (should be < 500ms)
Permission Denial Rate (should be ~ 0%)
RLS Policy Hits (verify enforce happening)
Error Rate (should be < 0.1%)
```

### Logs to Monitor

```
[Dashboard] Role: owner → Employer sections loaded
[Dashboard] Role: member → Employee sections loaded
[API] Permission check: ALLOWED (permission exists)
[API] Permission check: DENIED (unauthorized)
[RLS] Policy enforced: org_members
```

---

## 13. Future Enhancements

### Planned Features

1. **Team Hierarchies** - Manager roles that can manage subset of team
2. **Custom Roles** - Enterprises create custom role definitions
3. **Activity Notifications** - Real-time updates for relevant events
4. **Compliance Workflows** - Automated task assignment based on triggers
5. **Reporting Suite** - Pre-built compliance reports
6. **Audit Export** - Compliance reports for regulators

### Extensibility

The permission system is designed to easily add new permissions:

```typescript
// Add new permission
export type Permission = ... | "new:feature";

// Add to role
ROLE_CAPABILITIES.owner = [..., "new:feature"];

// Use in API
const { error, context } = await requireAuth("new:feature");

// Use in UI
{hasPermission(role, "new:feature") && <NewFeature />}
```

---

## 14. Troubleshooting Guide

### Issue: Employee Can See Other Employees

**Cause**: RLS policy not enforced  
**Solution**:

1. Verify `org_members` table has RLS enabled
2. Check policy includes `user_id = auth.uid()`
3. Verify policy applies to SELECT

### Issue: API Returns 403 Unexpectedly

**Cause**: Permission not in matrix  
**Solution**:

1. Check permission key is spelled correctly
2. Verify role has permission in `ROLE_CAPABILITIES`
3. Check `requireAuth()` is called with correct permission

### Issue: Module Shows as Locked for Employer

**Cause**: MODULE_ACCESS matrix incorrect  
**Solution**:

1. Verify role in MODULE_ACCESS table
2. Check module ID matches component usage
3. Ensure module state is "active" not "locked"

---

## 15. Reference Implementation

### Minimal Example: Add New API Endpoint

```typescript
// 1. Create file: app/api/org/[orgId]/widgets/route.ts

import { NextResponse, NextRequest } from 'next/server';
import { requireAuth } from '@/lib/api-permission-guards';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest, { params }) {
  // Step 1: Auth + Permission
  const { error, context } = await requireAuth('widgets:view');
  if (error) return error;

  // Step 2: Verify org access
  if (context.orgId !== params.orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  // Step 3: Query (RLS applies automatically)
  const supabase = await createSupabaseServerClient();
  const { data, error: dbError } = await supabase
    .from('widgets')
    .select('*')
    .eq('organization_id', context.orgId)
    .order('created_at', { ascending: false });

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  // Step 4: Return
  return NextResponse.json({ widgets: data });
}
```

---

**End of Specification**

This document serves as the authoritative guide for FormaOS role-based system architecture and implementation.
