#!/usr/bin/env node

/**
 * Check org_subscriptions table schema
 */

const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};

envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || 
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    envVars[key] = value;
  }
});

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = envVars.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = envVars.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function checkSchema() {
  console.log('Checking org_subscriptions schema...\n');

  try {
    // Try to query with RPC
    const { data, error } = await supabase.rpc('get_table_schema', {
      table_name: 'org_subscriptions',
      schema_name: 'public'
    }).catch(() => null);

    if (data) {
      console.log('✅ Table schema via RPC:');
      console.log(JSON.stringify(data, null, 2));
      return;
    }

    // Fallback: just try to select and see what works
    console.log('Attempting to select from org_subscriptions...');
    const { data: subs, error: selectError } = await supabase
      .from('org_subscriptions')
      .select('*')
      .limit(1);

    if (selectError) {
      console.error('❌ Select error:', selectError.message);
      console.error('Details:', selectError.details);
      return;
    }

    if (subs && subs.length > 0) {
      console.log('✅ Sample record found:');
      const record = subs[0];
      console.log('\nColumns in record:');
      Object.keys(record).forEach(key => {
        console.log(`  • ${key}: ${typeof record[key]}`);
      });
    } else {
      console.log('ℹ️  No records to sample, but table accessible');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkSchema();
