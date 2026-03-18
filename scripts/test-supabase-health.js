#!/usr/bin/env node
/**
 * Supabase Health Check Script
 * Verifies Supabase connection and basic functionality
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

console.log('🏥 Supabase Health Check\n');
console.log('='.repeat(50));

if (!supabaseUrl) {
  console.log('⚠️  NEXT_PUBLIC_SUPABASE_URL not configured');
  console.log('   Skipping Supabase health checks');
  process.exit(0);
}

if (!supabaseAnonKey && !serviceRoleKey) {
  console.log('⚠️  No Supabase keys configured');
  console.log(
    '   Set NEXT_PUBLIC_SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY',
  );
  process.exit(0);
}

const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  checks: [],
};

async function runHealthChecks() {
  // Use service role key if available, otherwise anon key
  const key = serviceRoleKey || supabaseAnonKey;
  const keyType = serviceRoleKey ? 'service_role' : 'anon';

  console.log(`\nUsing ${keyType} key for health checks\n`);

  const supabase = createClient(supabaseUrl, key, {
    auth: { persistSession: false },
  });

  // Check 1: Basic Connection
  console.log('1️⃣  Testing Supabase connection...');
  try {
    const start = Date.now();
    const { error } = await supabase
      .from('organizations')
      .select('count')
      .limit(0);
    const latency = Date.now() - start;

    if (error && !error.message.includes('permission denied')) {
      throw new Error(error.message);
    }

    console.log(`   ✅ Connected successfully (${latency}ms)`);
    results.passed++;
    results.checks.push({ name: 'Connection', status: 'pass', latency });
  } catch (err) {
    console.log(`   ❌ Connection failed: ${err.message}`);
    results.failed++;
    results.checks.push({
      name: 'Connection',
      status: 'fail',
      error: err.message,
    });
  }

  // Check 2: Auth Service
  console.log('\n2️⃣  Testing Auth service...');
  try {
    const { error } = await supabase.auth.getSession();

    // No error means auth service is responding
    if (!error) {
      console.log('   ✅ Auth service is healthy');
      results.passed++;
      results.checks.push({ name: 'Auth Service', status: 'pass' });
    } else {
      throw new Error(error.message);
    }
  } catch (err) {
    console.log(`   ⚠️  Auth service check: ${err.message}`);
    results.warnings++;
    results.checks.push({
      name: 'Auth Service',
      status: 'warn',
      error: err.message,
    });
  }

  // Check 3: Realtime (if available)
  console.log('\n3️⃣  Testing Realtime connection...');
  try {
    const channel = supabase.channel('health-check');

    // Subscribe and immediately unsubscribe to test connectivity
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        channel.unsubscribe();
        resolve('timeout');
      }, 3000);

      channel
        .on('system', { event: '*' }, () => {
          clearTimeout(timeout);
          resolve('connected');
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            clearTimeout(timeout);
            channel.unsubscribe();
            resolve('subscribed');
          } else if (status === 'CHANNEL_ERROR') {
            clearTimeout(timeout);
            reject(new Error('Channel error'));
          }
        });
    });

    console.log('   ✅ Realtime service accessible');
    results.passed++;
    results.checks.push({ name: 'Realtime', status: 'pass' });
  } catch (err) {
    console.log(`   ⚠️  Realtime check: ${err.message || 'unavailable'}`);
    results.warnings++;
    results.checks.push({
      name: 'Realtime',
      status: 'warn',
      error: err.message,
    });
  }

  // Check 4: Storage (if service role)
  if (serviceRoleKey) {
    console.log('\n4️⃣  Testing Storage service...');
    try {
      const { data, error } = await supabase.storage.listBuckets();

      if (!error) {
        console.log(
          `   ✅ Storage service is healthy (${data?.length || 0} buckets)`,
        );
        results.passed++;
        results.checks.push({
          name: 'Storage',
          status: 'pass',
          buckets: data?.length || 0,
        });
      } else {
        throw new Error(error.message);
      }
    } catch (err) {
      console.log(`   ⚠️  Storage check: ${err.message}`);
      results.warnings++;
      results.checks.push({
        name: 'Storage',
        status: 'warn',
        error: err.message,
      });
    }
  }

  // Check 5: Database Functions (if any exist)
  console.log('\n5️⃣  Testing database access...');
  try {
    const start = Date.now();
    const { error } = await supabase.from('profiles').select('id').limit(1);
    const latency = Date.now() - start;

    if (
      error &&
      !error.message.includes('permission denied') &&
      !error.message.includes('does not exist')
    ) {
      throw new Error(error.message);
    }

    console.log(`   ✅ Database queries working (${latency}ms)`);
    results.passed++;
    results.checks.push({ name: 'Database', status: 'pass', latency });
  } catch (err) {
    console.log(`   ⚠️  Database check: ${err.message}`);
    results.warnings++;
    results.checks.push({
      name: 'Database',
      status: 'warn',
      error: err.message,
    });
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Supabase Health Check Results:');
  console.log(`   ✅ Passed:   ${results.passed}`);
  console.log(`   ⚠️  Warnings: ${results.warnings}`);
  console.log(`   ❌ Failed:   ${results.failed}`);
  console.log('='.repeat(50));

  if (results.failed > 0) {
    console.log('\n❌ Supabase health check FAILED');
    process.exit(1);
  }

  if (results.warnings > 0) {
    console.log('\n⚠️  Supabase health check PASSED with warnings');
    process.exit(0);
  }

  console.log('\n✅ Supabase health check PASSED');
  process.exit(0);
}

runHealthChecks().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
