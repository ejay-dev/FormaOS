# Industry-Based Onboarding - Quick Reference Guide

## For Developers

### Using the Industry Roadmap Component

```tsx
import { IndustryRoadmapEngine } from '@/components/onboarding/IndustryRoadmap';
import { getRoadmapForIndustry } from '@/lib/onboarding/industry-roadmaps';

// Get roadmap data
const roadmap = getRoadmapForIndustry('ndis'); // or 'healthcare', 'financial_services', etc.

// Render the component
<IndustryRoadmapEngine
  roadmap={roadmap}
  completedSteps={['org-setup', 'team-setup']} // Array of completed step IDs
  onStepClickAction={(stepId) => console.log('Step clicked:', stepId)} // Optional
  showEstimates={true} // Show time estimates
  compact={false} // Full view vs compact
/>;
```

### Using the Industry Guidance Panel

```tsx
import { IndustryGuidancePanel } from '@/components/dashboard/IndustryGuidancePanel';

<IndustryGuidancePanel
  industry="ndis" // Industry ID
  completionCounts={{
    tasks: 5,
    evidence: 3,
    members: 4,
    complianceChecks: 2,
    reports: 1,
    frameworks: 2,
    policies: 6,
    incidents: 1,
    registers: 0,
    workflows: 0,
  }}
  complianceScore={75} // 0-100
  showFullRoadmap={true} // Show full roadmap link
/>;
```

### Using the Dynamic Checklist

```tsx
import { GettingStartedChecklist } from '@/components/onboarding/GettingStartedChecklist';

// Automatically fetches completion counts from API
<GettingStartedChecklist industry="healthcare" />;
```

### Generating Checklists Programmatically

```typescript
import {
  generateIndustryChecklist,
  getChecklistProgress,
  getNextAction,
  estimateTimeToCompletion,
  type ChecklistCompletionCounts,
} from '@/lib/onboarding/industry-checklists';

// Get checklist items for an industry
const items = generateIndustryChecklist('saas_technology');
// Returns: Array<ChecklistItem> with 8 priority items

// Calculate progress
const counts: ChecklistCompletionCounts = {
  tasks: 10,
  evidence: 5,
  members: 3,
  complianceChecks: 2,
  reports: 1,
  frameworks: 2,
  policies: 4,
  incidents: 0,
  registers: 0,
  workflows: 0,
};

const progress = getChecklistProgress(items, counts);
// Returns: {
//   completedCount: 6,
//   totalCount: 8,
//   progress: 75,
//   completedItems: [...],
//   pendingItems: [...]
// }

// Get next recommended action
const nextAction = getNextAction(items, counts);
// Returns: ChecklistItem | null

// Estimate time remaining
const timeMinutes = estimateTimeToCompletion(items, counts);
// Returns: number (total minutes)
```

### Supported Industries

```typescript
type IndustryId =
  | 'ndis'
  | 'healthcare'
  | 'aged_care'
  | 'childcare'
  | 'community_services'
  | 'financial_services'
  | 'saas_technology'
  | 'enterprise'
  | 'other';
```

## For Administrators

### Industry Selection During Onboarding

During the 7-step onboarding wizard (/app/onboarding), users select their industry. This is stored in:

- **Database**: `organizations.industry` column
- **Type**: `text` (one of the industry IDs above)

### Viewing Industry-Specific Guidance

1. **Login as Owner/Admin** - Industry guidance is only visible to these roles
2. **Navigate to Dashboard** - `/app` route after authentication
3. **View Industry Guidance Panel** - Shows at top of dashboard with:
   - Industry-specific progress ring
   - Next recommended action with time estimate
   - Completion insights based on your data
   - Link to full roadmap view

### Understanding Checklist Items

Each checklist item shows:

