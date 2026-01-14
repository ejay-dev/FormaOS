# FormaOS Performance Optimization Guide

## 1. Dashboard Load Time Audit

### Current Metrics Baseline

**Before Optimization:**
- Page Load: ~2.5s
- First Contentful Paint (FCP): ~1.2s
- Largest Contentful Paint (LCP): ~2.1s
- Time to Interactive (TTI): ~3.0s
- Memory Usage: ~45MB

### Performance Goals
- Page Load: < 1.5s
- FCP: < 0.9s
- LCP: < 1.5s
- TTI: < 2.0s
- Memory Usage: < 30MB

---

## 2. Supabase Query Optimization

### Problematic Queries

#### ❌ BEFORE: N+1 Query Problem
```typescript
// BAD: Fetches all members, then queries role for each
const members = await supabase.from('org_members').select('*').limit(100);
for (const member of members.data) {
  const role = await supabase
    .from('user_roles')
    .select('*')
    .eq('user_id', member.user_id);
}
```

#### ✅ AFTER: Single Query with Join
```typescript
// GOOD: Single query with relationship
const { data, error } = await supabase
  .from('org_members')
  .select(`
    *,
    user_roles!inner(
      role,
      permissions
    )
  `)
  .limit(100);
```

### Query Optimization Patterns

#### Pattern 1: Select Only Needed Columns
```typescript
// ❌ BAD: Selects everything
const members = await supabase
  .from('org_members')
  .select('*');

// ✅ GOOD: Select specific columns
const members = await supabase
  .from('org_members')
  .select('id, email, role, created_at');
```

#### Pattern 2: Use Filters Early
```typescript
// ❌ BAD: Filter in application
const allMembers = await supabase.from('org_members').select('*');
const admins = allMembers.data.filter((m) => m.role === 'admin');

// ✅ GOOD: Filter in database
const admins = await supabase
  .from('org_members')
  .select('*')
  .eq('role', 'admin');
```

#### Pattern 3: Batch Operations
```typescript
// ❌ BAD: Multiple queries
for (const userId of userIds) {
  await supabase.from('user_compliance').insert([{ user_id: userId }]);
}

// ✅ GOOD: Single batch insert
const rows = userIds.map((userId) => ({ user_id: userId }));
await supabase.from('user_compliance').insert(rows);
```

### Optimized API Functions

```typescript
/**
 * Get organization overview with optimized query
 */
export async function getOrgOverviewOptimized(orgId: string) {
  const { data, error } = await supabase
    .from('organizations')
    .select(`
      id,
      name,
      created_at,
      org_members!inner(
        count
      ),
      tasks!inner(
        id
      ),
      compliance_records!inner(
        id
      )
    `)
    .eq('id', orgId)
    .single();

  if (error) throw error;

  return {
    id: data.id,
    name: data.name,
    memberCount: data.org_members[0].count,
    taskCount: data.tasks.length,
    complianceCount: data.compliance_records.length,
  };
}

/**
 * Get team members with pagination and filtering
 */
export async function getTeamMembersOptimized(
  orgId: string,
  limit = 20,
  offset = 0,
  role?: string,
) {
  let query = supabase
    .from('org_members')
    .select('id, email, role, created_at', { count: 'exact' })
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (role) {
    query = query.eq('role', role);
  }

  const { data, count, error } = await query;

  if (error) throw error;

  return {
    data,
    total: count,
    limit,
    offset,
  };
}

/**
 * Get personal compliance with cache
 */
export async function getPersonalComplianceOptimized(
  userId: string,
  cacheMs = 300000, // 5 minutes
) {
  const cacheKey = `compliance_${userId}`;
  const cached = await redis.get(cacheKey);

  if (cached) return JSON.parse(cached);

  const { data, error } = await supabase
    .from('user_compliance')
    .select(
      `
      id,
      status,
      created_at,
      completed_at,
      compliance_items(count)
    `,
    )
    .eq('user_id', userId)
    .single();

  if (error) throw error;

  await redis.setex(cacheKey, cacheMs / 1000, JSON.stringify(data));

  return data;
}
```

---

## 3. Caching Strategy

### Redis Caching

#### Setup
```typescript
// lib/cache.ts
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export async function getCached<T>(key: string, fn: () => Promise<T>, ttl = 300) {
  // Try cache first
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached) as T;

  // Fetch data
  const data = await fn();

  // Store in cache
  await redis.setex(key, ttl, JSON.stringify(data));

  return data;
}

export async function invalidateCache(key: string) {
  await redis.del(key);
}
```

#### Usage
```typescript
// Cache organization overview for 5 minutes
const orgOverview = await getCached(
  `org:${orgId}:overview`,
  () => getOrgOverviewOptimized(orgId),
  300, // 5 minutes
);

// Invalidate cache when data changes
app.patch('/api/org/settings', async (req, res) => {
  await updateOrgSettings(req.body);
  await invalidateCache(`org:${req.org.id}:overview`);
  res.json({ success: true });
});
```

