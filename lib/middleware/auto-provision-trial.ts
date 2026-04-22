/**
 * LEGACY — Grandfathered trial auto-provisioning.
 *
 * New Foundation signups go through the /auth/signup?intent=checkout
 * handshake and are provisioned by the Stripe webhook. This helper is
 * retained only for historical code paths and tests; it is not wired
 * into the active signup flow. Do not re-enable without coordinating
 * with the billing-migration-plan checkout handshake contract.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { billingLogger } from '@/lib/observability/structured-logger';

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

    // User has no organization - auto-provision an organization shell.
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

    const { error: subscriptionError } = await supabase
      .from('org_subscriptions')
      .insert({
        organization_id: newOrg.id,
        plan: 'basic',
        status: 'active',
        trial_expires_at: null,
        current_period_end: null,
      });

    if (subscriptionError) {
      console.error('[Auto-Provision] Failed to create subscription:', subscriptionError);
    }

    billingLogger.info('evaluation_access_auto_provisioned', {
      userId,
      organizationId: newOrg.id,
    });
    return { success: true, organizationId: newOrg.id };
  } catch (error) {
    console.error('[Auto-Provision] Unexpected error:', error);
    return { success: false };
  }
}
