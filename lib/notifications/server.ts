import 'server-only';

import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function requireNotificationContext(requestedOrgId?: string | null) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  let query = supabase
    .from('org_members')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .limit(1);

  if (requestedOrgId) {
    query = query.eq('organization_id', requestedOrgId);
  }

  const { data: membership, error } = await query.maybeSingle();

  if (error || !membership?.organization_id) {
    throw new Error('Organization membership not found');
  }

  return {
    supabase,
    user,
    orgId: membership.organization_id as string,
    role: (membership.role as string | null | undefined) ?? 'member',
  };
}

export function encodeCursor(value: { created_at: string; id: string }) {
  return Buffer.from(`${value.created_at}::${value.id}`, 'utf8').toString(
    'base64',
  );
}

export function decodeCursor(cursor?: string | null) {
  if (!cursor) return null;

  try {
    const [createdAt, id] = Buffer.from(cursor, 'base64')
      .toString('utf8')
      .split('::');

    if (!createdAt || !id) {
      return null;
    }

    return { createdAt, id };
  } catch {
    return null;
  }
}