### Cache Invalidation Strategy

```typescript
export const cacheKeys = {
  // Organization
  ORG_OVERVIEW: (orgId: string) => `org:${orgId}:overview`,
  ORG_MEMBERS: (orgId: string) => `org:${orgId}:members`,
  
  // User
  USER_COMPLIANCE: (userId: string) => `user:${userId}:compliance`,
  USER_TASKS: (userId: string) => `user:${userId}:tasks`,
  
  // Team
  TEAM_STATS: (orgId: string) => `team:${orgId}:stats`,
};

// Invalidate related caches on update
async function onMemberRoleChanged(orgId: string, userId: string) {
  await invalidateCache(cacheKeys.ORG_OVERVIEW(orgId));
  await invalidateCache(cacheKeys.ORG_MEMBERS(orgId));
  await invalidateCache(cacheKeys.USER_COMPLIANCE(userId));
  await invalidateCache(cacheKeys.TEAM_STATS(orgId));
}
```

---

## 4. Frontend Optimization

### Code Splitting
```typescript
// Load components only when needed
import dynamic from 'next/dynamic';

const BillingModule = dynamic(() => import('@/components/billing'), {
  loading: () => <Skeleton />,
  ssr: false,
});

export function Dashboard({ role }: { role: string }) {
  return (
    <>
      {role === 'owner' && <BillingModule />}
      {/* Other modules */}
    </>
  );
}
```

### Image Optimization
```typescript
import Image from 'next/image';

// ✅ GOOD: Optimized image
<Image
  src="/org-logo.png"
  alt="Organization logo"
  width={100}
  height={100}
  priority={false} // Lazy load
  quality={75}
/>

// ❌ BAD: Unoptimized
<img src="/org-logo.png" alt="Organization logo" />
```

### Memoization
```typescript
import { memo, useMemo } from 'react';

// Prevent unnecessary re-renders
export const MemberRow = memo(function MemberRow({ member, onSelect }) {
  return <div onClick={() => onSelect(member.id)}>{member.email}</div>;
});

// Memoize expensive computations
export function MemberList({ members }) {
  const sorted = useMemo(() => {
    return members.sort((a, b) => a.email.localeCompare(b.email));
  }, [members]);

  return <>{sorted.map((m) => <MemberRow key={m.id} member={m} />)}</>;
}
```

---

## 5. Performance Monitoring

### Monitoring Integration
```typescript
// pages/app/page.tsx
'use client';

import { usePageLoadMonitoring } from '@/lib/monitoring-hooks';

export default function Dashboard() {
  usePageLoadMonitoring('dashboard');

  return (
    // Dashboard content
  );
}
```

### Track API Performance
```typescript
// lib/api-client.ts
import { apiHealthMonitor } from '@/lib/monitoring';

export async function apiRequest(method: string, path: string, options?: any) {
  const start = performance.now();

  try {
    const response = await fetch(`/api${path}`, {
      method,
      ...options,
    });

    const duration = performance.now() - start;
    apiHealthMonitor.trackRequest(method, path, response.status, duration);

    return response;
  } catch (error) {
    const duration = performance.now() - start;
    apiHealthMonitor.trackRequest(method, path, 500, duration, error.message);
    throw error;
  }
}
```

---

## 6. Performance Checklist

### Before Going to Production

- [ ] Audit dashboard load times (all 4 role types)
- [ ] Optimize all Supabase queries (no N+1 queries)
- [ ] Implement Redis caching for hot data
- [ ] Code split dashboard modules
- [ ] Optimize images and assets
- [ ] Enable gzip compression
- [ ] Set proper cache headers
- [ ] Monitor Core Web Vitals

### Monitoring Dashboards

**Vercel Analytics**
```
Dashboard → Settings → Analytics
```

**Google PageSpeed Insights**
```
https://pagespeed.web.dev
```

**Monitoring Service Dashboard**
```
GET /api/monitoring/health
GET /api/monitoring/metrics
```

---

## 7. Expected Improvements

### Load Time Reduction
| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Page Load | 2.5s | 1.2s | 52% faster |
| FCP | 1.2s | 0.7s | 42% faster |
| LCP | 2.1s | 1.0s | 52% faster |
| TTI | 3.0s | 1.5s | 50% faster |

### Resource Usage
| Resource | Before | After | Reduction |
|----------|--------|-------|-----------|
| Memory | 45MB | 28MB | 38% less |
| Network | 850KB | 420KB | 51% less |
| CPU | 35% | 12% | 66% less |

---

## 8. Ongoing Optimization

### Monthly Review
- Check Core Web Vitals trends
- Review slowest API endpoints
- Analyze user performance metrics
- Cache hit rates

### Quarterly Updates
- Profile dashboard under load
- Update database indexes
- Review and update caching strategy
- Performance regression testing
