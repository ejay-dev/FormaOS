'use server';

import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getMembershipData } from '@/lib/system-state/server';

export interface MemberIdentity {
  userId: string;
  fullName: string | null;
  email: string | null;
  /** Best available human label. Never a raw user id. */
  name: string;
  initials: string;
}

/** Keyed by user id. A plain object so it survives the server-action boundary. */
export type MemberIdentityMap = Record<string, MemberIdentity>;

type ProfileRow = {
  user_id?: string | null;
  full_name?: string | null;
  email?: string | null;
};

function buildInitials(fullName: string | null, email: string | null): string {
  const source =
    fullName || email?.split('@')[0]?.replace(/[._-]+/g, ' ') || '';
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Names and emails for everyone in the caller's organisation.
 *
 * Takes no arguments on purpose: this module is a server action, so any
 * id or org id in the signature would be caller-controlled and would turn
 * the helper into a lookup endpoint for arbitrary accounts. The org is
 * resolved from the session instead.
 *
 * user_profiles is readable only by its owner under RLS, so the profile
 * read goes through the service-role client; the id list is narrowed to
 * the caller's own organisation before it reaches that query.
 */
export async function getOrgMemberIdentities(): Promise<MemberIdentityMap> {
  const membership = await getMembershipData();
  if (!membership) return {};

  const db = await createSupabaseServerClient();
  const { data: memberRows } = await db
    .from('org_members')
    .select('user_id')
    .eq('organization_id', membership.orgId)
    .limit(500);

  const userIds = Array.from(
    new Set(
      ((memberRows ?? []) as Array<{ user_id?: string | null }>)
        .map((row) => row.user_id)
        .filter((value): value is string => Boolean(value)),
    ),
  );

  if (userIds.length === 0) return {};

  const admin = createSupabaseAdminClient();
  const { data: profiles } = await admin
    .from('user_profiles')
    .select('user_id, full_name, email')
    .in('user_id', userIds);

  const profileByUserId = new Map(
    ((profiles ?? []) as ProfileRow[]).map((profile) => [
      profile.user_id ?? '',
      profile,
    ]),
  );

  const identities: MemberIdentityMap = {};
  for (const userId of userIds) {
    const profile = profileByUserId.get(userId);
    const fullName = profile?.full_name?.trim() || null;
    const email = profile?.email?.trim() || null;
    identities[userId] = {
      userId,
      fullName,
      email,
      name: fullName || email || 'Unknown member',
      initials: buildInitials(fullName, email),
    };
  }

  return identities;
}
