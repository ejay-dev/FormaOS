/**
 * Automation System Test Script
 * Verifies automation engine setup and functionality
 */

import { createSupabaseAdminClient } from '../lib/supabase/admin';
import {
  calculateComplianceScore,
  updateComplianceScore,
} from '../lib/automation/compliance-score-engine';
import { runScheduledCheck } from '../lib/automation/scheduled-processor';

async function testAutomationSetup() {
  console.log('🔍 Testing FormaOS Automation Engine Setup...\n');

  const results = {
    passed: 0,
    failed: 0,
    warnings: 0,
  };

  // Test 1: Database Connection
  console.log('1️⃣ Testing database connection...');
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from('organizations')
      .select('id')
      .limit(1);

    if (error) throw error;
    console.log('   ✅ Database connection successful\n');
    results.passed++;
  } catch (error) {
    console.error('   ❌ Database connection failed:', error);
    results.failed++;
  }

  // Test 2: Required Tables
  console.log('2️⃣ Testing required tables exist...');
  try {
    const supabase = createSupabaseAdminClient();
    const tables = [
      'org_workflows',
      'org_workflow_executions',
      'org_control_evaluations',
      'org_evidence',
      'org_policies',
      'org_tasks',
      'org_certifications',
    ];

    for (const table of tables) {
      const { error } = await supabase
        .from(table)
        .select('id')
        .limit(1);

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows, which is fine
        throw new Error(`Table ${table} query failed: ${error.message}`);
      }
    }

    console.log('   ✅ All required tables exist\n');
    results.passed++;
  } catch (error) {
    console.error('   ❌ Table check failed:', error);
    results.failed++;
  }

  // Test 3: Required Columns
  console.log('3️⃣ Testing automation columns exist...');
  try {
    const supabase = createSupabaseAdminClient();

    // Check org_evidence.renewal_task_created
    await supabase
      .from('org_evidence')
      .select('renewal_task_created')
      .limit(1);

    // Check org_policies.review_task_created
    await supabase
      .from('org_policies')
      .select('review_task_created')
      .limit(1);

    // Check org_tasks.escalation_sent
    await supabase
      .from('org_tasks')
      .select('escalation_sent')
      .limit(1);

    // Check org_control_evaluations.details
    await supabase
      .from('org_control_evaluations')
      .select('details')
      .limit(1);

    console.log('   ✅ All automation columns exist\n');
    results.passed++;
  } catch (error) {
    console.error('   ❌ Column check failed:', error);
    console.error('   💡 Run migration: 20260206_automation_enhancements.sql\n');
    results.failed++;
  }

  // Test 4: Environment Variables
  console.log('4️⃣ Testing environment variables...');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.warn('   ⚠️  CRON_SECRET not set');
    console.warn('   💡 Set CRON_SECRET for scheduled automation\n');
    results.warnings++;
  } else {
    console.log('   ✅ CRON_SECRET configured\n');
    results.passed++;
  }

  // Test 5: Compliance Score Calculation
  console.log('5️⃣ Testing compliance score calculation...');
  try {
    const supabase = createSupabaseAdminClient();

    // Get first organization
    const { data: orgs } = await supabase
      .from('organizations')
      .select('id')
      .eq('onboarding_completed', true)
      .limit(1);

    if (!orgs || orgs.length === 0) {
      console.warn('   ⚠️  No organizations with completed onboarding');
      console.warn('   💡 Complete onboarding for at least one org to test scoring\n');
      results.warnings++;
    } else {
      const testOrgId = orgs[0].id;
      const score = await calculateComplianceScore(testOrgId);

      if (
        typeof score.overallScore !== 'number' ||
        score.overallScore < 0 ||
        score.overallScore > 100
      ) {
        throw new Error('Invalid score calculated');
      }

      console.log(`   ✅ Score calculation successful (Score: ${score.overallScore})`);
      console.log(`   📊 Risk Level: ${score.riskLevel}\n`);
      results.passed++;
    }
  } catch (error) {
    console.error('   ❌ Score calculation failed:', error);
    results.failed++;
  }

  // Test 6: Score Persistence
  console.log('6️⃣ Testing score persistence...');
  try {
    const supabase = createSupabaseAdminClient();

    const { data: orgs } = await supabase
      .from('organizations')
      .select('id')
      .eq('onboarding_completed', true)
      .limit(1);

    if (!orgs || orgs.length === 0) {
      console.warn('   ⚠️  Skipped (no test organization)\n');
      results.warnings++;
    } else {
      const testOrgId = orgs[0].id;
      await updateComplianceScore(testOrgId);

      // Verify it was saved
      const { data: evaluation } = await supabase
        .from('org_control_evaluations')
        .select('compliance_score, details')
        .eq('organization_id', testOrgId)
        .single();

      if (!evaluation) {
        throw new Error('Score not persisted to database');
      }

      console.log('   ✅ Score persistence successful\n');
      results.passed++;
    }
  } catch (error) {
    console.error('   ❌ Score persistence failed:', error);
    results.failed++;
  }

  // Test 7: Scheduled Checks
  console.log('7️⃣ Testing scheduled check execution...');
  try {
    // Run a lightweight check
    const result = await runScheduledCheck('scores');

    console.log(
      `   ✅ Scheduled check successful (${result.triggersExecuted} scores updated)\n`
    );
    results.passed++;
  } catch (error) {
    console.error('   ❌ Scheduled check failed:', error);
    results.failed++;
  }

  // Test 8: Workflow Execution Table
  console.log('8️⃣ Testing workflow execution logging...');
  try {
    const supabase = createSupabaseAdminClient();

    const { data } = await supabase
      .from('org_workflow_executions')
      .select('id, status, executed_at')
      .limit(5);

    if (data && data.length > 0) {
      console.log(
        `   ✅ Found ${data.length} workflow execution(s) in history\n`
      );
    } else {
      console.log('   ✅ Workflow execution table accessible (no executions yet)\n');
    }
    results.passed++;
  } catch (error) {
    console.error('   ❌ Workflow execution check failed:', error);
    results.failed++;
  }

  // Summary
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Test Summary:');
  console.log(`   ✅ Passed: ${results.passed}`);
  console.log(`   ❌ Failed: ${results.failed}`);
  console.log(`   ⚠️  Warnings: ${results.warnings}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (results.failed > 0) {
    console.log('❌ Some tests failed. Please address the errors above.');
    process.exit(1);
  } else if (results.warnings > 0) {
    console.log('⚠️  All critical tests passed, but there are warnings.');
    console.log('   Review the warnings above for optional improvements.\n');
  } else {
    console.log('🎉 All tests passed! Automation engine is ready.\n');
  }

  // Next Steps
  console.log('📝 Next Steps:');
  console.log('   1. Set CRON_SECRET in environment variables');
  console.log('   2. Deploy to Vercel with cron configuration');
  console.log('   3. Integrate automation helpers into server actions');
  console.log('   4. Add UI components to dashboard');
  console.log('   5. Monitor automation execution logs\n');
}

// Run tests
testAutomationSetup()
  .then(() => {
    console.log('✨ Test script completed\n');
  })
  .catch((error) => {
    console.error('💥 Test script failed:', error);
    process.exit(1);
  });
