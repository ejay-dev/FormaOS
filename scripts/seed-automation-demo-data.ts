/**
 * Demo Data Seeder for Automation Engine
 * Generates realistic automation events, alerts, and scoring changes
 * For demos, screenshots, and sales presentations
 */

import { createSupabaseAdminClient } from '../lib/supabase/admin';

interface DemoConfig {
  organizationId: string;
  eventsCount?: number;
  includeFailures?: boolean;
  timeSpanHours?: number;
}

async function seedAutomationDemoData(config: DemoConfig) {
  console.log('🌱 Seeding automation demo data...\n');

  const {
    organizationId,
    eventsCount = 20,
    includeFailures = true,
    timeSpanHours = 72,
  } = config;

  const supabase = createSupabaseAdminClient();
  const results = {
    workflowExecutions: 0,
    evaluations: 0,
    tasks: 0,
    errors: 0,
  };

  try {
    // Verify organization exists
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id, name')
      .eq('id', organizationId)
      .single();

    if (orgError || !org) {
      throw new Error(`Organization ${organizationId} not found`);
    }

    console.log(`📦 Seeding data for organization: ${org.name}\n`);

    // Get existing workflow
    const { data: workflow } = await supabase
      .from('org_workflows')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .limit(1)
      .single();

    if (!workflow) {
      console.log('⚠️  No active workflows found. Creating default workflow...');
      const { data: newWorkflow, error: workflowError } = await supabase
        .from('org_workflows')
        .insert({
          organization_id: organizationId,
          name: 'Compliance Automation Workflow',
          trigger_type: 'scheduled',
          is_active: true,
          actions: {
            notifications: ['compliance@example.com'],
            create_tasks: true,
            update_scores: true,
          },
        })
        .select()
        .single();

      if (workflowError) throw workflowError;
      console.log('✅ Created workflow\n');
    }

    const workflowId = workflow?.id || '';

    // Generate workflow executions
    console.log(`🔄 Generating ${eventsCount} workflow executions...`);

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
      const hoursAgo = Math.floor((i / eventsCount) * timeSpanHours);
      const executedAt = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);

      const trigger = triggerTypes[Math.floor(Math.random() * triggerTypes.length)];
      const actionsExecuted = Math.floor(Math.random() * 5) + 1;

      // Determine status (mostly success, some failures if enabled)
      let status = 'success';
      let errorMessage = null;

      if (includeFailures && Math.random() < 0.15) {
        // 15% failure rate
        status = 'failed';
        errorMessage = getRandomErrorMessage();
      }

      executions.push({
        organization_id: organizationId,
        workflow_id: workflowId,
        trigger,
        status,
        actions_executed: actionsExecuted,
        executed_at: executedAt.toISOString(),
        error_message: errorMessage,
      });
    }

    const { error: execError } = await supabase
      .from('org_workflow_executions')
      .insert(executions);

    if (execError) throw execError;

    results.workflowExecutions = executions.length;
    console.log(`✅ Created ${executions.length} workflow executions\n`);

    // Generate compliance score evaluations (show score progression)
    console.log('📊 Generating compliance score history...');

    const scoreEvaluations = [];
    const baseScore = 65; // Starting score

    for (let i = 0; i < 10; i++) {
      const daysAgo = i * (timeSpanHours / 24 / 10);
      const evaluatedAt = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

      // Score gradually improves over time
      const scoreVariation = Math.floor(Math.random() * 10) - 3; // -3 to +7
      const score = Math.min(95, Math.max(40, baseScore + i * 2 + scoreVariation));

      const riskLevel =
        score >= 80 ? 'low' : score >= 60 ? 'medium' : score >= 40 ? 'high' : 'critical';

      scoreEvaluations.push({
        organization_id: organizationId,
        compliance_score: score,
        last_evaluated_at: evaluatedAt.toISOString(),
        details: {
          riskLevel,
          controlsScore: Math.min(100, score + Math.floor(Math.random() * 10)),
          evidenceScore: Math.min(100, score + Math.floor(Math.random() * 5)),
          tasksScore: Math.min(100, score - Math.floor(Math.random() * 5)),
          policiesScore: Math.min(100, score + Math.floor(Math.random() * 8)),
        },
      });
    }

    // Insert score evaluations one by one (since org can only have one)
    const latestScore = scoreEvaluations[0]; // Most recent
    const { error: scoreError } = await supabase
      .from('org_control_evaluations')
      .upsert(
        {
          organization_id: organizationId,
          compliance_score: latestScore.compliance_score,
          last_evaluated_at: latestScore.last_evaluated_at,
          details: latestScore.details,
        },
        {
          onConflict: 'organization_id',
        }
      );

    if (scoreError) throw scoreError;

    results.evaluations = 1;
    console.log(
      `✅ Updated compliance score: ${latestScore.compliance_score} (${latestScore.details.riskLevel} risk)\n`
    );

    // Generate demo tasks from automation
    console.log('📝 Generating demo automation tasks...');

    const demoTasks = [
      {
        title: 'Renew Expired Evidence: Privacy Policy Documentation',
        description:
          'Evidence has expired (90+ days old). Please upload updated documentation.',
        priority: 'high',
        due_date: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending',
        automated: true,
      },
      {
        title: 'Review Policy: Information Security Policy',
        description: 'Policy has not been reviewed in 180+ days. Please review and update.',
        priority: 'medium',
        due_date: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending',
        automated: true,
      },
      {
        title: 'Remediate Failed Control: Access Control Review',
        description:
          'Control status changed to non-compliant. Immediate remediation required.',
        priority: 'critical',
        due_date: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending',
        automated: true,
      },
      {
        title: 'Complete At-Risk Control: Incident Response Testing',
        description: 'Control is at risk. Please complete required actions.',
        priority: 'high',
        due_date: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending',
        automated: true,
      },
    ];

    const tasksToInsert = demoTasks.map((task) => ({
      organization_id: organizationId,
      title: task.title,
      description: task.description,
      priority: task.priority,
      due_date: task.due_date,
      status: task.status,
      created_at: now.toISOString(),
    }));

    const { error: tasksError } = await supabase
      .from('org_tasks')
      .insert(tasksToInsert);

    if (tasksError) {
      // Tasks might fail if table structure is different
      console.warn('⚠️  Could not create demo tasks:', tasksError.message);
    } else {
      results.tasks = tasksToInsert.length;
      console.log(`✅ Created ${tasksToInsert.length} demo automation tasks\n`);
    }

    // Summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Demo Data Seeding Complete!\n');
    console.log('📊 Summary:');
    console.log(`   • Workflow Executions: ${results.workflowExecutions}`);
    console.log(`   • Compliance Evaluations: ${results.evaluations}`);
    console.log(`   • Automation Tasks: ${results.tasks}`);
    console.log(`   • Errors: ${results.errors}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('💡 Next Steps:');
    console.log('   1. View automation timeline in dashboard');
    console.log('   2. Check compliance score widget');
    console.log('   3. Review notifications panel');
    console.log('   4. Take screenshots for demos/sales\n');
  } catch (error) {
    console.error('❌ Error seeding demo data:', error);
    results.errors++;
    throw error;
  }

  return results;
}

function getRandomErrorMessage(): string {
  const errors = [
    'Failed to send notification: Email service unavailable',
    'Task creation failed: Database timeout',
    'Notification delivery failed: Invalid recipient',
    'Score update failed: Calculation error',
    'Workflow execution timeout',
  ];

  return errors[Math.floor(Math.random() * errors.length)];
}

// CLI Usage
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage: npx tsx scripts/seed-automation-demo-data.ts <organization-id> [options]\n');
    console.log('Options:');
    console.log('  --events <number>        Number of events to generate (default: 20)');
    console.log('  --no-failures            Do not include failed executions');
    console.log('  --timespan <hours>       Time span for events in hours (default: 72)');
    console.log('\nExample:');
    console.log('  npx tsx scripts/seed-automation-demo-data.ts abc-123 --events 30 --timespan 168\n');
    process.exit(1);
  }

  const organizationId = args[0];
  const eventsCount = parseInt(args[args.indexOf('--events') + 1] || '20');
  const includeFailures = !args.includes('--no-failures');
  const timeSpanHours = parseInt(args[args.indexOf('--timespan') + 1] || '72');

  await seedAutomationDemoData({
    organizationId,
    eventsCount,
    includeFailures,
    timeSpanHours,
  });
}

// Run if called directly
if (require.main === module) {
  main()
    .then(() => {
      console.log('✨ Script completed successfully\n');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Script failed:', error);
      process.exit(1);
    });
}

export { seedAutomationDemoData };
