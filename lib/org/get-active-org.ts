export type ActiveOrg = {
  id: string;
  name: string;
};

import type { SupabaseClient } from '@supabase/supabase-js';

export async function getActiveOrg(
  supabase: SupabaseClient,
): Promise<ActiveOrg | null> {
  const { data, error } = await supabase
    .from('org_members') // ✅ CORRECT TABLE NAME
    .select(
      `
      organization:organizations (
        id,
        name
      )
    `,
    )
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('[getActiveOrg] failed:', error);
    return null;
  }

  if (!data?.organization) return null;

  return data.organization as unknown as ActiveOrg;
}
