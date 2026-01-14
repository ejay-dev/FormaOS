# Performance Audit Report - FormaOS

## Current Issues Identified

### 1. **Duplicate Server Fetches Per Page**

**Problem**: Every page (policies, billing, tasks, etc.) performs its own Supabase queries:
- `org_members` (select organization_id, role)
- `organizations` (select name, plan_key, etc.)
- Page-specific queries

**Files**:
- `/app/app/policies/page.tsx`: Line 14-20 - Fetches org_members every time
- `/app/app/billing/page.tsx`: Line 17-32 - Fetches org_members + organizations
- `/app/(dashboard)/organization/[orgId]/audit/page.tsx`: Line 18 - Separate org ID resolution

**Impact**: ~3-5 redundant database calls per sidebar click

### 2. **Layout Auth Runs on Every Page Change**

**File**: `/app/app/layout.tsx`

**What happens**:
```
User clicks sidebar link
  → Next.js renders new page
  → Layout re-executes (async)
    → createSupabaseServerClient()
    → supabase.auth.getUser()
    → Founder check (string parsing)
    → org_members query (again)
    → organizations query (again)
    → Plan/role/entitlement checks
  → Page renders
```

**Cost**: 200-400ms of blocking server-side work before page shows

### 3. **SystemStateHydrator Exists But Underutilized**

**Good**: `/lib/system-state/server.ts` already has `fetchSystemState()` function
**Missing**: It's called but not cached/shared across pages

**Current**: Each component creates its own Supabase client
**Should**: Share hydrated state globally

### 4. **Client Components Re-fetch on Mount**

**File**: `/components/topbar.tsx`
- `useEffect` calls `loadProfile()` every mount
- Creates new Supabase client with `useMemo()`
- Duplicates data already available from layout

### 5. **No Route Prefetching**

**Sidebar**: Uses basic `<Link>` without prefetch
**Missing**: No `router.prefetch()` calls before user interaction

---

## Performance Targets

| Metric | Current | Target | Gain |
|--------|---------|--------|------|
| First Sidebar Click → Page Render | 400-600ms | <150ms | **75% faster** |
| Subsequent Clicks | 400-600ms | <100ms | **83% faster** |
| Duplicate DB Queries/Route | 3-5 | 0 | **100% eliminated** |
| CPU Spike on Click | High | Minimal | **No re-renders** |

---

## Proposed Solution Architecture

```
Login/Session Created
    ↓
[Hydration Endpoint]
    ↓ (fetch once)
    ├─ User Data
    ├─ Organization
    ├─ Plan/Role/Entitlements
    └─ Store in Zustand
    ↓
[App Mounted with Hydrated State]
    ↓
[Sidebar Navigation]
    ├─ No server fetch needed ✓
    ├─ Prefetch next page ✓
    ├─ Instant transition ✓
    └─ No spinner ✓
```

---

## Implementation Plan

1. **Install Zustand** for client-side global state
2. **Create appStore** with user/org/plan/role/entitlements
3. **Create API hydration endpoint** (`/api/system-state`)
4. **Wrap app with hydrator** that calls endpoint once on mount
5. **Convert pages to client components** (policies, billing, tasks, etc.)
6. **Use store data instead of server queries**
7. **Add route prefetching** to sidebar links
8. **Verify zero duplicate queries** via DevTools

---

## Files to Modify

- `package.json` - add zustand
- `lib/stores/app.ts` - new store
- `lib/api/hydration.ts` - new client for hydration endpoint
- `app/api/system-state/route.ts` - new API endpoint
- `app/app/layout.tsx` - add hydrator wrapper
- `components/sidebar.tsx` - add prefetching
- `app/app/policies/page.tsx` - convert to client + use store
- `app/app/billing/page.tsx` - convert to client + use store
- `app/app/page.tsx` - optimize dashboard
- (other pages as needed)

