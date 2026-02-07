# Testing & Performance Monitoring Guide

## Overview

This guide covers the comprehensive testing and performance monitoring infrastructure for FormaOS's industry-based onboarding system.

## Testing Structure

### Unit Tests

Located in `/tests/onboarding/`

#### RBAC Utilities (`rbac-utils.test.ts`)

Tests role-based access control for industry onboarding features.

**Coverage:**

- `canConfigureIndustry()` - All 4 roles (owner, admin, member, viewer)
- `canProvisionFrameworks()` - Admin vs non-admin access
- `canApplyIndustryPacks()` - Permission validation
- `canViewIndustryGuidance()` - Universal read access
- `checkIndustryPermission()` - Action-based permissions with helpful error messages
- Integration scenarios (owner full access, member view-only)

**Run:**

```bash
npm test tests/onboarding/rbac-utils.test.ts
```

#### Progress Persistence (`progress-persistence.test.ts`)

Tests localStorage caching system for onboarding progress.

**Coverage:**

- `getCachedProgress()` - Cache retrieval with TTL validation
- `setCachedProgress()` - Cache storage and overwrites
- `clearCachedProgress()` - Cache removal
- `hasFreshCache()` - Fresh cache detection
- Cache expiration (5-minute TTL boundaries)
- Multi-org isolation
- Error handling (corrupted JSON, storage full)

**Run:**

```bash
npm test tests/onboarding/progress-persistence.test.ts
```

#### API Integration (`onboarding-checklist.integration.test.ts`)

Tests `/api/onboarding/checklist` endpoint and data fetching.

**Coverage:**

- All 12+ count fields returned
- `orgProfileComplete` calculation
- Error handling and graceful degradation
- RLS policy enforcement (placeholder tests)
- Performance validation (<2s response time)

**Run:**

```bash
npm test tests/api/onboarding-checklist.integration.test.ts
```

### E2E Tests

Located in `/e2e/`

#### Industry Onboarding Flow (`industry-onboarding.spec.ts`)

Comprehensive Playwright tests for complete user journey.

**Test Suites:**

1. **Complete Flow**
   - GettingStartedChecklist display on dashboard
   - Industry-specific checklist items
   - Priority indicators (border colors)
   - Time estimates display
   - Navigation on item click

2. **Industry Guidance Panel**
   - Panel visibility for valid industries
   - Status card and progress ring
   - Next recommended action
   - Industry insights
   - Loading skeleton states

3. **Completion Tracking**
   - Progress percentage calculation
   - Confetti animation at 100%
   - localStorage caching
   - Cache persistence across refreshes

4. **Accessibility**
   - ARIA labels (aria-label, aria-describedby)
   - Keyboard navigation (Tab key)
   - Visible focus states

5. **Error Handling**
   - API errors gracefully handled
   - Network error recovery
   - Fallback to cached data

6. **Performance**
   - Dashboard loads <5s
   - Cached data displays <1s
   - Smooth animations

**Run:**

```bash
npm run test:e2e e2e/industry-onboarding.spec.ts
```

**Run with UI:**

```bash
npm run test:e2e:ui
```

## Performance Monitoring

### Real User Monitoring (RUM)

#### Setup

1. Install web-vitals (if not already installed):

```bash
npm install web-vitals
```

2. Initialize monitoring in your root layout:

```typescript
// app/layout.tsx
import { initPerformanceMonitoring } from '@/lib/monitoring/performance-monitor';

export default function RootLayout({ children }) {
  useEffect(() => {
    initPerformanceMonitoring();
  }, []);

  return <html>{children}</html>;
}
```

#### Web Vitals Tracked

- **LCP (Largest Contentful Paint)**: <2.5s good, <4s needs improvement
- **FID (First Input Delay)**: <100ms good, <300ms needs improvement
- **CLS (Cumulative Layout Shift)**: <0.1 good, <0.25 needs improvement
- **TTFB (Time to First Byte)**: <800ms good, <1.8s needs improvement
- **INP (Interaction to Next Paint)**: <200ms good, <500ms needs improvement

#### Custom Metrics

**Automatically Tracked:**

- `checklist_load_time` - Time to load onboarding checklist
- `roadmap_render_time` - IndustryRoadmap component render time
- `cache_hit` / `cache_miss` - Cache effectiveness
- `api_request_time` - API endpoint latency
- `component_mount_time` - Component initialization time

**Manual Tracking:**

```typescript
import {
  trackCustomMetric,
  CUSTOM_METRICS,
} from '@/lib/monitoring/performance-monitor';

// Track custom operation
trackCustomMetric('my_operation', performanceValue, {
  metadata: 'additional context',
});

// Track async operation
const result = await trackAsyncOperation(
  'fetch_user_data',
  async () => await fetchData(),
  { userId: 123 },
);

// Track API request
const data = await trackAPIRequest('/api/my-endpoint', () =>
  fetch('/api/my-endpoint'),
);

// Track cache event
trackCacheEvent(true, 'user_preferences'); // Cache hit
trackCacheEvent(false, 'user_preferences'); // Cache miss
```

### Performance Dashboard

Development-only real-time performance monitor.

**Features:**

- Live Web Vitals display
- Custom metrics tracking
- Performance budget warnings
- Color-coded thresholds (green/yellow/red)

