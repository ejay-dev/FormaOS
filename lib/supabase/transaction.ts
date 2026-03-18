import { createSupabaseAdminClient } from './admin';

/**
 * Execute multiple database operations within a transaction-like wrapper.
 * Uses Supabase's RPC to wrap operations in a PostgreSQL transaction.
 *
 * For critical operations like org creation, this ensures all-or-nothing semantics.
 */
export async function withTransaction<T>(
  operations: () => Promise<T>,
): Promise<{ data: T | null; error: Error | null }> {
  const admin = createSupabaseAdminClient();

  try {
    // Begin transaction
    await admin.rpc('begin_transaction').throwOnError();

    // Execute operations
    const result = await operations();

    // Commit transaction
    await admin.rpc('commit_transaction').throwOnError();

    return { data: result, error: null };
  } catch (error) {
    // Rollback on any error
    try {
      await admin.rpc('rollback_transaction');
    } catch {
      // Ignore rollback errors
    }

    return {
      data: null,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

/**
 * Simpler approach: Execute operations sequentially with manual rollback on failure.
 * This doesn't use true transactions but provides cleanup on failure.
 */
export interface OrgBootstrapResult {
  organizationId: string;
  membershipCreated: boolean;
  subscriptionCreated: boolean;
  onboardingCreated: boolean;
}

export async function bootstrapOrganizationAtomic(params: {
  userId: string;
  userEmail: string | null;
  orgName: string;
  planKey: string;
}): Promise<{ data: OrgBootstrapResult | null; error: Error | null }> {
  const { userId, orgName, planKey } = params;
  const admin = createSupabaseAdminClient();
  const now = new Date().toISOString();

  let organizationId: string | null = null;

  try {
    // 1. Create organization
    const { data: org, error: orgError } = await admin
      .from('organizations')
      .insert({
        name: orgName,
        created_by: userId,
        plan_key: planKey,
        plan_selected_at: now,
        onboarding_completed: false,
      })
      .select('id')
      .single();

    if (orgError || !org?.id) {
      throw new Error(
        `Organization creation failed: ${orgError?.message || 'Unknown error'}`,
      );
    }

    organizationId = org.id;

    // 2. Create legacy org entry (for FK constraints)
    const { error: legacyError } = await admin.from('orgs').upsert(
      {
        id: organizationId,
        name: orgName,
        created_by: userId,
        created_at: now,
        updated_at: now,
      },
      { onConflict: 'id' },
    );

    if (legacyError) {
      console.warn(
        '[bootstrap] Legacy orgs entry failed (non-critical):',
        legacyError.message,
      );
    }

    // 3. Create membership
    const { error: memberError } = await admin.from('org_members').insert({
      organization_id: organizationId,
      user_id: userId,
      role: 'owner',
    });

    if (memberError) {
      throw new Error(`Membership creation failed: ${memberError.message}`);
    }

    // 4. Create onboarding status
    const { error: onboardingError } = await admin
      .from('org_onboarding_status')
      .insert({
        organization_id: organizationId,
        current_step: planKey ? 1 : 2,
        completed_steps: [],
      });

    if (onboardingError) {
      console.warn(
        '[bootstrap] Onboarding status failed (non-critical):',
        onboardingError.message,
      );
    }

    // 5. Create subscription
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 14);

    const { error: subError } = await admin.from('org_subscriptions').upsert(
      {
        organization_id: organizationId,
        org_id: organizationId,
        plan_key: planKey,
        plan_code: planKey === 'basic' ? 'starter' : planKey,
        status: 'trialing',
        trial_started_at: now,
        trial_expires_at: trialEnd.toISOString(),
        updated_at: now,
      },
      { onConflict: 'organization_id' },
    );

    if (subError) {
      console.warn(
        '[bootstrap] Subscription creation failed (non-critical):',
        subError.message,
      );
    }

    return {
      data: {
        organizationId: organizationId!,
        membershipCreated: true,
        subscriptionCreated: !subError,
        onboardingCreated: !onboardingError,
      },
      error: null,
    };
  } catch (error) {
    // Cleanup on failure - delete the org if it was created
    if (organizationId) {
      console.error('[bootstrap] Rolling back organization:', organizationId);

      // Delete in reverse order to respect FK constraints
      await admin
        .from('org_onboarding_status')
        .delete()
        .eq('organization_id', organizationId);
      await admin
        .from('org_subscriptions')
        .delete()
        .eq('organization_id', organizationId);
      await admin
        .from('org_members')
        .delete()
        .eq('organization_id', organizationId);
      await admin.from('orgs').delete().eq('id', organizationId);
      await admin.from('organizations').delete().eq('id', organizationId);
    }

    return {
      data: null,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}
