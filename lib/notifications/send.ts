import type { SupabaseClient } from '@supabase/supabase-js';
import { consoleShim } from '@/lib/monitoring/console-shim';

export type SendNotificationResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Write a single in-app notification.
 *
 * The caller supplies its own request-scoped Supabase client: this module is
 * re-exported from `lib/realtime.ts`, which a client component imports, so it
 * must not pull in a server-only Supabase client of its own. The insert relies
 * on the `notif_insert_member` policy, which requires the acting user to be a
 * member of `orgId` — an anon client cannot satisfy it.
 */
export async function sendNotification(
  supabase: SupabaseClient,
  orgId: string,
  userId: string,
  title: string,
  message: string,
  type: 'info' | 'success' | 'warning' | 'error' = 'info',
  actionUrl?: string,
): Promise<SendNotificationResult> {
  // org_notifications is the live table (public.notifications does not exist).
  // It has no message/action_url/read columns — body carries the text and the
  // link/severity ride in the `data` jsonb, which is where the reader looks.
  const { error } = await supabase.from('org_notifications').insert({
    org_id: orgId,
    user_id: userId,
    type,
    title,
    body: message,
    data: actionUrl ? { severity: type, href: actionUrl } : { severity: type },
  });

  if (error) {
    consoleShim.error('Failed to send notification:', error);
    return { ok: false, error: error.message };
  }

  return { ok: true };
}
