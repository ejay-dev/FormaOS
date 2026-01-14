# 🚀 Quick Start - Implementation Examples

**Date**: January 14, 2026  
**Purpose**: Practical examples to get started implementing the role-based system

---

## Example 1: Update /app/page.tsx (Main Dashboard)

### Current State

The file is 1261 lines and renders a generic dashboard for all roles.

### New Approach

```typescript
// /app/page.tsx

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { isEmployerRole, DatabaseRole } from "@/lib/roles";
import { UnifiedDashboardLayout } from "@/components/dashboard/unified-dashboard-layout";
import { EmployerDashboard } from "@/components/dashboard/employer-dashboard";
import { EmployeeDashboard } from "@/components/dashboard/employee-dashboard";

/**
 * UNIFIED DASHBOARD
 * - Single entry point for all organization members
 * - Detects role and renders appropriate sections
 * - All data pre-filtered by RLS at database layer
 */
export default async function DashboardPage() {
  // 1. Get current user
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/signin");

  // 2. Get org membership + role
  const { data: membership } = await supabase
    .from("org_members")
    .select(`
      organization_id,
      role,
      organizations!inner(
        id,
        name,
        plan_key,
        onboarding_completed
      )
    `)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership?.organization_id) {
    redirect("/onboarding");
  }

  const org = membership.organizations as any;
  const role = membership.role as DatabaseRole;
  const orgId = membership.organization_id;

  // 3. Determine if employer or employee
  const isEmployer = isEmployerRole(role);

  // 4. Fetch role-specific data in parallel
  const [orgStats, teamMembers, certs, evidence, tasks] = await Promise.all([
    // Fetch org stats (employers only)
    isEmployer ? fetchOrgStats(supabase, orgId) : Promise.resolve(null),
    // Fetch team (employers only)
    isEmployer ? fetchTeamMembers(supabase, orgId) : Promise.resolve([]),
    // Fetch certificates (all)
    fetchCertificates(supabase, orgId, user.id, role),
    // Fetch evidence (all)
    fetchEvidence(supabase, orgId, user.id, role),
    // Fetch tasks (all)
    fetchTasks(supabase, orgId, user.id, role),
  ]);

  // 5. Render unified layout with role-specific content
  return (
    <UnifiedDashboardLayout
      userRole={role}
      organizationName={org?.name || "Organization"}
    >
      {isEmployer ? (
        <EmployerDashboard
          organizationId={orgId}
          organizationName={org?.name || ""}
          teamMemberCount={teamMembers?.length || 0}
          complianceScore={orgStats?.complianceScore || 0}
          expiringCertsCount={orgStats?.expiringCerts || 0}
          openTasksCount={orgStats?.openTasks || 0}
        />
      ) : (
        <EmployeeDashboard
          employeeName={user.email?.split("@")[0] || "Employee"}
          organizationName={org?.name || ""}
          complianceScore={70}
          nextAuditDate="2026-02-15"
          tasksAssigned={tasks?.length || 0}
          tasksPending={tasks?.filter((t: any) => t.status !== 'completed').length || 0}
        />
      )}
    </UnifiedDashboardLayout>
  );
}

// ============================================================
// HELPER FUNCTIONS - Data Fetching
// ============================================================

async function fetchOrgStats(supabase: any, orgId: string) {
  try {
    const [certs, tasks, members] = await Promise.all([
      supabase
        .from("certificates")
        .select("id, expires_at")
        .eq("organization_id", orgId)
        .lt("expires_at", new Date().toISOString()),
      supabase
        .from("org_tasks")
        .select("id, status")
        .eq("organization_id", orgId)
        .neq("status", "completed"),
      supabase
        .from("org_members")
        .select("id")
        .eq("organization_id", orgId),
    ]);

    return {
      complianceScore: 85,
      expiringCerts: certs.data?.length || 0,
      openTasks: tasks.data?.length || 0,
      teamMembers: members.data?.length || 0,
    };
  } catch (error) {
    console.error("Failed to fetch org stats:", error);
    return null;
  }
}

async function fetchTeamMembers(supabase: any, orgId: string) {
  try {
    const { data } = await supabase
      .from("org_members")
      .select("id, user_id, role, created_at")
      .eq("organization_id", orgId);
    return data || [];
  } catch (error) {
    console.error("Failed to fetch team members:", error);
    return [];
  }
}

async function fetchCertificates(
  supabase: any,
  orgId: string,
  userId: string,
  role: DatabaseRole
) {
  try {
    const query = supabase
      .from("certificates")
      .select("id, title, issued_date, expires_at, user_id")
      .eq("organization_id", orgId);

    // Employees only see their own
    if (role === "member" || role === "viewer") {
      query.eq("user_id", userId);
    }

    const { data } = await query;
    return data || [];
  } catch (error) {
    console.error("Failed to fetch certificates:", error);
    return [];
  }
}

async function fetchEvidence(
  supabase: any,
  orgId: string,
  userId: string,
  role: DatabaseRole
) {
  try {
    const query = supabase
      .from("evidence")
      .select("id, title, status, user_id, created_at")
      .eq("organization_id", orgId);

    // Employees only see their own
    if (role === "member" || role === "viewer") {
      query.eq("user_id", userId);
    }

    const { data } = await query.order("created_at", { ascending: false });
    return data || [];
  } catch (error) {
    console.error("Failed to fetch evidence:", error);
    return [];
  }
}

async function fetchTasks(
  supabase: any,
  orgId: string,
  userId: string,
  role: DatabaseRole
) {
  try {
    const query = supabase
      .from("org_tasks")
      .select("id, title, status, due_at, assigned_to")
      .eq("organization_id", orgId);

    // Employees only see assigned to them
    if (role === "member" || role === "viewer") {
      query.eq("assigned_to", userId);
    }

    const { data } = await query.order("due_at", { ascending: true });
    return data || [];
  } catch (error) {
    console.error("Failed to fetch tasks:", error);
    return [];
  }
}
```

