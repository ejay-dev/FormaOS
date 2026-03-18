import crypto from 'crypto';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

const PASSWORD_HISTORY_LIMIT = 5;

export function hashPasswordForHistory(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export async function isPasswordReused(
  userId: string,
  password: string,
): Promise<boolean> {
  const admin = createSupabaseAdminClient();
  const passwordHash = hashPasswordForHistory(password);

  const { data, error } = await admin
    .from('password_history')
    .select('password_hash')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(PASSWORD_HISTORY_LIMIT);

  if (error) {
    console.error('[PasswordHistory] Failed to check history:', error);
    return false;
  }

  return (data ?? []).some(
    (row: { password_hash: string }) => row.password_hash === passwordHash,
  );
}

export async function recordPasswordHistory(
  userId: string,
  password: string,
): Promise<void> {
  const admin = createSupabaseAdminClient();
  const passwordHash = hashPasswordForHistory(password);

  const { error } = await admin.from('password_history').insert({
    user_id: userId,
    password_hash: passwordHash,
  });

  if (error) {
    console.error('[PasswordHistory] Failed to record password:', error);
  }
}

