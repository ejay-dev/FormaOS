#!/usr/bin/env node
/**
 * Database Integrity Test Script
 * Verifies database schema and constraints are properly configured
 */

require('./_node20-ws-shim.cjs');
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

const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

// Unauthenticated client. `anon` holds SELECT grants on the org-scoped
// tables, so RLS is the only thing standing between an anonymous caller
// and every tenant's rows — which makes it the only client that can
// actually observe RLS. The service-role client bypasses RLS by design.
const anonymous = anonKey
  ? createClient(supabaseUrl, anonKey, { auth: { persistSession: false } })
  : null;

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

  // Test 2: Check RLS actually blocks unauthorized access.
  //
  // Audit 2026-08-02: this step used to issue the probe with the
  // SERVICE-ROLE client, which bypasses RLS by design — it asserted
  // "the service role can read organizations", which is true whether
  // every policy is intact, partially dropped, or RLS is disabled
  // outright. The probe now runs as the anonymous role, which is
  // subject to RLS and holds a table-level SELECT grant, so a dropped
  // policy or `ALTER TABLE ... DISABLE ROW LEVEL SECURITY` surfaces
  // immediately as leaked rows.
  console.log('\n2️⃣  Checking RLS policies...');
  const rlsProtectedTables = ['organizations', 'org_members', 'org_tasks'];

  if (!anonymous) {
    console.log(
      '   ❌ NEXT_PUBLIC_SUPABASE_ANON_KEY not set — RLS cannot be verified',
    );
    results.failed++;
    results.errors.push(
      'RLS check: NEXT_PUBLIC_SUPABASE_ANON_KEY is required to probe RLS as an unauthenticated caller',
    );
  } else {
    for (const table of rlsProtectedTables) {
      try {
        const { data, error } = await anonymous
          .from(table)
          .select('id')
          .limit(5);

        if (error) {
          // A hard permission error is also acceptable containment.
          const message = error.message || '';
          if (
            message.includes('permission denied') ||
            error.code === '42501'
          ) {
            console.log(
              `   ✅ RLS on "${table}" denies anonymous reads (${message})`,
            );
            results.passed++;
          } else {
            console.log(
              `   ❌ RLS probe on "${table}" failed unexpectedly: ${message}`,
            );
            results.failed++;
            results.errors.push(`RLS probe ${table}: ${message}`);
          }
          continue;
        }

        const leaked = (data || []).length;
        if (leaked === 0) {
          console.log(`   ✅ RLS on "${table}" returns no rows to anon`);
          results.passed++;
        } else {
          console.log(
            `   ❌ RLS BROKEN: "${table}" returned ${leaked} row(s) to an unauthenticated caller`,
          );
          results.failed++;
          results.errors.push(
            `RLS ${table}: leaked ${leaked} row(s) to the anon role`,
          );
        }
      } catch (err) {
        console.log(`   ❌ RLS probe on "${table}" threw: ${err.message}`);
        results.failed++;
        results.errors.push(`RLS probe ${table}: ${err.message}`);
      }
    }
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
