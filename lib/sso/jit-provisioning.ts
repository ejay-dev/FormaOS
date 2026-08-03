import { randomUUID } from 'crypto';
import type { Profile } from '@node-saml/node-saml';
import type { User } from '@supabase/supabase-js';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { getSupabaseServiceRoleKey, getSupabaseUrl } from '@/lib/supabase/env';
import { logIdentityEvent } from '@/lib/identity/audit';
import {
  getSamlDisplayName,
  getSamlEmail,
  getSamlGroups,
  isAllowedDomain,
} from '@/lib/sso/saml';

type JitRole = 'owner' | 'admin' | 'member' | 'viewer' | 'auditor';

// v4-016: previously matched group names via `.includes('owner')` /
// `.includes('admin')` — so an IdP group called `not-admin`,
// `read-owner-docs`, or `viewer-not-allowed` would auto-grant
// elevated roles. Switch to exact-match (case-insensitive) against
// a fixed allowlist of well-known group forms. Anything not in the
// allowlist falls through to the configured default role.
//
// Accepted forms per role:
//   owner   → "owner", "owners", "formaos-owner", "formaos-owners",
//             "role:owner"
//   admin   → "admin", "admins", "administrator", "administrators",
//             "formaos-admin", "formaos-admins", "role:admin"
//   auditor → "auditor", "auditors", "formaos-auditor",
//             "formaos-auditors", "role:auditor"
//   viewer  → "viewer", "viewers", "readonly", "read-only",
//             "formaos-viewer", "formaos-viewers", "role:viewer"
const ROLE_GROUP_MAP: Record<Exclude<JitRole, 'member'>, ReadonlySet<string>> = {
  owner: new Set([
    'owner',
    'owners',
    'formaos-owner',
    'formaos-owners',
    'role:owner',
  ]),
  admin: new Set([
    'admin',
    'admins',
    'administrator',
    'administrators',
    'formaos-admin',
    'formaos-admins',
    'role:admin',
  ]),
  auditor: new Set([
    'auditor',
    'auditors',
    'formaos-auditor',
    'formaos-auditors',
    'role:auditor',
  ]),
  viewer: new Set([
    'viewer',
    'viewers',
    'readonly',
    'read-only',
    'formaos-viewer',
    'formaos-viewers',
    'role:viewer',
  ]),
};

// Role precedence: highest privilege wins, so a user in both
// "owners" and "viewers" lands on owner. Auditor sits above viewer
// because it implies read-everywhere + signed-attestation rights.
const ROLE_PRECEDENCE: Exclude<JitRole, 'member'>[] = [
  'owner',
  'admin',
  'auditor',
  'viewer',
];

function mapGroupToRole(groups: string[], fallbackRole: JitRole): JitRole {
  const normalized = new Set(groups.map((group) => group.trim().toLowerCase()));

  for (const role of ROLE_PRECEDENCE) {
    for (const candidate of ROLE_GROUP_MAP[role]) {
      if (normalized.has(candidate)) return role;
    }
  }

  return fallbackRole;
}

// auth.admin.listUsers() defaults to page 1 / perPage 50 and exposes no
// email filter, so resolving a user through it means walking the whole
// directory — dozens of sequential round-trips on the SAML ACS path, which
// runs under a 30s function budget. GoTrue's admin users endpoint does take
// a filter, so the lookup goes there directly and the walk is kept only for
// processes without service-role credentials (build/test).
const AUTH_USER_PAGE_SIZE = 200;
const AUTH_USER_MAX_PAGES = 100;

type AdminApiLookup =
  | { available: false }
  | { available: true; user: User | null };

