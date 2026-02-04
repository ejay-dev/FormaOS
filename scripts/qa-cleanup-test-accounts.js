const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials for QA cleanup.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const accountsPath =
  process.env.QA_ACCOUNTS_FILE ||
  path.join(process.cwd(), 'test-results', 'qa-test-accounts.json');

if (!fs.existsSync(accountsPath)) {
  console.error(`QA accounts file not found at ${accountsPath}`);
  process.exit(1);
}

const qaAccounts = JSON.parse(fs.readFileSync(accountsPath, 'utf8'));
const userIds = Object.values(qaAccounts.users || {})
  .map((user) => user.id)
  .filter(Boolean);
const orgIds = Object.values(qaAccounts.orgs || {})
  .map((org) => org.id)
  .filter(Boolean);

const run = async () => {
  for (const orgId of orgIds) {
    await supabase.from('team_invitations').delete().eq('organization_id', orgId);
    await supabase
      .from('org_subscriptions')
      .delete()
      .eq('organization_id', orgId);
    await supabase
      .from('org_onboarding_status')
      .delete()
      .eq('organization_id', orgId);
    await supabase.from('org_members').delete().eq('organization_id', orgId);
    await supabase.from('organizations').delete().eq('id', orgId);
    await supabase.from('orgs').delete().eq('id', orgId);
  }

  for (const userId of userIds) {
    await supabase.from('user_profiles').delete().eq('user_id', userId);
    await supabase.from('org_members').delete().eq('user_id', userId);
    await supabase.auth.admin.deleteUser(userId);
  }

  if (Array.isArray(qaAccounts.newUsers)) {
    for (const email of qaAccounts.newUsers) {
      const { data } = await supabase.auth.admin.listUsers({
        page: 1,
        perPage: 200,
      });
      const user = data?.users?.find((u) => u.email === email);
      if (user) {
        await supabase.from('user_profiles').delete().eq('user_id', user.id);
        await supabase.from('org_members').delete().eq('user_id', user.id);
        await supabase.auth.admin.deleteUser(user.id);
      }
    }
  }

  fs.unlinkSync(accountsPath);
  console.log('✅ QA test accounts cleaned up');
};

run().catch((error) => {
  console.error('❌ QA cleanup failed:', error.message);
  process.exit(1);
});
