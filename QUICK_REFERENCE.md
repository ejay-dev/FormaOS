# ⚡ Performance Optimization - Quick Reference Card

## For Developers: How to Use the New System

### Get Organization ID
```typescript
import { useOrgId } from '@/lib/stores/app';

export function MyComponent() {
  const orgId = useOrgId();
  
  useEffect(() => {
    fetchData(orgId);
  }, [orgId]);
}
```

### Get User Role
```typescript
import { useUserRole } from '@/lib/stores/app';

export function RoleBasedUI() {
  const role = useUserRole();
  
  if (role === 'owner') return <OwnerDashboard />;
  if (role === 'admin') return <AdminDashboard />;
  return <UserDashboard />;
}
```

### Check Permissions
```typescript
import { useHasPermission } from '@/lib/stores/app';

export function FeatureGated() {
  const canEdit = useHasPermission('canEditPolicies');
  
  if (!canEdit) return <PermissionDenied />;
  return <Editor />;
}
```

### Check if Module Enabled
```typescript
import { useIsModuleEnabled } from '@/lib/stores/app';

export function ModuleAccess() {
  const hasModule = useIsModuleEnabled('policies');
  
  if (!hasModule) return <ModuleLocked />;
  return <PoliciesUI />;
}
```

### Check if Founder
```typescript
import { useIsFounder } from '@/lib/stores/app';

export function FounderFeature() {
  const isFounder = useIsFounder();
  
  if (isFounder) return <AdminConsole />;
  return null;
}
```

---

## Hydration in Server Layout

```typescript
// app/app/layout.tsx
const systemState = await fetchSystemState();

return (
  <AppHydrator initialState={systemState}>
    {/* rest of app */}
  </AppHydrator>
);
```

---

## Converting a Server Page to Client

### Before (Server Component)
```typescript
// app/app/policies/page.tsx
export default async function PoliciesPage() {
  const supabase = await createSupabaseServerClient();
  
  // ❌ Fetch org_members
  const { data: membership } = await supabase
    .from("org_members")
    .select("organization_id")
    .eq("user_id", user.id);
  
  // ❌ Fetch policies
  const { data: policies } = await supabase
    .from("org_policies")
    .select("*")
    .eq("organization_id", orgId);
    
  return <PoliciesList policies={policies} />;
}
```

### After (Client Component)
```typescript
// app/app/policies/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useOrgId } from '@/lib/stores/app';
import { createSupabaseClient } from '@/lib/supabase/client';

export default function PoliciesPage() {
  const orgId = useOrgId();  // ✅ Get from store
  const supabase = useMemo(() => createSupabaseClient(), []);
  const [policies, setPolicies] = useState([]);
  
  // ✅ Only fetch policies
  useEffect(() => {
    if (!orgId) return;
    
    const fetch = async () => {
      const { data } = await supabase
        .from("org_policies")
        .select("*")
        .eq("organization_id", orgId);
      setPolicies(data || []);
    };
    
    fetch();
  }, [orgId, supabase]);
  
  return <PoliciesList policies={policies} />;
}
```

---

## Don'ts & Do's

### ❌ DON'T
```typescript
// Don't query org_members for org_id
const { data: membership } = await supabase
  .from("org_members")
  .select("organization_id")
  .eq("user_id", user.id);

// Don't fetch user profile on every page
useEffect(() => {
  fetchUserProfile();
}, []);

// Don't make page a server component just for auth
export default async function Page() {
  // ...server logic...
}
```

### ✅ DO
```typescript
// Do use the store for org_id
const orgId = useOrgId();

// Do use memoization for client-side data
const userProfile = useMemo(() => {
  return store.user;
}, [store.user]);

// Do make pages client components that use store
'use client';

export default function Page() {
  const orgId = useOrgId();
  // only fetch page-specific data
}
```

---

## Common Patterns

### Pattern 1: Fetch Page Data on Mount
```typescript
'use client';

import { useEffect, useState } from 'react';
import { useOrgId } from '@/lib/stores/app';

export default function TasksPage() {
  const orgId = useOrgId();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!orgId) return;
    
    const fetch = async () => {
      const { data } = await supabase
        .from("org_tasks")
        .select("*")
        .eq("organization_id", orgId);
      setTasks(data || []);
      setLoading(false);
    };
    
    fetch();
  }, [orgId]);
  
  if (loading) return <Skeleton />;
  return <TasksList tasks={tasks} />;
}
```

### Pattern 2: Role-Based Rendering
```typescript
'use client';

import { useUserRole } from '@/lib/stores/app';

export default function Dashboard() {
  const role = useUserRole();
  
  return (
    <div>
      {role === 'owner' && <OwnerSection />}
      {role === 'admin' && <AdminSection />}
      {(role === 'owner' || role === 'admin') && (
        <ManagementSection />
      )}
      <UserSection /> {/* visible to all */}
    </div>
  );
}
```

