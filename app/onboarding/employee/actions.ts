'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';

/**
 * =========================================================
 * EMPLOYEE ONBOARDING SERVER ACTIONS
 * =========================================================
 */

// ── helpers ──────────────────────────────────────────────

async function getEmployeeContext() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/auth/signin?redirect=/onboarding/employee');

  const { data: membership } = await supabase
    .from('org_members')
    .select('organization_id, role, employee_onboarded_at')
    .eq('user_id', user.id)
    .maybeSingle();

  return { supabase, user, membership };
}

// ── actions ───────────────────────────────────────────────

/**
 * Save display name and optional phone from the profile step.
 * Writes to user_profiles; upserts on user_id.
 */
export async function saveEmployeeProfile(formData: FormData) {
  const { supabase, user } = await getEmployeeContext();

  const displayName = (
    (formData.get('displayName') as string | null) ?? ''
  ).trim();
  const phone = ((formData.get('phone') as string | null) ?? '').trim();

  if (displayName.length < 2) {
    redirect('/onboarding/employee?step=4&error=name_required');
  }

  // Sanitise — no HTML, no script injection
  const safeName = displayName.replace(/[<>"'&]/g, '').slice(0, 80);
  const safePhone = phone.replace(/[^0-9+\-() ]/g, '').slice(0, 20);

  const admin = createSupabaseAdminClient();

  const { error: profileError } = await admin.from('user_profiles').upsert(
    {
      user_id: user.id,
      full_name: safeName,
      ...(safePhone ? { phone: safePhone } : {}),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  );

  if (profileError) {
    console.error('[employee-onboarding] profile save failed', {
      userId: user.id,
      error: profileError.message,
    });
    redirect('/onboarding/employee?step=4&error=save_failed');
  }

  // Also update auth user metadata display name
  await supabase.auth.updateUser({
    data: { full_name: safeName, display_name: safeName },
  });

  redirect('/onboarding/employee?step=5');
}

/**
 * Mark employee onboarding complete.
 * Sets employee_onboarded_at on org_members and user_metadata.
 */
export async function completeEmployeeOnboarding(formData: FormData) {
  const { supabase, user, membership } = await getEmployeeContext();

  const admin = createSupabaseAdminClient();
  const now = new Date().toISOString();

  // Persist completion on org_members row
  if (membership?.organization_id) {
    const { error } = await admin
      .from('org_members')
      .update({ employee_onboarded_at: now })
      .eq('user_id', user.id)
      .eq('organization_id', membership.organization_id);

    if (error) {
      // Non-fatal — column may not exist yet on older DBs; log and continue
      console.warn(
        '[employee-onboarding] employee_onboarded_at update failed',
        {
          error: error.message,
        },
      );
    }
  }

  // Also store in auth user_metadata as the fast check path
  await supabase.auth.updateUser({
    data: { employee_onboarded: true, employee_onboarded_at: now },
  });

  // Respect the CTA href chosen on the Ready step — only allow internal /app/ paths
  const rawCTA = ((formData.get('primaryCTA') as string | null) ?? '').trim();
  const safeCTA =
    rawCTA.startsWith('/app/') || rawCTA === '/app' ? rawCTA : '/app';

  redirect(safeCTA);
}

/**
 * Skip employee onboarding entirely — goes straight to the dashboard.
 * Still marks completion so the wizard doesn't show again.
 */
export async function skipEmployeeOnboarding() {
  const { supabase, user, membership } = await getEmployeeContext();

  const admin = createSupabaseAdminClient();
  const now = new Date().toISOString();

  if (membership?.organization_id) {
    await admin
      .from('org_members')
      .update({ employee_onboarded_at: now })
      .eq('user_id', user.id)
      .eq('organization_id', membership.organization_id)
      .then(() => {}, () => {}); // non-fatal
  }

  await supabase.auth.updateUser({
    data: { employee_onboarded: true, employee_onboarded_at: now },
  });

  redirect('/app');
}
