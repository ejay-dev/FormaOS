import { createSupabaseClient } from '@/lib/supabase/client';
import { consoleShim } from '@/lib/monitoring/console-shim';

export async function sendNotification(
  userId: string,
  title: string,
  message: string,
  type: 'info' | 'success' | 'warning' | 'error' = 'info',
  actionUrl?: string,
) {
  const supabase = createSupabaseClient();

  const { error } = await supabase.from('notifications').insert({
    user_id: userId,
    title,
    message,
    type,
    action_url: actionUrl,
    read: false,
    created_at: new Date().toISOString(),
  });

  if (error) {
    consoleShim.error('Failed to send notification:', error);
  }
}
