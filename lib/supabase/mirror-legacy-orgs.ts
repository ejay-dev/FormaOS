import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';

type MirrorInput = {
  id: string;
  name: string;
  createdBy: string | null;
  nowIso?: string;
};

/**
 * v3-010: the 8 dependent tables (memberships, org_subscriptions, etc.)
 * still FK to `orgs(id)`, while business logic writes to `organizations`.
 * Every write that creates or renames an org must mirror to `orgs` or we
 * drift — 395 missing rows accumulated this way before the consolidation
 * migration. Bootstrap paths MUST propagate failures so the parent txn
 * rolls back; downstream backfills MAY catch but must log loudly.
 */
export async function mirrorOrgToLegacyOrgs(
  admin: SupabaseClient,
  { id, name, createdBy, nowIso }: MirrorInput,
): Promise<void> {
  const ts = nowIso ?? new Date().toISOString();
  const { error } = await admin.from('orgs').upsert(
    {
      id,
      name,
      created_by: createdBy,
      created_at: ts,
      updated_at: ts,
    },
    { onConflict: 'id' },
  );
  if (error) {
    throw new Error(`legacy_orgs_mirror_failed: ${error.message}`);
  }
}