**Usage:**

- Only visible in development mode
- Click "📊 Perf" button (bottom-right)
- View real-time metrics
- Warnings for threshold violations

**Add to your app:**

```typescript
// app/layout.tsx or dashboard layout
import { PerformanceDashboard } from '@/components/monitoring/PerformanceDashboard';

export default function Layout({ children }) {
  return (
    <>
      {children}
      <PerformanceDashboard />
    </>
  );
}
```

### Analytics Integration

#### Google Analytics 4

Metrics automatically sent to GA4:

```javascript
gtag('event', 'LCP', {
  event_category: 'Web Vitals',
  value: 2345,
  metric_rating: 'good',
});
```

#### Vercel Analytics

```javascript
va('track', 'checklist_load_time', {
  value: 234,
  industry: 'ndis',
});
```

## Performance Budget

### Thresholds

| Metric         | Good   | Needs Improvement | Poor   |
| -------------- | ------ | ----------------- | ------ |
| LCP            | ≤2.5s  | ≤4s               | >4s    |
| FID            | ≤100ms | ≤300ms            | >300ms |
| CLS            | ≤0.1   | ≤0.25             | >0.25  |
| TTFB           | ≤800ms | ≤1.8s             | >1.8s  |
| INP            | ≤200ms | ≤500ms            | >500ms |
| Checklist Load | ≤500ms | ≤2s               | >2s    |
| Roadmap Render | ≤300ms | ≤1s               | >1s    |

### Budget Enforcement

Use `getPerformanceBudgetStatus()` to check violations:

```typescript
import { getPerformanceBudgetStatus } from '@/lib/monitoring/performance-monitor';

const warnings = getPerformanceBudgetStatus();
warnings.forEach((warning) => {
  console.warn(`${warning.metric}: ${warning.message}`);
});
```

## Running Tests

### All Unit Tests

```bash
npm test
```

### All Unit Tests (Watch Mode)

```bash
npm run test:watch
```

### All Unit Tests (Coverage)

```bash
npm run test:coverage
```

### All E2E Tests

```bash
npm run test:e2e
```

### Specific Test File

```bash
npm test tests/onboarding/rbac-utils.test.ts
npm run test:e2e e2e/industry-onboarding.spec.ts
```

### Quick Smoke Tests

```bash
npm run qa:smoke
```

### Full QA Suite

```bash
npm run qa:full
```

## CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/test.yml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm test
      - run: npm run test:e2e
```

### Vercel Deploy Hooks

Performance monitoring automatically activates on Vercel deployments:

```bash
# vercel.json
{
  "env": {
    "NEXT_PUBLIC_GA_ID": "G-XXXXXXXXXX",
    "NEXT_PUBLIC_VERCEL_ANALYTICS_ID": "prj_xxx"
  }
}
```

## Debugging

### View Test Output

```bash
npm test -- --verbose
```

### Debug E2E Tests

```bash
npm run test:e2e:ui
```

### View Performance Logs

```bash
# Enable in development
NODE_ENV=development npm run dev
# Check browser console for: 📊 Performance Metric: {...}
```

### Analyze Bundle

```bash
npm run build
# Check .next/analyze/ for bundle analysis
```

## Best Practices

### Unit Tests

- ✅ Mock external dependencies (Supabase, localStorage)
- ✅ Test happy path and error scenarios
- ✅ Use descriptive test names
- ✅ Isolate tests (beforeEach cleanup)
- ✅ Validate all edge cases

### E2E Tests

- ✅ Test real user journeys
- ✅ Use data-testid attributes
- ✅ Handle async operations properly
- ✅ Test accessibility features
- ✅ Validate error recovery

### Performance Monitoring

- ✅ Track custom metrics for critical operations
- ✅ Set realistic performance budgets
- ✅ Monitor cache hit rates
- ✅ Validate API latency
- ✅ Test on representative hardware

## Troubleshooting

### Tests Failing

1. **localStorage mock issues**
   - Ensure `beforeEach(() => localStorage.clear())` in tests
   - Check mock implementation matches actual API

2. **Async timing issues**
   - Use `await` for all async operations
   - Increase timeouts if needed: `{ timeout: 10000 }`

3. **E2E flakiness**
   - Use `waitForSelector` with proper timeouts
   - Check for race conditions
   - Verify test data setup

### Performance Issues

1. **Slow checklist load**
   - Check cache hit rate (should be >80%)
   - Verify API response time (<500ms)
   - Optimize database queries

2. **High LCP/FID**
   - Review bundle size
   - Implement code splitting
   - Optimize images and fonts

3. **High CLS**
   - Reserve space for dynamic content
   - Use skeleton loaders
   - Avoid layout shifts on load

## Resources

- [Jest Documentation](https://jestjs.io/)
- [Playwright Documentation](https://playwright.dev/)
- [Web Vitals](https://web.dev/vitals/)
- [Vercel Analytics](https://vercel.com/docs/analytics)
- [Google Analytics 4](https://developers.google.com/analytics/devguides/collection/ga4)

## Support

For testing issues or questions:

1. Check this documentation
2. Review test output for specific errors
3. Check browser console for performance logs
4. Verify environment variables are set
5. Consult team for complex scenarios
