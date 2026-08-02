/**
 * Demo Data Seed API Endpoint
 * Seeds demo data for guided demo mode
 *
 * PROTECTED: Requires founder access
 */

/* eslint-disable formaos/no-admin-client-with-org-filter --
 * Founder-gated demo-data seeder: writes across multiple seed-orgs
 * for the demo flow. Founder access is enforced via
 * requireFounderAccess; the admin client is intentional. Per
 * ENGINEERING_CHANGE_MATRIX "Tenant Data Access" guidance for
 * cross-tenant scans.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { brand } from '@/config/brand';
import { requireFounderAccess } from '@/app/app/admin/access';
import { routeLog } from '@/lib/monitoring/server-logger';

const log = routeLog('/api/demo/seed');

export async function POST(request: NextRequest) {
  // 🔐 v4-030: founder-only AND env-gated. A founder running this
  // against a real prod org silently inflates compliance scores
  // 75-90. DEMO_SEED_ENABLED=true must be set explicitly on the
  // environment (sandbox / sales / dev) so prod stays inert even
  // if the founder account is compromised.
  if (process.env.DEMO_SEED_ENABLED !== 'true') {
    return NextResponse.json(
      {
        error: 'demo_seed_disabled',
        message:
          'Demo seeding is disabled on this environment. Set DEMO_SEED_ENABLED=true to enable.',
      },
      { status: 403 },
    );
  }

  try {
    await requireFounderAccess();
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unauthorized';
    const status = message === 'Forbidden' ? 403 : 401;
    return NextResponse.json({ error: message }, { status });
  }

  try {
    // Parse request body
    const body = await request.json();
    const { organizationId, eventsCount = 15 } = body;

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 },
      );
    }

    const supabase = createSupabaseAdminClient();

    // Verify organization exists
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id, name')
      .eq('id', organizationId)
      .maybeSingle();

    if (orgError || !org) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 },
      );
    }

    // Get or create demo workflow
    let workflowId: string;
    const { data: existingWorkflow } = await supabase
      .from('org_workflows')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('name', 'Demo Automation Workflow')
      .maybeSingle();

    if (existingWorkflow) {
      workflowId = existingWorkflow.id;
    } else {
      const { data: newWorkflow, error: workflowError } = await supabase
        .from('org_workflows')
        .insert({
          organization_id: organizationId,
          name: 'Demo Automation Workflow',
          trigger_type: 'scheduled',
          is_active: true,
          actions: {
            notifications: [brand.email.contactEmail],
            create_tasks: true,
            update_scores: true,
          },
        })
        .select()
        .single();

      if (workflowError || !newWorkflow) {
        throw new Error('Failed to create demo workflow');
      }

      workflowId = newWorkflow.id;
    }

    // Generate demo workflow executions
    const triggerTypes = [
      'evidence_expiry',
      'policy_review_due',
      'control_failed',
      'control_incomplete',
      'task_overdue',
      'risk_score_change',
      'certification_expiring',
    ];

    const executions = [];
    const now = new Date();

    for (let i = 0; i < eventsCount; i++) {
      const hoursAgo = Math.floor((i / eventsCount) * 48); // Last 48 hours
      const executedAt = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);

      const trigger = triggerTypes[i % triggerTypes.length];
      const actionsExecuted = Math.floor(Math.random() * 4) + 1;
      const status = Math.random() < 0.9 ? 'success' : 'failed';

      executions.push({
        organization_id: organizationId,
        workflow_id: workflowId,
        trigger,
        status,
        actions_executed: actionsExecuted,
        executed_at: executedAt.toISOString(),
        error_message: status === 'failed' ? 'Demo failure scenario' : null,
      });
    }

    const { error: execError } = await supabase
      .from('org_workflow_executions')
      .insert(executions);

    if (execError) {
      throw execError;
    }

    // Update compliance score
    const score = 75 + Math.floor(Math.random() * 15); // 75-90 range
    const riskLevel = score >= 85 ? 'low' : score >= 70 ? 'medium' : 'high';

    const { error: scoreError } = await supabase
      .from('org_control_evaluations')
      .upsert(
        {
          organization_id: organizationId,
          compliance_score: score,
          last_evaluated_at: now.toISOString(),
          details: {
            riskLevel,
            controlsScore: score + 5,
            evidenceScore: score - 2,
            tasksScore: score + 3,
            policiesScore: score + 1,
          },
        },
        {
          onConflict: 'organization_id',
        },
      );

    if (scoreError) {
      log.error({ err: scoreError }, "Failed to update compliance score:");
    }

    return NextResponse.json({
      success: true,
      message: 'Demo data seeded successfully',
      stats: {
        organization: org.name,
        workflowExecutions: executions.length,
        complianceScore: score,
        riskLevel,
      },
    });
  } catch (error) {
    log.error({ err: error }, "Demo seed error:");
    return NextResponse.json(
      {
        error: 'Failed to seed demo data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Demo seed endpoint',
    usage: 'POST with organizationId in body',
  });
}