---

## Example 2: Create API Endpoint with Permission Guards

### File: `app/api/org/[orgId]/members/route.ts`

```typescript
import { NextResponse, NextRequest } from 'next/server';
import { requireAuth, verifyOrgAccess } from '@/lib/api-permission-guards';
import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * GET /api/org/[orgId]/members
 * List all members in organization (employer only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { orgId: string } },
) {
  // 1. Require permission to view team members
  const { error, context } = await requireAuth('team:view_all_members');
  if (error) return error;

  // 2. Verify user belongs to this organization
  const hasAccess = await verifyOrgAccess(context.userId, params.orgId);
  if (!hasAccess) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    // 3. Fetch members (RLS applies automatically)
    const supabase = await createSupabaseServerClient();
    const { data: members, error: dbError } = await supabase
      .from('org_members')
      .select('id, user_id, role, created_at')
      .eq('organization_id', params.orgId)
      .order('created_at', { ascending: false });

    if (dbError) throw dbError;

    // 4. Return members
    return NextResponse.json({ members: members || [] });
  } catch (error) {
    console.error('Failed to fetch members:', error);
    return NextResponse.json(
      { error: 'Failed to fetch members' },
      { status: 500 },
    );
  }
}

/**
 * POST /api/org/[orgId]/members/invite
 * Invite new member to organization
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { orgId: string } },
) {
  // 1. Require permission to invite
  const { error, context } = await requireAuth('team:invite_members');
  if (error) return error;

  // 2. Verify user belongs to org
  const hasAccess = await verifyOrgAccess(context.userId, params.orgId);
  if (!hasAccess) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    // 3. Parse request
    const { email, role } = await request.json();

    // 4. Validate input
    if (!email || !role) {
      return NextResponse.json(
        { error: 'Missing email or role' },
        { status: 400 },
      );
    }

    if (!['admin', 'member', 'viewer'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // 5. Create invitation in database
    const supabase = await createSupabaseServerClient();
    const { data: invitation, error: dbError } = await supabase
      .from('team_invitations')
      .insert({
        organization_id: params.orgId,
        email,
        role,
        invited_by: context.userId,
        created_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (dbError) throw dbError;

    // 6. Send invitation email (pseudo-code)
    // await sendInvitationEmail(email, params.orgId);

    return NextResponse.json({
      success: true,
      invitation: { id: invitation?.id, email, role },
    });
  } catch (error) {
    console.error('Failed to invite member:', error);
    return NextResponse.json(
      { error: 'Failed to invite member' },
      { status: 500 },
    );
  }
}
```

---

## Example 3: Update Onboarding Role Assignment

### File: `app/onboarding/page.tsx`

**Current (WRONG)**:

```typescript
const ROLE_OPTIONS = [
  { id: 'employer', label: 'Employer / Organization admin', role: 'owner' },
  { id: 'employee', label: 'Employee / Field staff', role: 'staff' }, // ❌ Wrong!
];
```

**Fixed (CORRECT)**:

```typescript
import { DatabaseRole } from '@/lib/roles';

const ROLE_OPTIONS: Array<{ id: string; label: string; role: DatabaseRole }> = [
  { id: 'employer', label: 'Employer / Organization admin', role: 'owner' },
  { id: 'employee', label: 'Employee / Field staff', role: 'member' }, // ✅ Correct!
];
```

Then update where role is used:

```typescript
// When creating org_members entry:
const { error: memberError } = await admin.from('org_members').insert({
  organization_id: organizationId,
  user_id: userId,
  role: selectedRole, // Use the selected role directly
});
```

---

## Example 4: Use Permission Checks in React Components

### Component: Check Permission Before Showing Button

