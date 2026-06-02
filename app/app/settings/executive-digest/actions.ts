'use server';

/**
 * Persist executive-digest settings into org_settings (key='executive_digest').
 * Previously the page was read-only with no save path, so the config could
 * never be changed. org_settings is org-scoped via createSupabaseOrgClient.
 */

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { fetchSystemState } from '@/lib/system-state/server';
import { createSupabaseOrgClient } from '@/lib/supabase/org-scoped';
import { routeLog } from '@/lib/monitoring/server-logger';

const log = routeLog('settings/executive-digest');
const PATH = '/app/settings/executive-digest';

export async function saveExecutiveDigestSettings(
  formData: FormData,
): Promise<void> {
  const state = await fetchSystemState();
  if (!state) redirect('/auth/signin');

  const enabled = formData.get('enabled') === 'on';
  const frequency =
    String(formData.get('frequency') ?? 'weekly') === 'monthly'
      ? 'monthly'
      : 'weekly';
  const recipients = formData
    .getAll('recipients')
    .map((r) => String(r).trim())
    .filter(Boolean);

  const db = createSupabaseOrgClient(state.organization.id);
  const { error } = await db.from('org_settings').upsert(
    {
      organization_id: state.organization.id,
      key: 'executive_digest',
      value: { enabled, frequency, recipients },
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'organization_id,key' },
  );

  if (error) {
    log.error(
      { err: error, orgId: state.organization.id },
      'save executive-digest settings failed',
    );
    redirect(`${PATH}?error=save_failed`);
  }

  revalidatePath(PATH);
  redirect(`${PATH}?saved=1`);
}
