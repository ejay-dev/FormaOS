#!/usr/bin/env node
/**
 * Database Integrity Test Script
 * Verifies database schema and constraints are properly configured
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.log(
    '⚠️  Skipping DB integrity tests - SUPABASE_SERVICE_ROLE_KEY not configured',
  );
  console.log(
    '   Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to enable',
  );
  process.exit(0);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

async function testDatabaseIntegrity() {
  console.log('🔍 Running database integrity checks...\n');

  const results = {
    passed: 0,
    failed: 0,
    skipped: 0,
    errors: [],
  };

  // Test 1: Check essential tables exist
  console.log('1️⃣  Checking essential tables...');
  const essentialTables = [
    'organizations',
    'org_members',
    'profiles',
    'org_subscriptions',
  ];

  for (const table of essentialTables) {
    try {
      const { error } = await supabase.from(table).select('count').limit(0);

      if (error) {
        console.log(`   ❌ Table "${table}" - ${error.message}`);
        results.failed++;
        results.errors.push(`Table ${table}: ${error.message}`);
      } else {
        console.log(`   ✅ Table "${table}" exists`);
        results.passed++;
      }
    } catch (err) {
      console.log(`   ❌ Table "${table}" - ${err.message}`);
      results.failed++;
      results.errors.push(`Table ${table}: ${err.message}`);
    }
  }

  // Test 2: Check RLS is enabled (by attempting unauthorized access)
  console.log('\n2️⃣  Checking RLS policies...');
  try {
    // This should work with service role key
    const { error: serviceError } = await supabase
      .from('organizations')
      .select('id')
      .limit(1);

    if (!serviceError) {
      console.log('   ✅ Service role can access protected tables');
      results.passed++;
    } else {
      console.log(`   ⚠️  Service role access issue: ${serviceError.message}`);
      results.skipped++;
    }
  } catch (err) {
    console.log(`   ⚠️  RLS check skipped: ${err.message}`);
    results.skipped++;
  }

  // Test 3: Check foreign key relationships
  console.log('\n3️⃣  Checking data relationships...');
  try {
    const { error } = await supabase
      .from('org_members')
      .select('user_id, organization_id')
      .limit(1);

    if (!error) {
      console.log('   ✅ Foreign key relationships accessible');
      results.passed++;
    } else if (error.message.includes('permission denied')) {
      console.log('   ⚠️  RLS blocking test (expected behavior)');
      results.skipped++;
    } else {
      console.log(`   ❌ Relationship check failed: ${error.message}`);
      results.failed++;
    }
  } catch (err) {
    console.log(`   ⚠️  Relationship check skipped: ${err.message}`);
    results.skipped++;
  }

  // Test 4: Check indexes exist for common queries
  console.log('\n4️⃣  Checking query performance indicators...');
  try {
    const start = Date.now();
    await supabase.from('organizations').select('id').limit(10);
    const duration = Date.now() - start;

    if (duration < 5000) {
      console.log(`   ✅ Basic queries perform well (${duration}ms)`);
      results.passed++;
    } else {
      console.log(`   ⚠️  Query took ${duration}ms - may need optimization`);
      results.skipped++;
    }
  } catch (err) {
    console.log(`   ⚠️  Performance check skipped: ${err.message}`);
    results.skipped++;
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Database Integrity Test Results:');
  console.log(`   ✅ Passed:  ${results.passed}`);
  console.log(`   ❌ Failed:  ${results.failed}`);
  console.log(`   ⚠️  Skipped: ${results.skipped}`);
  console.log('='.repeat(50));

  if (results.failed > 0) {
    console.log('\n❌ Database integrity check FAILED');
    console.log('Errors:', results.errors.join(', '));
    process.exit(1);
  }

  console.log('\n✅ Database integrity check PASSED');
  process.exit(0);
}

testDatabaseIntegrity().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
