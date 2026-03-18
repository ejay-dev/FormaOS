import { randomUUID } from 'crypto';
import type { Profile } from '@node-saml/node-saml';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { logIdentityEvent } from '@/lib/identity/audit';
import { getSamlDisplayName, getSamlEmail, getSamlGroups, isAllowedDomain } from '@/lib/sso/saml';

type JitRole = 'owner' | 'admin' | 'member' | 'viewer' | 'auditor';

function mapGroupToRole(groups: string[], fallbackRole: JitRole): JitRole {
  const normalized = groups.map((group) => group.toLowerCase());

  if (normalized.some((group) => group.includes('owner'))) return 'owner';
  if (normalized.some((group) => group.includes('admin'))) return 'admin';
  if (normalized.some((group) => group.includes('auditor'))) return 'auditor';
  if (normalized.some((group) => group.includes('viewer') || group.includes('read'))) {
    return 'viewer';
  }

  return fallbackRole;
}

async function findUserByEmail(email: string) {
  const admin = createSupabaseAdminClient();
  const { data } = await admin.auth.admin.listUsers();
  return data?.users?.find((user: any) => user.email?.toLowerCase() === email.toLowerCase()) ?? null;
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
      throw new Error(createdUser.error?.message ?? 'Failed to create JIT user');
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