async function findUserByEmailViaAdminApi(
  target: string,
): Promise<AdminApiLookup> {
  const baseUrl = getSupabaseUrl().replace(/\/$/, '');
  const serviceKey = getSupabaseServiceRoleKey();
  if (!baseUrl || !serviceKey) return { available: false };

  let response: Response;
  try {
    response = await fetch(
      `${baseUrl}/auth/v1/admin/users?per_page=${AUTH_USER_PAGE_SIZE}&filter=${encodeURIComponent(target)}`,
      {
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
        },
        cache: 'no-store',
      },
    );
  } catch {
    return { available: false };
  }

  if (!response.ok) return { available: false };

  const body = (await response.json().catch(() => null)) as {
    users?: User[];
  } | null;
  const users = body?.users ?? [];

  const match = users.find((user) => user.email?.toLowerCase() === target);
  if (match) return { available: true, user: match };

  // `filter` matches substrings, so a full page with no exact hit means the
  // answer may still be on a later page — inconclusive, not "absent".
  if (users.length >= AUTH_USER_PAGE_SIZE) return { available: false };

  return { available: true, user: null };
}

/**
 * Resolve an email address to its auth user. Exported so the SAML ACS route can
 * bind an asserted identity to a real account without duplicating the
 * pagination/inconclusive-page rules below.
 *
 * Deliberately NOT resolved through public.user_profiles: that table has an
 * `email` column but it is NULL for all 2,598 production rows, so a lookup
 * against it silently matches nothing.
 */
export async function findUserByEmail(email: string): Promise<User | null> {
  const target = email.toLowerCase();

  const direct = await findUserByEmailViaAdminApi(target);
  if (direct.available) return direct.user;

  const admin = createSupabaseAdminClient();

  for (let page = 1; page <= AUTH_USER_MAX_PAGES; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: AUTH_USER_PAGE_SIZE,
    });

    if (error) {
      throw new Error(`Failed to look up SSO user: ${error.message}`);
    }

    const users = data?.users ?? [];
    const match = users.find((user) => user.email?.toLowerCase() === target);
    if (match) return match;
    if (users.length < AUTH_USER_PAGE_SIZE) return null;
  }

  // Returning null here would be indistinguishable from "no such user" and
  // would send an existing account into createUser(), which fails on the
  // duplicate email and locks that user out of SSO permanently.
  throw new Error(
    `Failed to look up SSO user: pagination cap reached after ${AUTH_USER_MAX_PAGES} pages of ${AUTH_USER_PAGE_SIZE} — lookup is incomplete`,
  );
}

export async function provisionJitUser(args: {
  orgId: string;
  profile: Profile;
  allowedDomains: string[];
  defaultRole: JitRole;
  actorLabel?: string | null;
}) {
  const admin = createSupabaseAdminClient();
  const email = getSamlEmail(args.profile);
  if (!email) {
    throw new Error('SAML assertion did not include an email address');
  }
  if (!isAllowedDomain(email, args.allowedDomains)) {
    throw new Error('Email domain does not match this SSO configuration');
  }

  const displayName = getSamlDisplayName(args.profile);
  const groups = getSamlGroups(args.profile);
  const role = mapGroupToRole(groups, args.defaultRole);

  let user = await findUserByEmail(email);
  let created = false;

  if (!user) {
    const createdUser = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
      password: `${randomUUID()}${randomUUID()}`,
      user_metadata: {
        full_name: displayName,
        saml_jit: true,
      },
    });

    if (createdUser.error || !createdUser.data.user) {
      throw new Error(
        createdUser.error?.message ?? 'Failed to create JIT user',
      );
    }

    user = createdUser.data.user;
    created = true;
  }

  const { error: membershipError } = await admin.from('org_members').upsert(
    {
      organization_id: args.orgId,
      user_id: user.id,
      role,
      compliance_status: 'active',
    },
    { onConflict: 'organization_id,user_id' },
  );

  if (membershipError) {
    throw new Error(membershipError.message);
  }

  await admin.from('user_profiles').upsert(
    {
      user_id: user.id,
      organization_id: args.orgId,
      full_name: displayName,
    },
    { onConflict: 'user_id' },
  );

  await logIdentityEvent({
    eventType: created ? 'jit.user.provisioned' : 'jit.user.updated',
    actorType: 'system',
    actorLabel: args.actorLabel ?? 'SAML JIT',
    orgId: args.orgId,
    targetUserId: user.id,
    targetUserEmail: email,
    result: 'success',
    metadata: {
      groups,
      role,
      created,
    },
  });

  return {
    userId: user.id,
    email,
    displayName,
    role,
    groups,
    created,
  };
}
