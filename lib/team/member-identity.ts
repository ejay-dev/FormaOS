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
export type MemberIdentityMap = Record<string, MemberIdentity | undefined>;

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
 * Names come from auth.users via the admin API, NOT from public.user_profiles.
 * Verified against production 2026-08-03: user_profiles has 2,598 rows and both
 * `full_name` and `email` are NULL on every one of them, so a lookup there
 * returns nothing and every option renders as "Unknown member". auth.users is
 * the only populated source (6,738 rows, all with an email) and is not
 * reachable through PostgREST, hence the per-id admin call.
 *
 * The id list is narrowed to the caller's own organisation before any of this
 * runs, so the fan-out is bounded by org size.
 */
export async function getOrgMemberIdentities(): Promise<MemberIdentityMap> {
  const membership = await getMembershipData();
  if (!membership) return {};

  const db = await createSupabaseServerClient();
  // Flagged only because this FILE also constructs an admin client further
  // down. This read is on the cookie-bound server client and is subject to RLS;
  // the admin client below never touches a tenant table — it calls
  // auth.admin.getUserById, which takes a user id and no org filter at all.
  // eslint-disable-next-line formaos/no-admin-client-with-org-filter
  const { data: memberRows, error: memberError } = await db
    .from('org_members')
    .select('user_id')
    .eq('organization_id', membership.orgId)
    .limit(500);

  // supabase-js resolves with { data, error } rather than rejecting, so an
  // unchecked failure here would silently return {} and every caller would
  // render an empty picker as though the org had no members.
  if (memberError) {
    throw new Error(
      `getOrgMemberIdentities: failed to read org members: ${memberError.message}`,
    );
  }

  const userIds = Array.from(
    new Set(
      ((memberRows ?? []) as Array<{ user_id?: string | null }>)
        .map((row) => row.user_id)
        .filter((value): value is string => Boolean(value)),
    ),
  );

  if (userIds.length === 0) return {};

  // Service role is required for auth.admin.getUserById; auth.users is not
  // reachable through PostgREST. It reads one user id at a time, and the id
  // list was already narrowed to the caller's own organisation above, so there
  // is no org filter for createSupabaseOrgClient to stamp.
  // eslint-disable-next-line formaos/no-admin-client-with-org-filter
  const admin = createSupabaseAdminClient();
  const resolved = await Promise.all(
    userIds.map(async (userId) => {
      const { data, error } = await admin.auth.admin.getUserById(userId);
      if (error || !data?.user) return [userId, null] as const;
      const meta = (data.user.user_metadata ?? {}) as Record<string, unknown>;
      const metaName =
        typeof meta.full_name === 'string'
          ? meta.full_name
          : typeof meta.name === 'string'
            ? meta.name
            : null;
      return [
        userId,
        { full_name: metaName, email: data.user.email ?? null } as ProfileRow,
      ] as const;
    }),
  );

  const profileByUserId = new Map(resolved);

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
