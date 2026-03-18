# FormaOS Automation Engine

Production-ready MVP automation system for compliance workflow management.

## Overview

The FormaOS Automation Engine provides automated task generation, compliance scoring, and intelligent workflow triggers based on organizational compliance activities.

## Components

### 1. Compliance Health Score Engine
**File:** `compliance-score-engine.ts`

Calculates real-time compliance health scores based on:
- Control completion status (40% weight)
- Evidence verification status (30% weight)
- Task completion rates (20% weight)
- Policy approval status (10% weight)

**Key Functions:**
- `calculateComplianceScore(organizationId)` - Calculate current score
- `updateComplianceScore(organizationId)` - Calculate and save to database
- `saveComplianceScore(score)` - Persist score to org_control_evaluations

**Risk Levels:**
- **Low**: Score >= 80, minimal issues
- **Medium**: Score 60-79, some overdue tasks
- **High**: Score 40-59, non-compliant controls present
- **Critical**: Score < 40, multiple critical issues

### 2. Workflow Trigger Engine
**File:** `trigger-engine.ts`

Automated workflow generation for compliance events:

**Trigger Types:**
- `evidence_expiry` - Evidence > 90 days old
- `policy_review_due` - Policy not reviewed in 180 days
- `control_failed` - Control status = non_compliant
- `control_incomplete` - Control status = at_risk
- `org_onboarding` - New organization setup
- `risk_score_change` - Compliance risk level increased
- `task_overdue` - Task past due date
- `certification_expiring` - Certification < 30 days to expiry

**Automations Created:**
- Renewal tasks for expiring evidence
- Review tasks for stale policies
- Remediation tasks for failed controls
- Escalation notifications for overdue tasks
- Onboarding task sequences for new orgs

### 3. Event Processor
**File:** `event-processor.ts`

Real-time event monitoring and automation triggering:

**Events Monitored:**
- `evidence_uploaded` - New evidence added
- `evidence_verified` / `evidence_rejected` - Verification status changes
- `control_status_updated` - Control compliance status changes
- `task_completed` - Task marked complete
- `task_created` - New task added
- `subscription_activated` - Subscription goes live
- `onboarding_completed` - Organization setup finished

**Behaviors:**
- Auto-completes evidence upload tasks
- Generates next recurring task instances
- Updates compliance scores in real-time
- Triggers remediation for rejected evidence

### 4. Scheduled Processor
**File:** `scheduled-processor.ts`

Periodic compliance checks (run via cron):

**Checks Performed:**
- Evidence expiry scanning (90-day threshold)
- Policy review cycle enforcement (180-day threshold)
- Overdue task escalation
- Certification renewal reminders (30-day window)
- Organization-wide compliance score updates

**Execution:**
- `runScheduledAutomation()` - Run all checks
- `runScheduledCheck(type)` - Run specific check type

## Integration

### Server Actions
**File:** `app/app/actions/automation.ts`

User-facing actions for automation access:
- `getComplianceScore()` - Fetch current score
- `recalculateComplianceScore()` - Force score recalculation
- `triggerAutomation(type, metadata)` - Manual trigger execution
- `getAutomationHistory()` - View execution logs
- `getAutomationStats()` - View automation statistics

### Integration Helpers
**File:** `integration.ts`

Helper functions for existing server actions:
```typescript
import { onEvidenceUploaded, onTaskCompleted } from '@/lib/automation';

// In evidence upload action
await onEvidenceUploaded(orgId, evidenceId);

// In task completion action
await onTaskCompleted(orgId, taskId);
```

**Available Helpers:**
- `onEvidenceUploaded(orgId, evidenceId, metadata?)`
- `onEvidenceVerified(orgId, evidenceId, verified, metadata?)`
- `onControlStatusUpdated(orgId, controlId, newStatus, prevStatus?)`
- `onTaskCompleted(orgId, taskId, metadata?)`
- `onTaskCreated(orgId, taskId, metadata?)`
- `onSubscriptionActivated(orgId, subscriptionId)`
- `onOnboardingCompleted(orgId)`

## Database Schema

### New Columns
Migration: `20260206_automation_enhancements.sql`

**org_evidence:**
- `renewal_task_created` - Boolean flag for automation tracking

**org_policies:**
- `review_task_created` - Boolean flag for automation tracking

**org_tasks:**
- `escalation_sent` - Boolean flag for automation tracking

**org_certifications:**
- `renewal_task_created` - Boolean flag for automation tracking

**org_control_evaluations:**
- `details` - JSONB with score breakdown and risk level

### Indexes
Optimized queries for automation checks:
- `idx_evidence_created_verified` - Evidence expiry scanning
- `idx_policies_last_updated` - Policy review checks
- `idx_tasks_overdue` - Overdue task identification
- `idx_workflow_executions_org_date` - Execution history queries

## API Endpoints

### Cron Endpoint
**File:** `app/api/automation/cron/route.ts`

