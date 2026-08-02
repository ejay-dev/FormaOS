import { randomUUID } from 'crypto';
import type { Profile } from '@node-saml/node-saml';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
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

// auth.admin.listUsers() defaults to page 1 / perPage 50, so an
// unpaginated call only ever searches the first 50 auth users. Walk
// every page until a short page is returned, otherwise an existing
// user sorting past page 1 is treated as new and createUser() fails
// on the duplicate email — a permanent SSO outage for that user.
const AUTH_USER_PAGE_SIZE = 200;
const AUTH_USER_MAX_PAGES = 100;

async function findUserByEmail(email: string) {
  const admin = createSupabaseAdminClient();
  const target = email.toLowerCase();

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
    if (users.length < AUTH_USER_PAGE_SIZE) break;
  }

  return null;
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