- **Priority Border**: Red (critical), Orange (high), Yellow (medium), Gray (low)
- **Time Estimate**: "~5 min", "~30 min" - how long the step typically takes
- **Auto-Trigger Badge**: 🗲 Indicates step triggers automation when completed
- **Completion Status**: ✓ (complete) or ○ (pending)

### Completion Logic

Items are marked complete based on:

- **Team Setup**: When you have >1 team member
- **Framework Selection**: When you've selected ≥1 framework
- **Policy Creation**: When you've created ≥2 policies
- **Evidence Upload**: When you've uploaded ≥1 evidence file
- **Compliance Checks**: When you've completed ≥1 evaluation
- **Report Generation**: When you've generated ≥1 report

### Industry-Specific Features

Each industry has:

- **4 Phases**: Foundation, Build, Operationalize, Optimize
- **10-17 Steps**: Tailored to industry compliance requirements
- **Estimated Timeline**: Total days to complete (e.g., 60 days for NDIS)
- **Industry Insights**: Contextual guidance based on your progress

### Examples by Industry

**NDIS**:

- Phase 1: Practice Standards, Service Agreements, Worker Screening
- Phase 2: Quality & Safeguards, Incident Management, Behavior Support
- Focus: NDIS Practice Standards, NDIS Code of Conduct

**Healthcare**:

- Phase 1: HIPAA Compliance, Clinical Governance, Patient Safety
- Phase 2: Medical Records, Infection Control, Medication Management
- Focus: HIPAA, HL7 FHIR, NSQHS Standards

**Financial Services**:

- Phase 1: AML/CFT, PCI DSS, SOX Compliance
- Phase 2: Basel III, Liquidity Management, Stress Testing
- Focus: PCI DSS, AML/CFT, Basel III, SOX

**SaaS Technology**:

- Phase 1: SOC 2 Type I, ISO 27001, GDPR
- Phase 2: Penetration Testing, DevSecOps, Incident Response
- Focus: SOC 2, ISO 27001, GDPR, OWASP Top 10

## For QA/Testing

### Manual Test Cases

**Test 1: Industry-Specific Dashboard**

1. Login as admin user
2. Navigate to `/app` (dashboard)
3. Verify GettingStartedChecklist shows industry-specific title (e.g., "NDIS Activation Roadmap")
4. Verify IndustryGuidancePanel visible above other dashboard sections
5. Click checklist item, verify navigation to correct page

**Test 2: Generic Fallback**

1. Create organization with `industry='other'` or `industry=null`
2. Login as admin
3. Navigate to dashboard
4. Verify GettingStartedChecklist shows "Getting Started" title (not industry-specific)
5. Verify IndustryGuidancePanel NOT rendered

**Test 3: Completion Tracking**

1. Login as admin with fresh organization
2. Note initial progress (e.g., 0%)
3. Add team member → refresh → verify progress increased
4. Select framework → refresh → verify checklist item completed
5. Create policies → refresh → verify checklist item completed
6. Upload evidence → refresh → verify checklist item completed

**Test 4: API Endpoint**

1. GET `/api/onboarding/checklist`
2. Verify response contains all 10 count fields:
   ```json
   { tasks, evidence, members, complianceChecks, reports, frameworks, policies, incidents, registers, workflows }
   ```
3. Verify counts match database state

**Test 5: Mobile Responsive**

1. Open dashboard on mobile device (or DevTools mobile emulation)
2. Verify IndustryGuidancePanel progress ring renders correctly
3. Verify GettingStartedChecklist scrolls properly
4. Verify IndustryRoadmap (if accessible) shows mobile-optimized layout

### Automated Test Skeleton