```typescript
import { canAccessModule, hasPermission } from "@/lib/roles";
import { DatabaseRole } from "@/lib/roles";

interface TeamManagementProps {
  userRole: DatabaseRole;
}

export function TeamManagementSection({ userRole }: TeamManagementProps) {
  // Option 1: Check module access
  if (!canAccessModule(userRole, "team_management")) {
    return (
      <div className="p-4 rounded-lg bg-slate-900 border border-white/10">
        <p className="text-slate-400">Team management not available for your role.</p>
      </div>
    );
  }

  // Option 2: Check specific permission
  const canInvite = hasPermission(userRole, "team:invite_members");
  const canRemove = hasPermission(userRole, "team:remove_members");

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Team Management</h2>

      {canInvite && (
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg">
          + Invite Member
        </button>
      )}

      <TeamTable>
        {canRemove && (
          <column
            header="Actions"
            render={(member) => (
              <button className="text-red-400 hover:text-red-300">
                Remove
              </button>
            )}
          />
        )}
      </TeamTable>
    </div>
  );
}
```

---

## Example 5: Update API with Better Error Handling

### File: `app/api/org/[orgId]/certificates/route.ts`

```typescript
import { NextResponse, NextRequest } from 'next/server';
import { requireAuth } from '@/lib/api-permission-guards';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { orgId: string } },
) {
  // 1. Auth check
  const { error, context } = await requireAuth('cert:create');
  if (error) {
    console.log('[API] Certificate creation denied - insufficient permissions');
    return error;
  }

  try {
    // 2. Parse body
    const { title, issuedDate, expiresDate, userId } = await request.json();

    // 3. Validate
    if (!title || !issuedDate || !expiresDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 },
      );
    }

    // 4. Fetch org to verify it exists
    const supabase = await createSupabaseServerClient();
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .eq('id', params.orgId)
      .maybeSingle();

    if (orgError || !org) {
      console.error('[API] Org not found:', params.orgId);
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 },
      );
    }

    // 5. Create certificate
    const { data: cert, error: certError } = await supabase
      .from('certificates')
      .insert({
        organization_id: params.orgId,
        user_id: userId,
        title,
        issued_date: issuedDate,
        expires_at: expiresDate,
        created_by: context.userId,
      })
      .select('id')
      .single();

    if (certError) {
      console.error('[API] Certificate creation failed:', certError);
      return NextResponse.json(
        { error: 'Failed to create certificate' },
        { status: 500 },
      );
    }

    console.log('[API] Certificate created:', cert?.id);

    return NextResponse.json(
      { success: true, certificate: cert },
      { status: 201 },
    );
  } catch (error) {
    console.error('[API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
```

---

## Example 6: Test Role-Based Access

### Test File: `__tests__/rbac.test.ts`

```typescript
import { hasPermission, canAccessModule, isEmployerRole } from '@/lib/roles';
import { DatabaseRole } from '@/lib/roles';

describe('RBAC System', () => {
  describe('Role Classification', () => {
    it('identifies employer roles', () => {
      expect(isEmployerRole('owner')).toBe(true);
      expect(isEmployerRole('admin')).toBe(true);
      expect(isEmployerRole('member')).toBe(false);
      expect(isEmployerRole('viewer')).toBe(false);
    });
  });

  describe('Permissions', () => {
    it('owner has all permissions', () => {
      expect(hasPermission('owner', 'org:view_overview')).toBe(true);
      expect(hasPermission('owner', 'team:invite_members')).toBe(true);
      expect(hasPermission('owner', 'billing:manage')).toBe(true);
    });

    it('member has limited permissions', () => {
      expect(hasPermission('member', 'org:view_overview')).toBe(false);
      expect(hasPermission('member', 'cert:view_own')).toBe(true);
      expect(hasPermission('member', 'team:view_all_members')).toBe(false);
    });

    it('admin cannot manage billing', () => {
      expect(hasPermission('admin', 'billing:manage')).toBe(false);
      expect(hasPermission('admin', 'org:manage_settings')).toBe(true);
    });
  });

  describe('Module Access', () => {
    it('owner sees all modules as active', () => {
      expect(canAccessModule('owner', 'org_overview')).toBe(true);
      expect(canAccessModule('owner', 'billing')).toBe(true);
      expect(canAccessModule('owner', 'admin_settings')).toBe(true);
    });

    it('employee sees limited modules', () => {
      expect(canAccessModule('member', 'org_overview')).toBe(false);
      expect(canAccessModule('member', 'my_compliance')).toBe(true);
      expect(canAccessModule('member', 'billing')).toBe(false);
    });
  });
});
```

---

## Quick Checklist: Steps to Implement

- [ ] **Step 1**: Copy `lib/roles.ts` and replace existing version
- [ ] **Step 2**: Copy new dashboard components to `components/dashboard/`
- [ ] **Step 3**: Copy `lib/api-permission-guards.ts`
- [ ] **Step 4**: Refactor `/app/page.tsx` to use new layout
- [ ] **Step 5**: Fix onboarding role assignment
- [ ] **Step 6**: Add permission guards to API routes
- [ ] **Step 7**: Test with employer + employee accounts
- [ ] **Step 8**: Commit and deploy

---

**Next**: Follow IMPLEMENTATION_GUIDE.md for full deployment instructions.
