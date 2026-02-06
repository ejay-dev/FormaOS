/**
 * Auto-provision trial access for authenticated users
 * Ensures users with valid sessions always have access
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export async function autoProvisionTrialAccess(
  supabase: SupabaseClient,
  userId: string,
  userEmail: string | null
): Promise<{success: boolean; organizationId?: string}> {
  try {
    // Check if user already has org membership
    const { data: existingMembership } = await supabase
      .from('org_members')
      .select('organization_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (existingMembership?.organization_id) {
      return { success: true, organizationId: existingMembership.organization_id };
    }

    // User has no organization - auto-provision trial
    const orgName = userEmail ? `${userEmail.split('@')[0]}'s Organization` : 'My Organization';

    // Create organization
    const { data: newOrg, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: orgName,
        onboarding_completed: false,
      })
      .select()
      .single();

    if (orgError || !newOrg) {
      console.error('[Auto-Provision] Failed to create org:', orgError);
      return { success: false };
    }

    // Create org membership
    const { error: memberError } = await supabase
      .from('org_members')
      .insert({
        organization_id: newOrg.id,
        user_id: userId,
        role: 'admin',
      });

    if (memberError) {
      console.error('[Auto-Provision] Failed to create membership:', memberError);
      return { success: false };
    }

    // Create trial subscription
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 14); // 14 day trial

    const { error: subscriptionError } = await supabase
      .from('org_subscriptions')
      .insert({
        organization_id: newOrg.id,
        plan: 'basic',
        status: 'trialing',
        trial_expires_at: trialEnd.toISOString(),
        current_period_end: trialEnd.toISOString(),
      });

    if (subscriptionError) {
      console.error('[Auto-Provision] Failed to create subscription:', subscriptionError);
    }

    console.log('[Auto-Provision] Trial access created for user:', userId);
    return { success: true, organizationId: newOrg.id };
  } catch (error) {
    console.error('[Auto-Provision] Unexpected error:', error);
    return { success: false };
  }
}
