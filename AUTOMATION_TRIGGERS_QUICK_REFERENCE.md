# Automation Triggers - Quick Reference

## Available Trigger Functions

### Industry Configuration

```typescript
import { onIndustryConfigured } from '@/lib/automation/integration';

// Trigger when organization selects industry
await onIndustryConfigured(organizationId, 'ndis');
```

**What it does:**

- Updates org onboarding status
- Triggers compliance scoring (if not "other")
- Logs industry configuration event

---

### Framework Provisioning

```typescript
import { onFrameworksProvisioned } from '@/lib/automation/integration';

// Trigger after framework controls are provisioned
const frameworks = ['iso_27001', 'soc2'];
await onFrameworksProvisioned(organizationId, frameworks);
```

**What it does:**

- Creates task: "Complete Framework Controls" (7-day due date)
- Sends notification: "Compliance Frameworks Activated"
- Triggers compliance scoring
- Logs frameworks provisioned

---

### Industry Pack Application

```typescript
import { onIndustryPackApplied } from '@/lib/automation/integration';

// Trigger after industry pack resources are created
await onIndustryPackApplied(organizationId, 'ndis', 'NDIS Compliance Pack');
```

**What it does:**

- Updates compliance score
- Sends notification: "Industry Pack Activated"
- Logs pack application with metadata

---

### Onboarding Milestone

```typescript
import { onOnboardingMilestone } from '@/lib/automation/integration';

// Track progress through onboarding phases
await onOnboardingMilestone(organizationId, 'industry_selected');
```

**What it does:**

- Updates `org_onboarding_status.last_milestone`
- Records timestamp
- Logs milestone reached

---

### Onboarding Completion

```typescript
import { onOnboardingCompleted } from '@/lib/automation/integration';

// Trigger when all onboarding steps complete
await onOnboardingCompleted(organizationId);
```

**What it does:**

- Creates initial onboarding tasks
- Sends welcome notification
- Triggers org_onboarding automation
- Updates compliance score

---

## Trigger Types (for direct use)

```typescript
import { processTrigger } from '@/lib/automation/trigger-engine';

// Direct trigger processing
await processTrigger({
  type: 'industry_configured',
  organizationId: 'org-123',
  metadata: { industry: 'ndis' },
  triggeredAt: new Date(),
});
```

### Available Types

- `org_onboarding` - Initial onboarding started
- `onboarding_milestone` - Milestone reached
- `industry_configured` - Industry selected
- `frameworks_provisioned` - Frameworks provisioned
- `industry_pack_applied` - Industry pack applied
- `evidence_expiry` - Evidence about to expire
- `policy_review_due` - Policy needs review
- `control_failed` - Control failed validation
- `control_incomplete` - Control incomplete
- `risk_score_change` - Risk score changed
- `task_overdue` - Task past due date
- `certification_expiring` - Certification expiring soon

---

## Integration Examples

### Onboarding Flow Integration

```typescript
// app/onboarding/page.tsx
import {
  onIndustryConfigured,
  onFrameworksProvisioned,
  onOnboardingCompleted,
} from '@/lib/automation/integration';

async function saveIndustrySelection(formData: FormData) {
  'use server';
  const industry = formData.get('industry') as string;

  // Save to database
  await supabase.from('organizations').update({ industry }).eq('id', orgId);

  // Apply industry pack
  if (INDUSTRY_PACKS[industry]) {
    await applyIndustryPack(industry);
  }

  // Trigger automation
  await onIndustryConfigured(orgId, industry);

  redirect('/onboarding?step=4');
}

async function saveFrameworkSelection(formData: FormData) {
  'use server';
  const frameworks = formData.getAll('frameworks') as string[];

  // Provision frameworks
  await Promise.all(
    frameworks.map((slug) => provisionFrameworkControls(orgId, slug)),
  );

  // Trigger automation
  await onFrameworksProvisioned(orgId, frameworks);

  redirect('/onboarding?step=6');
}

async function completeOnboarding(formData: FormData) {
  'use server';

  // Mark complete
  await supabase
    .from('organizations')
    .update({ onboarding_completed: true })
    .eq('id', orgId);

  // Trigger automation
  await onOnboardingCompleted(orgId);

  redirect('/app');
}
```

---

### Industry Pack Application Integration

```typescript
// app/app/onboarding/actions.ts
import { onIndustryPackApplied } from '@/lib/automation/integration';

export async function applyIndustryPack(industryId: string) {
  const pack = INDUSTRY_PACKS[industryId];

  // Insert policies, tasks, assets
  await insertPolicies(pack.policies);
  await insertTasks(pack.tasks);
  await insertAssets(pack.assets);

  // Trigger automation
  await onIndustryPackApplied(orgId, industryId, pack.name);

  return { success: true };
}
```

---

### Custom Framework Provisioning Integration

```typescript
// lib/frameworks/provisioning.ts
import { onFrameworksProvisioned } from '@/lib/automation/integration';

export async function provisionMultipleFrameworks(
  orgId: string,
  frameworkSlugs: string[],
) {
  // Provision each framework
  for (const slug of frameworkSlugs) {
    await provisionFrameworkControls(orgId, slug);
  }

  // Trigger automation after all provisioned
  await onFrameworksProvisioned(orgId, frameworkSlugs);
}
```

---

## Testing

