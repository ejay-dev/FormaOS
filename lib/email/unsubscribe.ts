import 'server-only';

import { createSupabaseAdminClient } from '@/lib/supabase/admin';

/**
 * Turn off all non-essential email for a user, across every organisation
 * they belong to.
 *
 * The unsubscribe surfaces used to upsert `unsubscribed_all: true` onto
 * email_preferences. That column does not exist — the table carries
 * `enabled` and `enabled_events` — and the upsert also omitted the NOT NULL
 * organization_id, so the write failed and the recipient stayed subscribed
 * while the page reported success. A user is in one row per organisation,
 * so unsubscribing has to cover all of them.
 */
export async function unsubscribeUserFromAllEmail(
  userId: string,
): Promise<{ ok: boolean }> {
  const admin = createSupabaseAdminClient();
  const now = new Date().toISOString();

  const { data: updated, error: updateError } = await admin
    .from('email_preferences')
    .update({ enabled: false, updated_at: now })
    .eq('user_id', userId)
    .select('id');

  if (updateError) return { ok: false };
  if ((updated ?? []).length > 0) return { ok: true };

  // No preference rows yet: create one per membership, opted out, so the
  // choice survives. Without this a recipient who has never opened settings
  // cannot unsubscribe at all.
  const { data: memberships, error: membershipError } = await admin
    .from('org_members')
    .select('organization_id')
    .eq('user_id', userId);

  if (membershipError) return { ok: false };

  const rows = (memberships ?? [])
    .map((row) => (row as { organization_id?: string }).organization_id)
    .filter((id): id is string => Boolean(id))
    .map((organization_id) => ({
      user_id: userId,
      organization_id,
      enabled: false,
      updated_at: now,
    }));

  if (rows.length === 0) return { ok: false };

  const { error: insertError } = await admin
    .from('email_preferences')
    .insert(rows);

  return { ok: !insertError };
}