### Pattern 3: Conditional Features
```typescript
'use client';

import { useHasPermission, useIsModuleEnabled } from '@/lib/stores/app';

export default function FeaturePage() {
  const canExport = useHasPermission('canExportReports');
  const hasModule = useIsModuleEnabled('reports');
  
  if (!hasModule) return <ModuleLocked />;
  if (!canExport) return <FeatureRestricted />;
  
  return <ReportsUI />;
}
```

### Pattern 4: Parallel Data Fetches
```typescript
'use client';

import { useEffect, useState } from 'react';
import { useOrgId } from '@/lib/stores/app';

export default function DashboardPage() {
  const orgId = useOrgId();
  const [data, setData] = useState(null);
  
  useEffect(() => {
    if (!orgId) return;
    
    const fetch = async () => {
      const [
        { data: policies },
        { data: tasks },
        { data: compliance }
      ] = await Promise.all([
        supabase.from("org_policies")
          .select("*")
          .eq("organization_id", orgId),
        supabase.from("org_tasks")
          .select("*")
          .eq("organization_id", orgId),
        supabase.from("org_compliance")
          .select("*")
          .eq("organization_id", orgId)
      ]);
      
      setData({ policies, tasks, compliance });
    };
    
    fetch();
  }, [orgId]);
  
  return <Dashboard data={data} />;
}
```

---

## Debugging

### Check If Hydrated
```typescript
'use client';
import { useAppStore } from '@/lib/stores/app';

export function DebugHydration() {
  const isHydrated = useAppStore(s => s.isHydrated);
  const hydrationError = useAppStore(s => s.hydrationError);
  
  if (!isHydrated) return <p>Loading...</p>;
  if (hydrationError) return <p>Error: {hydrationError}</p>;
  return <p>✅ Hydrated</p>;
}
```

### Log Store State
```typescript
'use client';
import { useAppStore } from '@/lib/stores/app';

export function DebugStore() {
  const state = useAppStore();
  
  useEffect(() => {
    console.log('Store state:', state);
  }, [state]);
  
  return null;
}
```

### Monitor Network
```typescript
// DevTools → Network → Filter by "XHR"
// Should NOT see repeated org_members queries
// Should see only:
// - /api/system-state (first load only)
// - Page-specific queries (org_policies, org_tasks, etc)
```

---

## Performance Tips

### Tip 1: Use Selectors
```typescript
// Optimize re-renders with selectors
const orgId = useAppStore(s => s.organization?.id);
// Only re-renders when orgId changes
```

### Tip 2: Memoize Store Subscriptions
```typescript
const orgId = useMemo(() => useOrgId(), []);
```

### Tip 3: Parallel Fetches
```typescript
// Fetch multiple things at once
const [a, b, c] = await Promise.all([
  fetch1(), fetch2(), fetch3()
]);
```

### Tip 4: Lazy Load Heavy Components
```typescript
const HeavyComponent = lazy(() => import('./Heavy'));

<Suspense fallback={<Skeleton />}>
  <HeavyComponent orgId={orgId} />
</Suspense>
```

---

## Testing Checklist

- [ ] Data loads without org_members query
- [ ] Navigation is instant (<100ms)
- [ ] No console errors
- [ ] Store populated after login
- [ ] All pages work with new system
- [ ] Mobile works same as desktop
- [ ] Permissions still enforced
- [ ] Founder check still works
- [ ] Role-based access works

---

## Files You Might Need

| File | Purpose |
|------|---------|
| `lib/stores/app.ts` | Zustand store definition |
| `components/app-hydrator.tsx` | Hydrator component |
| `app/api/system-state/route.ts` | Hydration endpoint |
| `lib/system-state/server.ts` | Server data fetching |
| `app/app/layout.tsx` | App shell with hydrator |

---

## Useful Commands

```bash
# Install dependencies
npm install

# Type check
npm run type-check

# Build
npm run build

# Dev server
npm run dev

# Check for unused imports
npm run lint
```

---

## Resources

- **Performance Audit**: `PERFORMANCE_AUDIT.md`
- **Full Details**: `PERFORMANCE_OPTIMIZATION_COMPLETE.md`
- **Testing Guide**: `VERIFICATION_GUIDE.md`
- **Architecture**: `ARCHITECTURE_DIAGRAMS.md`
- **Deployment**: `DEPLOYMENT_CHECKLIST_PERFORMANCE.md`
- **Executive Summary**: `PERFORMANCE_EXECUTIVE_SUMMARY.md`

---

## Quick Links

- 📊 Check store: `useAppStore()`
- 🔑 Get org ID: `useOrgId()`
- 👤 Get role: `useUserRole()`
- ✅ Check perm: `useHasPermission()`
- 🎯 Check module: `useIsModuleEnabled()`

---

## Still have questions?

Check the full documentation files or reach out to the team. The new system is designed to be simple and intuitive - you've got this! 🚀

