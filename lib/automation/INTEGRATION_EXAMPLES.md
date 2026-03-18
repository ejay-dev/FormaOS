# Automation Integration Examples

Examples of how to integrate the automation engine with existing FormaOS server actions.

## Evidence Actions Integration

### File: `app/app/actions/evidence.ts`

```typescript
import { onEvidenceUploaded, onEvidenceVerified } from '@/lib/automation';

// In uploadEvidence function
export async function uploadEvidence(/* existing params */) {
  // ... existing upload logic ...

  const evidenceId = insertedEvidence.id;

  // Trigger automation AFTER successful upload
  // This will auto-complete linked tasks and update compliance score
  await onEvidenceUploaded(orgId, evidenceId, {
    fileName: file.name,
    uploadedBy: userId,
  });

  // ... rest of function ...
}

// In verifyEvidence function
export async function verifyEvidence(
  evidenceId: string,
  verified: boolean,
  reason?: string
) {
  // ... existing verification logic ...

  // Trigger automation AFTER verification
  // This will update control status and may trigger remediation if rejected
  await onEvidenceVerified(orgId, evidenceId, verified, {
    verifiedBy: userId,
    reason,
  });

  // ... rest of function ...
}
```

## Task Actions Integration

### File: `app/app/actions/tasks.ts`

```typescript
import { onTaskCreated, onTaskCompleted } from '@/lib/automation';

// In createTask function
export async function createTask(taskData: CreateTaskInput) {
  // ... existing task creation logic ...

  const taskId = createdTask.id;

  // Trigger automation AFTER task creation
  // This updates compliance score
  await onTaskCreated(orgId, taskId, {
    title: taskData.title,
    priority: taskData.priority,
  });

  // ... rest of function ...
}

// In completeTask function
export async function completeTask(taskId: string) {
  // ... existing completion logic ...

  // Trigger automation AFTER task completion
  // This will:
  // - Generate next recurring task if applicable
  // - Update compliance score
  // - Mark policy as reviewed if task was a review task
  await onTaskCompleted(orgId, taskId, {
    completedBy: userId,
    completedAt: new Date().toISOString(),
  });

  // ... rest of function ...
}
```

## Control Evaluation Integration

### File: `app/app/actions/control-evaluations.ts`

```typescript
import { onControlStatusUpdated } from '@/lib/automation';

// In evaluateControl or updateControlStatus function
export async function updateControlStatus(
  controlId: string,
  newStatus: 'compliant' | 'at_risk' | 'non_compliant'
) {
  // Get previous status
  const { data: previousEval } = await supabase
    .from('org_control_evaluations')
    .select('status')
    .eq('id', controlId)
    .single();

  // ... existing update logic ...

  // Trigger automation if status changed
  if (previousEval?.status !== newStatus) {
    await onControlStatusUpdated(
      orgId,
      controlId,
      newStatus,
      previousEval?.status
    );
  }

  // ... rest of function ...
}
```

## Billing Actions Integration

### File: `app/app/actions/billing.ts`

```typescript
import { onSubscriptionActivated } from '@/lib/automation';

// In subscription webhook handler
export async function handleSubscriptionActivated(
  subscriptionId: string,
  orgId: string
) {
  // ... existing subscription activation logic ...

  // Trigger automation AFTER subscription is active
  // This may trigger welcome workflows or feature onboarding
  await onSubscriptionActivated(orgId, subscriptionId);

  // ... rest of function ...
}
```

## Onboarding Actions Integration

### File: `app/app/actions/onboarding.ts`

```typescript
import { onOnboardingCompleted } from '@/lib/automation';

// In completeOnboarding function
export async function completeOnboarding() {
  // ... existing onboarding completion logic ...

  // Trigger automation AFTER onboarding is complete
  // This will:
  // - Create initial task sequence
  // - Send welcome notification
  // - Set up initial compliance workflows
  await onOnboardingCompleted(orgId);

  // ... rest of function ...
}
```

## Manual Compliance Score Update

### Any action that significantly impacts compliance

```typescript
import { updateComplianceScoreAndCheckRisk } from '@/lib/automation';

// In any action that impacts compliance state
export async function significantComplianceAction() {
  // ... existing logic ...

  // Update compliance score in background
  // This is safe to call frequently - it's non-blocking
  await updateComplianceScoreAndCheckRisk(orgId);

  // ... rest of function ...
}
```

## Dashboard Integration

### Displaying Compliance Score

```typescript
// In dashboard page component
import { ComplianceScoreCard } from '@/components/automation/ComplianceScoreCard';
import { AutomationStats } from '@/components/automation/AutomationStats';

export default function DashboardPage() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <ComplianceScoreCard />
      <AutomationStats />
      {/* ... other dashboard components ... */}
    </div>
  );
}
```

### Fetching Score in Server Component

```typescript
// In server component
import { getComplianceScore } from '@/app/app/actions/automation';

export default async function CompliancePage() {
  const score = await getComplianceScore();

  return (
    <div>
      <h1>Compliance Score: {score.overallScore}</h1>
      <p>Risk Level: {score.riskLevel}</p>

      <div>
        <h2>Breakdown:</h2>
        <ul>
          <li>Controls: {score.controlsScore}</li>
          <li>Evidence: {score.evidenceScore}</li>
          <li>Tasks: {score.tasksScore}</li>
          <li>Policies: {score.policiesScore}</li>
        </ul>
      </div>
    </div>
  );
}
```

## Admin Actions Integration