```typescript
// tests/onboarding/industry-roadmaps.test.ts
describe('Industry Roadmaps', () => {
  it('should return valid roadmap for all 9 industries', () => {
    const industries = [
      'ndis',
      'healthcare',
      'financial_services',
      'saas_technology',
      'enterprise',
      'aged_care',
      'childcare',
      'community_services',
      'other',
    ];
    industries.forEach((industry) => {
      const roadmap = getRoadmapForIndustry(industry);
      expect(roadmap).toBeDefined();
      expect(roadmap.phases).toHaveLength(4);
      expect(roadmap.totalSteps).toBeGreaterThan(0);
    });
  });

  it('should fallback to "other" for invalid industry', () => {
    const roadmap = getRoadmapForIndustry('invalid_industry' as any);
    expect(roadmap.id).toBe('other');
  });
});

// tests/onboarding/industry-checklists.test.ts
describe('Industry Checklists', () => {
  it('should generate 8 items for valid industry', () => {
    const items = generateIndustryChecklist('ndis');
    expect(items).toHaveLength(8);
  });

  it('should mark items complete based on counts', () => {
    const items = generateIndustryChecklist('healthcare');
    const counts = { members: 2, frameworks: 1, policies: 3 /* ... */ };
    const progress = getChecklistProgress(items, counts);
    expect(progress.completedCount).toBeGreaterThan(0);
  });

  it('should return next incomplete action', () => {
    const items = generateIndustryChecklist('saas_technology');
    const counts = { members: 0, frameworks: 0 /* ... */ };
    const next = getNextAction(items, counts);
    expect(next).toBeDefined();
    expect(next?.completionCheck(counts)).toBe(false);
  });
});

// tests/api/onboarding-checklist.test.ts
describe('GET /api/onboarding/checklist', () => {
  it('should return all 10 count fields', async () => {
    const res = await fetch('/api/onboarding/checklist');
    const data = await res.json();
    expect(data).toHaveProperty('tasks');
    expect(data).toHaveProperty('evidence');
    expect(data).toHaveProperty('members');
    expect(data).toHaveProperty('complianceChecks');
    expect(data).toHaveProperty('reports');
    expect(data).toHaveProperty('frameworks');
    expect(data).toHaveProperty('policies');
    expect(data).toHaveProperty('incidents');
    expect(data).toHaveProperty('registers');
    expect(data).toHaveProperty('workflows');
  });
});
```

## Troubleshooting

### Issue: IndustryGuidancePanel not showing

**Check**:

1. User role is owner or admin (not member/viewer)
2. Organization has valid industry (`organizations.industry` column not null and not 'other')
3. Component is rendering in EmployerDashboard (not EmployeeDashboard)

### Issue: Checklist items not completing

**Check**:

1. API endpoint `/api/onboarding/checklist` returning correct counts
2. Completion logic thresholds met (e.g., members > 1, not members >= 1)
3. Counts refreshing after actions (may need to refresh page or wait for refetch)

### Issue: Wrong roadmap showing

**Check**:

1. `organizations.industry` value matches expected industry ID (lowercase, underscores)
2. Industry prop passed correctly through: page.tsx → DashboardWrapper → EmployerDashboard
3. No typos in industry ID (e.g., 'healthcare' not 'health_care')

### Issue: TypeScript errors on prop types

**Check**:

1. Imported types: `import type { ChecklistCompletionCounts } from '@/lib/onboarding/industry-checklists'`
2. Function props named with "Action" suffix for client components (e.g., `onClickAction`, not `onClick`)
3. All required props provided when rendering components

## Performance Notes

- **Roadmap data** is imported statically (no API call), instant rendering
- **Checklist generation** is memoized, recomputes only when industry changes
- **Completion counts** fetched once on mount, cached in state
- **Progress calculations** use useMemo to prevent unnecessary recalculations
- **Animations** use Framer Motion with GPU-accelerated transforms

## Security Notes

- **RBAC**: Industry guidance only shown to owner/admin roles
- **RLS**: API endpoint respects Row Level Security on all tables
- **Organization Isolation**: All queries filtered by `org_id` or `organization_id`
- **No Direct DB Access**: All data fetched through Supabase client with RLS

---

_Last Updated: 2024 | FormaOS Industry Onboarding v1.0_
