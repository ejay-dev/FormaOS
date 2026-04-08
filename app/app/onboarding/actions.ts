'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { INDUSTRY_PACKS } from '@/lib/industry-packs';
import { logActivity } from '@/lib/logger';
import { isProvisioningRole } from '@/lib/onboarding/roles';
import { revalidatePath } from 'next/cache';
import { onIndustryPackApplied } from '@/lib/automation/integration';
import { authLogger } from '@/lib/observability/structured-logger';

export async function applyIndustryPack(industryId: string) {
  authLogger.info('industry_pack_starting', { industryId });

  const supabase = await createSupabaseServerClient();
  const admin = createSupabaseAdminClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.error('❌ No User Found');
    throw new Error('Unauthorized: Please log in.');
  }

  // 1. Get Organization (SAFE VERSION, no crashes)
  const { data: membership, error: memError } = await supabase
    .from('org_members')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .maybeSingle(); // <-- CRITICAL FIX

  if (memError) {
    console.error('❌ Membership Query Error:', memError);
    throw new Error('Failed to verify organization membership.');
  }

  const orgId = membership?.organization_id;
  const roleKey = (membership?.role as string | null) ?? null;

  if (!orgId) {
    console.error('❌ No organization_id found for user:', user.id);
    throw new Error('Organization not found.');
  }

  if (!isProvisioningRole(roleKey)) {
    console.error('❌ Insufficient role to provision industry pack:', roleKey);
    throw new Error('Access denied: owner or admin required.');
  }

  const pack = INDUSTRY_PACKS[industryId];
  if (!pack) throw new Error('Invalid industry pack ID.');

  // 2. INSERT POLICIES
  const policyTitles = pack.policies.map((p) => p.title);
  const { data: existingPolicies } = policyTitles.length
    ? await admin
        .from('org_policies')
        .select('title')
        .eq('organization_id', orgId)
        .in('title', policyTitles)
    : { data: [] };

  const existingPolicyTitles = new Set(
    (existingPolicies ?? []).map((row: { title: string }) => row.title),
  );

  const policiesToInsert = pack.policies
    .filter((p) => !existingPolicyTitles.has(p.title))
    .map((p) => ({
      organization_id: orgId,
      title: p.title,
      content: p.content,
      status: 'draft',
      version: 'v0.1',
      author: 'System Template',
    }));

  const { error: policyError } = policiesToInsert.length
    ? await admin.from('org_policies').insert(policiesToInsert)
    : { error: null };

  if (policyError) {
    console.error('❌ Policy Insert Error:', policyError.message);
    throw new Error('Failed to create policies: ' + policyError.message);
  }

  // 3. INSERT TASKS
  const taskTitles = pack.tasks.map((t) => t.title);
  const { data: existingTasks } = taskTitles.length
    ? await admin
        .from('org_tasks')
        .select('title')
        .eq('organization_id', orgId)
        .in('title', taskTitles)
    : { data: [] };

  const existingTaskTitles = new Set(
    (existingTasks ?? []).map((row: { title: string }) => row.title),
  );

  const tasksToInsert = pack.tasks
    .filter((t) => !existingTaskTitles.has(t.title))
    .map((t) => ({
      organization_id: orgId,
      title: t.title,
      description: t.description,
      status: 'pending',
      priority: 'high',
    }));

  const { error: taskError } = tasksToInsert.length
    ? await admin.from('org_tasks').insert(tasksToInsert)
    : { error: null };

  if (taskError) {
    console.error('❌ Task Insert Error:', taskError.message);
    throw new Error('Failed to create tasks: ' + taskError.message);
  }

  // 4. INSERT ASSETS
  const assetNames = pack.assets.map((a) => a.name);
  const { data: existingAssets } = assetNames.length
    ? await admin
        .from('org_assets')
        .select('name')
        .eq('organization_id', orgId)
        .in('name', assetNames)
    : { data: [] };

  const existingAssetNames = new Set(
    (existingAssets ?? []).map((row: { name: string }) => row.name),
  );

  const assetsToInsert = pack.assets
    .filter((a) => !existingAssetNames.has(a.name))
    .map((a) => ({
      organization_id: orgId,
      name: a.name,
      type: a.type,
      criticality: a.criticality,
      owner: 'Unassigned',
    }));

  const { error: assetError } = assetsToInsert.length
    ? await admin.from('org_assets').insert(assetsToInsert)
    : { error: null };

  if (assetError) {
    console.error('❌ Asset Insert Error:', assetError.message);
    throw new Error('Failed to create assets: ' + assetError.message);
  }

  // 5. Set the organization's industry field
  const { error: industryUpdateError } = await admin
    .from('organizations')
    .update({ industry: industryId })
    .eq('id', orgId);

  if (industryUpdateError) {
    console.error(
      'Warning: Failed to set organization industry:',
      industryUpdateError.message,
    );
  }

  // 6. Success Log
  await logActivity(orgId, 'applied_industry_pack', pack.name);

  // 7. Trigger automation for industry pack application
  await onIndustryPackApplied(orgId, industryId, pack.name);

  revalidatePath('/app');

  authLogger.info('industry_pack_applied', { packName: pack.name });

  return { success: true };
}