### Manual Trigger Execution

```typescript
// Admin dashboard or settings page
import { triggerAutomation, runScheduledChecks } from '@/app/app/actions/automation';

// Manually trigger specific automation
async function handleManualTrigger() {
  const result = await triggerAutomation('policy_review_due', {
    policyId: selectedPolicyId,
  });

  console.log('Created tasks:', result.tasksCreated);
  console.log('Sent notifications:', result.notificationsSent);
}

// Run all scheduled checks manually
async function handleRunScheduledChecks() {
  const result = await runScheduledChecks();

  console.log('Checks run:', result.checksRun);
  console.log('Triggers executed:', result.triggersExecuted);
  console.log('Errors:', result.errors);
}
```

## Best Practices

### 1. Always Call After Success
```typescript
// Good
const result = await createTask(data);
await onTaskCreated(orgId, result.id);

// Bad - may trigger before task is committed
await onTaskCreated(orgId, taskId);
const result = await createTask(data);
```

### 2. Don't Block on Automation
```typescript
// Good - automation failures don't break main flow
try {
  await onEvidenceUploaded(orgId, evidenceId);
} catch (error) {
  // Log but don't throw
  console.error('Automation failed:', error);
}

// Better - helpers already handle errors
await onEvidenceUploaded(orgId, evidenceId);
```

### 3. Pass Relevant Metadata
```typescript
// Good - provides context for logging and debugging
await onTaskCompleted(orgId, taskId, {
  completedBy: userId,
  completedAt: timestamp,
  linkedPolicyId: task.linkedPolicyId,
});

// Acceptable - minimal but functional
await onTaskCompleted(orgId, taskId);
```

### 4. Use Specific Helpers
```typescript
// Good - uses specific helper
await onEvidenceVerified(orgId, evidenceId, true);

// Bad - generic event less clear
await triggerDatabaseEvent('evidence_verified', evidenceId, 'evidence');
```

### 5. Batch Updates When Possible
```typescript
// Good - batch score updates
const orgIds = affectedOrganizations.map(o => o.id);
await batchUpdateComplianceScores(orgIds);

// Less efficient
for (const org of affectedOrganizations) {
  await updateComplianceScoreAndCheckRisk(org.id);
}
```

## Testing Automation

### Unit Test Example
```typescript
import { calculateComplianceScore } from '@/lib/automation';

describe('Compliance Score Calculation', () => {
  it('calculates score correctly', async () => {
    const score = await calculateComplianceScore('test-org-id');

    expect(score.overallScore).toBeGreaterThanOrEqual(0);
    expect(score.overallScore).toBeLessThanOrEqual(100);
    expect(score.riskLevel).toMatch(/low|medium|high|critical/);
  });
});
```

### Integration Test Example
```typescript
import { onTaskCompleted } from '@/lib/automation';

describe('Task Completion Automation', () => {
  it('generates next recurring task', async () => {
    // Create recurring task
    const task = await createTask({
      title: 'Test Task',
      isRecurring: true,
      recurrenceDays: 7,
    });

    // Complete it
    await completeTask(task.id);

    // Trigger automation
    await onTaskCompleted(orgId, task.id);

    // Verify next task was created
    const nextTasks = await getTasks({
      status: 'pending',
      title: 'Test Task'
    });

    expect(nextTasks.length).toBe(1);
  });
});
```

## Monitoring Integration

### Application Insights
```typescript
import { ApplicationInsights } from '@microsoft/applicationinsights-web';

// Track automation execution
const appInsights = new ApplicationInsights({ /* config */ });

appInsights.trackEvent({
  name: 'AutomationTriggered',
  properties: {
    triggerType: 'evidence_expiry',
    organizationId: orgId,
    tasksCreated: result.tasksCreated,
  }
});
```

### Custom Logging
```typescript
import { logger } from '@/lib/logger';

// Log automation events
logger.info('Automation triggered', {
  trigger: 'task_overdue',
  organization: orgId,
  task: taskId,
  result: result,
});
```

## Error Handling

### Graceful Degradation
```typescript
// Automation failures should not break main functionality
export async function uploadEvidence(data: EvidenceInput) {
  try {
    // Critical: evidence upload
    const evidence = await insertEvidence(data);

    try {
      // Non-critical: automation trigger
      await onEvidenceUploaded(orgId, evidence.id);
    } catch (automationError) {
      // Log but don't fail the upload
      console.error('Automation failed:', automationError);

      // Optional: track in monitoring
      await trackAutomationFailure({
        action: 'evidence_upload',
        error: automationError,
      });
    }

    return evidence;
  } catch (error) {
    // Critical error - rethrow
    throw error;
  }
}
```

## Performance Optimization

### Batch Processing
```typescript
// Process multiple events efficiently
async function processMultipleEvidenceUploads(
  evidenceItems: Array<{ orgId: string; id: string }>
) {
  // Trigger in parallel
  await Promise.all(
    evidenceItems.map(item =>
      onEvidenceUploaded(item.orgId, item.id)
    )
  );
}
```

### Debounced Score Updates
```typescript
// Avoid excessive score recalculations
import debounce from 'lodash/debounce';

const debouncedScoreUpdate = debounce(
  (orgId: string) => updateComplianceScoreAndCheckRisk(orgId),
  5000 // 5 second delay
);

// Use in high-frequency actions
async function updateControl(controlId: string) {
  await updateControlInDb(controlId);
  debouncedScoreUpdate(orgId); // Batches rapid updates
}
```