```typescript
// tests/automation/onboarding-triggers.test.ts
import { processTrigger } from '@/lib/automation/trigger-engine';
import { onIndustryConfigured } from '@/lib/automation/integration';

describe('Industry Configuration Trigger', () => {
  it('should trigger compliance scoring', async () => {
    const event = {
      type: 'industry_configured',
      organizationId: 'test-org',
      metadata: { industry: 'ndis' },
      triggeredAt: new Date(),
    };

    const result = await processTrigger(event);

    expect(result.workflowsExecuted).toBeGreaterThan(0);
  });
});
```

---

## Automation Results

Each trigger returns an `AutomationResult`:

```typescript
interface AutomationResult {
  tasksCreated: number; // Number of tasks created
  notificationsSent: number; // Number of notifications sent
  workflowsExecuted: number; // Number of workflows/scorings run
  errors: string[]; // Any errors encountered
}
```

**Example:**

```typescript
const result = await onFrameworksProvisioned(orgId, ['iso_27001', 'soc2']);

console.log(result);
// {
//   tasksCreated: 1,
//   notificationsSent: 1,
//   workflowsExecuted: 1,
//   errors: []
// }
```

---

## Error Handling

All automation functions handle errors gracefully and won't throw:

```typescript
// Safe to call - won't throw even if automation fails
await onIndustryConfigured(orgId, industry);

// Automation failures are logged but don't block main flow
await onFrameworksProvisioned(orgId, frameworks);
```

**Error Logging:**

```
[Automation] Error processing industry configuration: <error>
```

---

## Performance Considerations

**Cache-Aware:**

- Compliance scoring caches results (5-min TTL)
- Safe to call frequently
- Won't duplicate tasks or notifications

**Async Execution:**

- All triggers run asynchronously
- Don't block main onboarding flow
- Fire-and-forget pattern

**Idempotent:**

- Safe to call multiple times
- Duplicate detection for tasks
- Notification deduplication

---

## Monitoring

**Structured Logging:**

```typescript
automationLogger.info('industry_configured', {
  orgId: 'org-123',
  industry: 'ndis',
});

automationLogger.info('frameworks_provisioned', {
  orgId: 'org-123',
  frameworks: ['iso_27001', 'soc2'],
  count: 2,
});
```

**Performance Tracking:**

```typescript
// Automatically tracked
trackCustomMetric('automation_trigger_time', duration, {
  trigger_type: 'industry_configured',
  organization_id: orgId,
});
```

---

## Best Practices

1. **Call After Data Persistence**

   ```typescript
   // ✅ Good
   await supabase.from('organizations').update({ industry }).eq('id', orgId);
   await onIndustryConfigured(orgId, industry);

   // ❌ Bad
   await onIndustryConfigured(orgId, industry);
   await supabase.from('organizations').update({ industry }).eq('id', orgId);
   ```

2. **Use Integration Functions (Not Direct processTrigger)**

   ```typescript
   // ✅ Good
   import { onIndustryConfigured } from '@/lib/automation/integration';
   await onIndustryConfigured(orgId, industry);

   // ❌ Avoid (unless you need custom trigger)
   import { processTrigger } from '@/lib/automation/trigger-engine';
   await processTrigger({ type: 'industry_configured', ... });
   ```

3. **Don't Await in Critical Path (if optional)**

   ```typescript
   // ✅ Good (fire-and-forget for optional automation)
   onIndustryConfigured(orgId, industry).catch(console.error);
   redirect('/onboarding?step=4');

   // ⚠️ Acceptable (blocks for important automation)
   await onIndustryConfigured(orgId, industry);
   redirect('/onboarding?step=4');
   ```

4. **Include Metadata**

   ```typescript
   // ✅ Good
   await onIndustryPackApplied(orgId, 'ndis', 'NDIS Compliance Pack');

   // ⚠️ Less useful
   await onIndustryPackApplied(orgId, 'ndis', '');
   ```

---

## Common Scenarios

### Scenario 1: New Organization Onboarding

```typescript
// Step 1: Create organization
await createOrganization({ name, industry: 'other' });

// Step 2: User selects industry
await onIndustryConfigured(orgId, 'ndis');

// Step 3: Industry pack auto-applied
await applyIndustryPack('ndis');
await onIndustryPackApplied(orgId, 'ndis', 'NDIS Pack');

// Step 4: User selects frameworks
await provisionFrameworks(orgId, ['iso_27001']);
await onFrameworksProvisioned(orgId, ['iso_27001']);

// Step 5: Onboarding complete
await onOnboardingCompleted(orgId);
```

### Scenario 2: Existing Organization Adding Frameworks

```typescript
// Admin adds new frameworks later
const newFrameworks = ['soc2', 'hipaa'];
await provisionFrameworks(orgId, newFrameworks);
await onFrameworksProvisioned(orgId, newFrameworks);
```

### Scenario 3: Changing Industry

```typescript
// User changes industry selection
await supabase
  .from('organizations')
  .update({ industry: 'healthcare' })
  .eq('id', orgId);

await onIndustryConfigured(orgId, 'healthcare');

// Optionally apply new industry pack
if (INDUSTRY_PACKS['healthcare']) {
  await applyIndustryPack('healthcare');
  await onIndustryPackApplied(orgId, 'healthcare', 'Healthcare Pack');
}
```

---

## Support

For issues or questions:

1. Check [AUTOMATION_TRIGGERS_SUMMARY.md](AUTOMATION_TRIGGERS_SUMMARY.md) for detailed overview
2. Check [TESTING_AND_PERFORMANCE_GUIDE.md](TESTING_AND_PERFORMANCE_GUIDE.md) for testing
3. Review [lib/automation/trigger-engine.ts](lib/automation/trigger-engine.ts) for implementation
4. Run tests: `npm test tests/automation/onboarding-triggers.test.ts`
