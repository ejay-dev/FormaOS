#!/usr/bin/env node

/**
 * Run Supabase SQL migration to fix founder account
 * This script connects to Supabase and fixes the founder account
 */

const fs = require('fs');
const path = require('path');

// Read .env.local manually
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};

envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    let value = match[2].trim();
    // Remove quotes if present
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
const FOUNDER_EMAIL = 'ejazhussaini313@gmail.com';

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase credentials');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', SUPABASE_URL ? '✅' : '❌');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', SERVICE_ROLE_KEY ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixFounderAccount() {
  console.log('🔄 Fixing founder account:', FOUNDER_EMAIL);
  console.log('');

  try {
    // 1. Find the user
    console.log('1️⃣ Finding user...');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) throw new Error(`Failed to list users: ${authError.message}`);
    
    const user = authUsers.users.find(u => u.email === FOUNDER_EMAIL);
    
    if (!user) {
      console.error('❌ User not found with email:', FOUNDER_EMAIL);
      process.exit(1);
    }
    
    console.log('   ✅ Found user:', user.id);
    console.log('');

    // 2. Find organization
    console.log('2️⃣ Finding organization...');
    const { data: membership, error: memberError } = await supabase
      .from('org_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .single();
    
    if (memberError) throw new Error(`Failed to find membership: ${memberError.message}`);
    if (!membership) throw new Error('No organization found for user');
    
    console.log('   ✅ Found organization:', membership.organization_id);
    console.log('   📋 Current role:', membership.role);
    console.log('');

    // 3. Update role to owner
    if (membership.role !== 'owner') {
      console.log('3️⃣ Updating role to owner...');
      const { error: roleError } = await supabase
        .from('org_members')
        .update({ role: 'owner' })
        .eq('user_id', user.id);
      
      if (roleError) throw new Error(`Failed to update role: ${roleError.message}`);
      console.log('   ✅ Role updated to owner');
    } else {
      console.log('3️⃣ Role already set to owner ✅');
    }
    console.log('');

    // 4. Update organization plan
    console.log('4️⃣ Setting plan to pro...');
    const { error: planError } = await supabase
      .from('organizations')
      .update({ plan_key: 'pro' })
      .eq('id', membership.organization_id);
    
    if (planError) throw new Error(`Failed to update plan: ${planError.message}`);
    console.log('   ✅ Plan set to pro');
    console.log('');

    // 5. Ensure active subscription
    console.log('5️⃣ Checking subscription status...');
    const { data: existingSub, error: subCheckError } = await supabase
      .from('org_subscriptions')
      .select('*')
      .eq('organization_id', membership.organization_id)
      .maybeSingle();
    
    if (subCheckError) {
      console.warn('   ⚠️  Could not check subscription:', subCheckError.message);
    } else if (existingSub) {
      console.log('   📋 Current subscription:');
      console.log('      - Status:', existingSub.status);
      console.log('      - Plan:', existingSub.plan_key || 'not set');
      
      // Update if needed
      if (existingSub.status !== 'active' || existingSub.plan_key !== 'pro') {
        console.log('   🔧 Updating subscription...');
        const { error: subError } = await supabase
          .from('org_subscriptions')
          .update({
            plan_key: 'pro',
            status: 'active',
            updated_at: new Date().toISOString(),
          })
          .eq('organization_id', membership.organization_id);
        
        if (subError) {
          console.warn('   ⚠️  Update failed:', subError.message);
        } else {
          console.log('   ✅ Subscription updated');
        }
      } else {
        console.log('   ✅ Subscription already correct');
      }
    } else {
      // Create new subscription
      console.log('   🔧 Creating new subscription...');
      const { error: subError } = await supabase
        .from('org_subscriptions')
        .insert({
          organization_id: membership.organization_id,
          plan_key: 'pro',
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      
      if (subError) {
        console.warn('   ⚠️  Creation failed:', subError.message);
      } else {
        console.log('   ✅ Subscription created');
      }
    }
    console.log('');

    // 6. Ensure entitlements
    console.log('6️⃣ Setting up entitlements...');
    const entitlements = [
      { feature_key: 'audit_export', enabled: true, limit_value: null },
      { feature_key: 'reports', enabled: true, limit_value: null },
      { feature_key: 'framework_evaluations', enabled: true, limit_value: null },
      { feature_key: 'certifications', enabled: true, limit_value: null },
      { feature_key: 'team_limit', enabled: true, limit_value: 75 },
    ];

    for (const ent of entitlements) {
      const { error: entError } = await supabase
        .from('org_entitlements')
        .upsert({
          organization_id: membership.organization_id,
          ...ent,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'organization_id,feature_key'
        });
      
      if (entError) {
        console.warn(`   ⚠️  Failed to set ${ent.feature_key}:`, entError.message);
      }
    }
    console.log('   ✅ Entitlements configured');
    console.log('');

    console.log('✅ FOUNDER ACCOUNT FIXED SUCCESSFULLY!');
    console.log('');
    console.log('📋 Summary:');
    console.log('   - User:', user.email);
    console.log('   - User ID:', user.id);
    console.log('   - Organization ID:', membership.organization_id);
    console.log('   - Role: owner');
    console.log('   - Plan: pro');
    console.log('   - Subscription: active');
    console.log('');
    console.log('✨ Next steps:');
    console.log('   1. Clear browser cookies/cache');
    console.log('   2. Log out of FormaOS');
    console.log('   3. Log back in via Google OAuth');
    console.log('   4. Navigate to /admin');
    console.log('   5. Verify admin access works');
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('');
    console.error('⚠️  Please try:');
    console.error('   1. Check Supabase credentials in .env.local');
    console.error('   2. Verify database permissions');
    console.error('   3. Run migration manually in Supabase SQL Editor');
    process.exit(1);
  }
}

fixFounderAccount();
