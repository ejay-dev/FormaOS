/**
 * DEPRECATED — this module is retained only to avoid breaking existing
 * test imports. The auto-provisioning logic it contained used the wrong
 * column name (`plan` instead of `plan_key`) and was never wired into the
 * active signup flow. All new signups go through
 * `lib/supabase/transaction.ts → bootstrapOrganizationAtomic`.
 *
 * DO NOT add any new callers. This file will be removed once its test is
 * also deleted.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

/** @deprecated Use bootstrapOrganizationAtomic instead. */
export async function autoProvisionTrialAccess(
  _supabase: SupabaseClient,
  _userId: string,
  _userEmail: string | null,
): Promise<{ success: boolean; organizationId?: string }> {
  throw new Error(
    'autoProvisionTrialAccess is deprecated and must not be called.',
  );
}