**POST /api/automation/cron**
- Requires: `Authorization: Bearer <CRON_SECRET>`
- Executes all scheduled automation checks
- Returns execution summary

**GET /api/automation/cron**
- Health check endpoint
- No authorization required

### Vercel Cron Setup
Add to `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/automation/cron",
    "schedule": "0 */6 * * *"
  }]
}
```

This runs automation every 6 hours.

**Environment Variable Required:**
```
CRON_SECRET=<random-secure-string>
```

## UI Components

### Compliance Score Card
**File:** `components/automation/ComplianceScoreCard.tsx`

Displays:
- Overall compliance score (0-100)
- Risk level indicator
- Score breakdown by category
- Last update timestamp
- Manual refresh button

Usage:
```tsx
import { ComplianceScoreCard } from '@/components/automation/ComplianceScoreCard';

<ComplianceScoreCard />
```

### Automation Stats
**File:** `components/automation/AutomationStats.tsx`

Displays:
- Active workflow count
- Total executions
- Success rate
- Recent execution history

Usage:
```tsx
import { AutomationStats } from '@/components/automation/AutomationStats';

<AutomationStats />
```

## Setup Instructions

### 1. Run Database Migration
```bash
# Apply automation schema enhancements
supabase migration up 20260206_automation_enhancements
```

### 2. Set Environment Variable
```bash
# Generate secure cron secret
CRON_SECRET=$(openssl rand -hex 32)

# Add to .env.local
echo "CRON_SECRET=$CRON_SECRET" >> .env.local
```

### 3. Configure Vercel Cron (Production)
Add to project settings or `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/automation/cron",
    "schedule": "0 */6 * * *"
  }]
}
```

### 4. Test Automation
```typescript
// In your code
import { recalculateComplianceScore } from '@/app/app/actions/automation';

const score = await recalculateComplianceScore();
console.log('Compliance Score:', score);
```

### 5. Integrate with Existing Actions
```typescript
// In evidence.ts
import { onEvidenceUploaded } from '@/lib/automation';

export async function uploadEvidence(/* params */) {
  // ... existing upload logic

  // Trigger automation
  await onEvidenceUploaded(orgId, evidenceId);
}
```

## Performance Considerations

- **Score Calculation:** Runs 4 parallel queries, typically < 500ms
- **Event Processing:** Non-blocking, failures logged but don't throw
- **Scheduled Checks:** Batch processing with parallel execution
- **Database Impact:** Indexed queries, minimal overhead

## Security

- **RBAC Enforcement:** All actions use `requirePermission()`
- **Organization Isolation:** Queries filtered by org_id
- **RLS Policies:** Database-level security maintained
- **Cron Protection:** Bearer token authentication required
- **Service Role:** Admin client used only for automation

## Monitoring

### Logs
- Event processor logs: `[Event Processor]`
- Trigger engine logs: `[Trigger Engine]`
- Scheduled automation logs: `[Scheduled Automation]`
- Cron endpoint logs: `[Cron]`

### Database Tables
- `org_workflow_executions` - All automation runs
- `org_control_evaluations` - Score history
- `org_audit_events` - Full audit trail

## Troubleshooting

**Automation not running:**
- Check `CRON_SECRET` environment variable
- Verify Vercel cron configuration
- Test `/api/automation/cron` GET endpoint

**Score not updating:**
- Call `recalculateComplianceScore()` manually
- Check `org_control_evaluations` table
- Verify organization has completed onboarding

**Events not triggering:**
- Integration helpers must be called from server actions
- Check server logs for errors
- Verify organization has active workflows

**Database errors:**
- Run migration: `20260206_automation_enhancements.sql`
- Check RLS policies on new columns
- Verify indexes exist

## Extending the System

### Add New Trigger Type
1. Add type to `TriggerType` in `trigger-engine.ts`
2. Implement handler function
3. Add case to `processTrigger()` switch

### Add New Event Type
1. Add type to `EventType` in `event-processor.ts`
2. Implement handler function
3. Add case to `processEvent()` switch
4. Call from server action using integration helpers

### Add New Scheduled Check
1. Implement check function in `scheduled-processor.ts`
2. Add to `runScheduledAutomation()` Promise.all
3. Add case to `runScheduledCheck()` switch

## Future Enhancements

- **AI-powered risk prediction:** Machine learning for risk forecasting
- **Custom workflow builder:** User-defined automation rules
- **Slack/Teams integration:** External notifications
- **Advanced scheduling:** Per-organization check schedules
- **Workflow templates:** Industry-specific automation packs
- **Real-time webhooks:** Push notifications for events
- **Analytics dashboard:** Detailed automation insights
- **A/B testing:** Workflow optimization experiments

## Support

For issues or questions:
1. Check logs for error messages
2. Verify database migration applied
3. Test API endpoints directly
4. Review recent workflow executions in database
