const { createClient } = require('@supabase/supabase-js');
const { randomBytes } = require('crypto');
const fs = require('fs');
const path = require('path');

const supabaseUrl =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials for QA account setup.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const nowIso = new Date().toISOString();
const suffix = Date.now();
const password = `QA!Pass${suffix}`;
const completeOnboarding = process.env.QA_COMPLETE_ONBOARDING !== 'false';

const qaAccounts = {
  createdAt: nowIso,
  password,
  users: {},
  orgs: {},
  invitations: {},
  newUsers: [],
};

const createUser = async (email, label) => {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { qa_label: label },
  });

  if (error) throw error;
  const user = data.user;
  qaAccounts.users[label] = {
    id: user.id,
    email,
  };
  return user.id;
};

const createOrgForUser = async (userId, label, planKey, role = 'owner') => {
  const { data: organization, error: orgError } = await supabase
    .from('organizations')
    .insert({
      name: `QA ${label} Org ${suffix}`,
      created_by: userId,
      plan_key: planKey,
      plan_selected_at: nowIso,
      onboarding_completed: completeOnboarding,
      onboarding_completed_at: completeOnboarding ? nowIso : null,
    })
    .select('id')
    .single();

  if (orgError) throw orgError;

  const organizationId = organization.id;
  qaAccounts.orgs[label] = { id: organizationId, planKey };

  const { error: orgsError } = await supabase
    .from('orgs')
    .insert({ id: organizationId, name: `QA ${label} Org ${suffix}` });

  if (orgsError) throw orgsError;

  const { error: memberError } = await supabase.from('org_members').insert({
    organization_id: organizationId,
    user_id: userId,
    role,
  });

  if (memberError) throw memberError;

  const completedSteps = completeOnboarding
    ? [1, 2, 3, 4, 5, 6, 7]
    : [];

  const { error: onboardingError } = await supabase
    .from('org_onboarding_status')
    .insert({
      organization_id: organizationId,
      current_step: completeOnboarding ? 7 : planKey ? 1 : 2,
      completed_steps: completedSteps,
      completed_at: completeOnboarding ? nowIso : null,
      last_completed_at: completeOnboarding ? nowIso : null,
      first_action: completeOnboarding ? 'qa_seed' : null,
    });

  if (onboardingError) throw onboardingError;

  return organizationId;
};

const ensureSubscription = async (organizationId, planKey, status) => {
  const payload = {
    organization_id: organizationId,
    org_id: organizationId,
    plan_key: planKey,
    plan_code: planKey,
    status,
    updated_at: nowIso,
  };

  if (status === 'trialing') {
    const trialStart = new Date();
    const trialEnd = new Date(trialStart.getTime() + 14 * 24 * 60 * 60 * 1000);
    payload.trial_started_at = trialStart.toISOString();
    payload.trial_expires_at = trialEnd.toISOString();
    payload.current_period_end = trialEnd.toISOString();
  } else {
    const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    payload.current_period_end = periodEnd.toISOString();
  }

  const { error } = await supabase
    .from('org_subscriptions')
    .upsert(payload);

  if (error) throw error;
};

const createInvitation = async (organizationId, invitedBy, email, role) => {
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const { data, error } = await supabase
    .from('team_invitations')
    .insert({
      organization_id: organizationId,
      email: email.toLowerCase(),
      role,
      token,
      invited_by: invitedBy,
      status: 'pending',
      expires_at: expiresAt.toISOString(),
    })
    .select('id')
    .single();

  if (error) throw error;

  qaAccounts.invitations.invitedUser = {
    id: data.id,
    token,
    email,
    organizationId,
  };

  return token;
};

const main = async () => {
  const existingEmail = `qa-existing-${suffix}@example.com`;
  const trialEmail = `qa-trial-${suffix}@example.com`;
  const invitedEmail = `qa-invited-${suffix}@example.com`;

  const existingUserId = await createUser(existingEmail, 'existing');
  const trialUserId = await createUser(trialEmail, 'trial');
  const invitedUserId = await createUser(invitedEmail, 'invited');

  const existingOrgId = await createOrgForUser(
    existingUserId,
    'existing',
    'pro',
  );
  await createOrgForUser(trialUserId, 'trial', 'pro');

  await ensureSubscription(existingOrgId, 'pro', 'active');
  await ensureSubscription(qaAccounts.orgs.trial.id, 'pro', 'trialing');

  await createInvitation(existingOrgId, existingUserId, invitedEmail, 'member');

  qaAccounts.users.invited.organizationId = existingOrgId;
  qaAccounts.users.invited.id = invitedUserId;

  const outputDir = path.join(process.cwd(), 'test-results');
  fs.mkdirSync(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, 'qa-test-accounts.json');
  fs.writeFileSync(outputPath, JSON.stringify(qaAccounts, null, 2));

  console.log('✅ QA test accounts created');
  console.log(`Saved: ${outputPath}`);
};

main().catch((error) => {
  console.error('❌ QA account setup failed:', error.message);
  process.exit(1);
});
