/**
 * =========================================================
 * SCIM 2.0 Server Implementation
 * =========================================================
 * RFC 7644 compliant SCIM 2.0 endpoint handlers for
 * automated user provisioning & deprovisioning.
 *
 * Supports: Users (CRUD), Groups (CRUD), ServiceProviderConfig,
 * ResourceTypes, Schemas discovery endpoints.
 */

import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { logActivity } from '@/lib/audit-trail';
import { timingSafeEqual, randomUUID } from 'crypto';

// ─── Types ──────────────────────────────────────────────

export interface ScimUser {
  schemas: string[];
  id: string;
  externalId?: string;
  userName: string;
  name?: { givenName?: string; familyName?: string; formatted?: string };
  emails?: Array<{ value: string; type?: string; primary?: boolean }>;
  displayName?: string;
  active: boolean;
  groups?: Array<{ value: string; display?: string }>;
  meta: {
    resourceType: 'User';
    created: string;
    lastModified: string;
    location: string;
  };
}

export interface ScimGroup {
  schemas: string[];
  id: string;
  displayName: string;
  members?: Array<{ value: string; display?: string }>;
  meta: {
    resourceType: 'Group';
    created: string;
    lastModified: string;
    location: string;
  };
}

export interface ScimListResponse<T> {
  schemas: string[];
  totalResults: number;
  itemsPerPage: number;
  startIndex: number;
  Resources: T[];
}

export interface ScimError {
  schemas: string[];
  status: string;
  detail: string;
}

type OrgRole = 'admin' | 'compliance_lead' | 'reviewer' | 'auditor' | 'member';

const SCIM_SCHEMA_USER = 'urn:ietf:params:scim:schemas:core:2.0:User';
const SCIM_SCHEMA_GROUP = 'urn:ietf:params:scim:schemas:core:2.0:Group';
const SCIM_SCHEMA_LIST = 'urn:ietf:params:scim:api:messages:2.0:ListResponse';
const SCIM_SCHEMA_ERROR = 'urn:ietf:params:scim:api:messages:2.0:Error';
const _SCIM_SCHEMA_PATCH = 'urn:ietf:params:scim:api:messages:2.0:PatchOp';

// ─── Auth ───────────────────────────────────────────────

export async function authenticateScimRequest(
  request: Request,
  orgId: string,
): Promise<{ ok: true } | { ok: false; error: ScimError; status: number }> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return {
      ok: false,
      status: 401,
      error: scimError('401', 'Bearer token required'),
    };
  }

  const token = authHeader.slice(7);
  const admin = createSupabaseAdminClient();

  const { data, error } = await admin
    .from('scim_tokens')
    .select('token_hash, organization_id, active')
    .eq('organization_id', orgId)
    .eq('active', true)
    .maybeSingle();

  if (error || !data) {
    return {
      ok: false,
      status: 401,
      error: scimError('401', 'SCIM not configured for this organization'),
    };
  }

  // Timing-safe comparison of SHA-256 hashes
  const { createHash } = await import('crypto');
  const incomingHash = createHash('sha256').update(token).digest('hex');
  const storedHash = data.token_hash;

  const a = Buffer.from(incomingHash, 'utf8');
  const b = Buffer.from(storedHash, 'utf8');
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return {
      ok: false,
      status: 401,
      error: scimError('401', 'Invalid bearer token'),
    };
  }

  return { ok: true };
}

// ─── Users ──────────────────────────────────────────────

export async function listUsers(
  orgId: string,
  baseUrl: string,
  params: { startIndex?: number; count?: number; filter?: string },
): Promise<ScimListResponse<ScimUser>> {
  const admin = createSupabaseAdminClient();
  const startIndex = Math.max(1, params.startIndex ?? 1);
  const count = Math.min(100, Math.max(1, params.count ?? 100));

  let query = admin
    .from('org_members')
    .select(
      'user_id, role, created_at, updated_at, profiles:user_profiles(full_name, phone)',
      { count: 'exact' },
    )
    .eq('organization_id', orgId)
    .range(startIndex - 1, startIndex - 1 + count - 1);

  // Parse simple SCIM filter: userName eq "..."
  if (params.filter) {
    const emailMatch = params.filter.match(/userName\s+eq\s+"([^"]+)"/i);
    if (emailMatch) {
      const { data: authUser } = await admin.rpc('get_user_by_email', {
        p_email: emailMatch[1],
      });
      if (authUser?.id) {
        query = query.eq('user_id', authUser.id);
      } else {
        return {
          schemas: [SCIM_SCHEMA_LIST],
          totalResults: 0,
          itemsPerPage: count,
          startIndex,
          Resources: [],
        };
      }
    }
  }

  const { data: members, count: totalCount } = await query;

  const users: ScimUser[] = [];
  for (const m of members ?? []) {
    const { data: authUser } = await admin.auth.admin.getUserById(m.user_id);
    if (!authUser?.user) continue;

    const profile = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
    users.push(mapToScimUser(authUser.user, m, profile, orgId, baseUrl));
  }

  return {
    schemas: [SCIM_SCHEMA_LIST],
    totalResults: totalCount ?? users.length,
    itemsPerPage: count,
    startIndex,
    Resources: users,
  };
}

export async function getUser(
  orgId: string,
  userId: string,
  baseUrl: string,
): Promise<ScimUser | null> {
  const admin = createSupabaseAdminClient();

  const { data: member } = await admin
    .from('org_members')
    .select(
      'user_id, role, created_at, updated_at, profiles:user_profiles(full_name, phone)',
    )
    .eq('organization_id', orgId)
    .eq('user_id', userId)
    .maybeSingle();

  if (!member) return null;

  const { data: authUser } = await admin.auth.admin.getUserById(userId);
  if (!authUser?.user) return null;

  const profile = Array.isArray(member.profiles)
    ? member.profiles[0]
    : member.profiles;
  return mapToScimUser(authUser.user, member, profile, orgId, baseUrl);
}

export async function createUser(
  orgId: string,
  body: any,
  baseUrl: string,
): Promise<{ user: ScimUser } | { error: ScimError; status: number }> {
  const admin = createSupabaseAdminClient();

  const email = body.userName || body.emails?.[0]?.value;
  if (!email) {
    return {
      error: scimError('400', 'userName (email) is required'),
      status: 400,
    };
  }

  // Check if user already exists in Supabase Auth
  const { data: existingUsers } = await admin.auth.admin.listUsers();
  const existing = existingUsers?.users?.find(
    (u: any) => u.email?.toLowerCase() === email.toLowerCase(),
  );

  let userId: string;

  if (existing) {
    userId = existing.id;
  } else {
    // Create user in Supabase Auth with a random password (SSO login expected)
    const { data: newUser, error: createErr } =
      await admin.auth.admin.createUser({
        email,
        email_confirm: true,
        password: randomUUID() + randomUUID(), // Random, SSO expected
        user_metadata: {
          full_name: body.name
            ? `${body.name.givenName ?? ''} ${body.name.familyName ?? ''}`.trim()
            : (body.displayName ?? email),
          scim_provisioned: true,
        },
      });

    if (createErr || !newUser?.user) {
      return {
        error: scimError('500', createErr?.message ?? 'Failed to create user'),
        status: 500,
      };
    }
    userId = newUser.user.id;
  }

  // Check if already a member of this org
  const { data: existingMember } = await admin
    .from('org_members')
    .select('user_id')
    .eq('organization_id', orgId)
    .eq('user_id', userId)
    .maybeSingle();

  if (existingMember) {
    return {
      error: scimError('409', 'User already exists in this organization'),
      status: 409,
    };
  }

  // Add to org
  const role: OrgRole = 'member';
  const { error: memberErr } = await admin.from('org_members').insert({
    organization_id: orgId,
    user_id: userId,
    role,
  });

  if (memberErr) {
    return {
      error: scimError(
        '500',
        `Failed to add user to org: ${memberErr.message}`,
      ),
      status: 500,
    };
  }

  // Create user profile
  const fullName = body.name
    ? `${body.name.givenName ?? ''} ${body.name.familyName ?? ''}`.trim()
    : (body.displayName ?? '');

  if (fullName) {
    await admin.from('user_profiles').upsert(
      {
        user_id: userId,
        organization_id: orgId,
        full_name: fullName,
      },
      { onConflict: 'user_id' },
    );
  }

  await logActivity(orgId, 'system', 'create', 'member', {
    entityId: userId,
    entityName: email,
    details: { source: 'scim', role },
  });

  const user = await getUser(orgId, userId, baseUrl);
  if (!user) {
    return {
      error: scimError('500', 'User created but could not be retrieved'),
      status: 500,
    };
  }

  return { user };
}

export async function updateUser(
  orgId: string,
  userId: string,
  body: any,
  baseUrl: string,
): Promise<{ user: ScimUser } | { error: ScimError; status: number }> {
  const admin = createSupabaseAdminClient();

  // Verify membership
  const { data: member } = await admin
    .from('org_members')
    .select('user_id')
    .eq('organization_id', orgId)
    .eq('user_id', userId)
    .maybeSingle();

  if (!member) {
    return { error: scimError('404', 'User not found'), status: 404 };
  }

  // Handle active status (deprovisioning)
  if (body.active === false) {
    await admin
      .from('org_members')
      .delete()
      .eq('organization_id', orgId)
      .eq('user_id', userId);

    await logActivity(orgId, 'system', 'delete', 'member', {
      entityId: userId,
      details: { source: 'scim', reason: 'deprovisioned' },
    });

    // Return deactivated user
    const { data: authUser } = await admin.auth.admin.getUserById(userId);
    if (authUser?.user) {
      return {
        user: {
          schemas: [SCIM_SCHEMA_USER],
          id: userId,
          userName: authUser.user.email ?? '',
          active: false,
          meta: {
            resourceType: 'User',
            created: authUser.user.created_at,
            lastModified: new Date().toISOString(),
            location: `${baseUrl}/scim/v2/Users/${userId}`,
          },
        },
      };
    }
  }

  // Update profile
  const fullName = body.name
    ? `${body.name.givenName ?? ''} ${body.name.familyName ?? ''}`.trim()
    : body.displayName;

  if (fullName) {
    await admin.from('user_profiles').upsert(
      {
        user_id: userId,
        organization_id: orgId,
        full_name: fullName,
      },
      { onConflict: 'user_id' },
    );

    await admin.auth.admin.updateUserById(userId, {
      user_metadata: { full_name: fullName },
    });
  }

  await logActivity(orgId, 'system', 'update', 'member', {
    entityId: userId,
    details: { source: 'scim', changes: body },
  });

  const user = await getUser(orgId, userId, baseUrl);
  if (!user) {
    return {
      error: scimError('404', 'User not found after update'),
      status: 404,
    };
  }

  return { user };
}

export async function deleteUser(
  orgId: string,
  userId: string,
): Promise<{ ok: true } | { error: ScimError; status: number }> {
  const admin = createSupabaseAdminClient();

  const { data: member } = await admin
    .from('org_members')
    .select('user_id')
    .eq('organization_id', orgId)
    .eq('user_id', userId)
    .maybeSingle();

  if (!member) {
    return { error: scimError('404', 'User not found'), status: 404 };
  }

  await admin
    .from('org_members')
    .delete()
    .eq('organization_id', orgId)
    .eq('user_id', userId);

  await logActivity(orgId, 'system', 'delete', 'member', {
    entityId: userId,
    details: { source: 'scim', reason: 'deleted' },
  });

  return { ok: true };
}

// ─── Groups ─────────────────────────────────────────────

export async function listGroups(
  orgId: string,
  baseUrl: string,
  params: { startIndex?: number; count?: number },
): Promise<ScimListResponse<ScimGroup>> {
  const admin = createSupabaseAdminClient();
  const startIndex = Math.max(1, params.startIndex ?? 1);
  const count = Math.min(100, Math.max(1, params.count ?? 100));

  const { data: groups, count: totalCount } = await admin
    .from('scim_groups')
    .select('*', { count: 'exact' })
    .eq('organization_id', orgId)
    .range(startIndex - 1, startIndex - 1 + count - 1);

  const Resources: ScimGroup[] = [];
  for (const g of groups ?? []) {
    const { data: members } = await admin
      .from('scim_group_members')
      .select('user_id')
      .eq('group_id', g.id);

    Resources.push({
      schemas: [SCIM_SCHEMA_GROUP],
      id: g.id,
      displayName: g.display_name,
      members: members?.map((m: any) => ({ value: m.user_id })) ?? [],
      meta: {
        resourceType: 'Group',
        created: g.created_at,
        lastModified: g.updated_at ?? g.created_at,
        location: `${baseUrl}/scim/v2/Groups/${g.id}`,
      },
    });
  }

  return {
    schemas: [SCIM_SCHEMA_LIST],
    totalResults: totalCount ?? Resources.length,
    itemsPerPage: count,
    startIndex,
    Resources,
  };
}

export async function createGroup(
  orgId: string,
  body: any,
  baseUrl: string,
): Promise<{ group: ScimGroup } | { error: ScimError; status: number }> {
  const admin = createSupabaseAdminClient();

  if (!body.displayName) {
    return { error: scimError('400', 'displayName is required'), status: 400 };
  }

  const { data: group, error } = await admin
    .from('scim_groups')
    .insert({
      organization_id: orgId,
      display_name: body.displayName,
    })
    .select()
    .single();

  if (error) {
    return { error: scimError('500', error.message), status: 500 };
  }

  // Add members if provided
  if (body.members?.length) {
    const memberRows = body.members.map((m: any) => ({
      group_id: group.id,
      user_id: m.value,
    }));
    await admin.from('scim_group_members').insert(memberRows);
  }

  return {
    group: {
      schemas: [SCIM_SCHEMA_GROUP],
      id: group.id,
      displayName: group.display_name,
      members: body.members ?? [],
      meta: {
        resourceType: 'Group',
        created: group.created_at,
        lastModified: group.created_at,
        location: `${baseUrl}/scim/v2/Groups/${group.id}`,
      },
    },
  };
}

export async function patchGroup(
  orgId: string,
  groupId: string,
  body: any,
  baseUrl: string,
): Promise<{ group: ScimGroup } | { error: ScimError; status: number }> {
  const admin = createSupabaseAdminClient();

  const { data: group } = await admin
    .from('scim_groups')
    .select('*')
    .eq('id', groupId)
    .eq('organization_id', orgId)
    .maybeSingle();

  if (!group) {
    return { error: scimError('404', 'Group not found'), status: 404 };
  }

  for (const op of body.Operations ?? []) {
    if (op.op === 'add' && op.path === 'members') {
      const members = (op.value ?? []).map((m: any) => ({
        group_id: groupId,
        user_id: m.value,
      }));
      if (members.length) {
        await admin
          .from('scim_group_members')
          .upsert(members, { onConflict: 'group_id,user_id' });
      }
    } else if (op.op === 'remove' && op.path?.startsWith('members[')) {
      const valueMatch = op.path.match(/members\[value\s+eq\s+"([^"]+)"\]/);
      if (valueMatch) {
        await admin
          .from('scim_group_members')
          .delete()
          .eq('group_id', groupId)
          .eq('user_id', valueMatch[1]);
      }
    } else if (op.op === 'replace' && op.path === 'displayName') {
      await admin
        .from('scim_groups')
        .update({ display_name: op.value })
        .eq('id', groupId);
    }
  }

  // Return updated group
  const { data: updatedGroup } = await admin
    .from('scim_groups')
    .select('*')
    .eq('id', groupId)
    .maybeSingle();

  const { data: members } = await admin
    .from('scim_group_members')
    .select('user_id')
    .eq('group_id', groupId);

  return {
    group: {
      schemas: [SCIM_SCHEMA_GROUP],
      id: groupId,
      displayName: updatedGroup?.display_name ?? group.display_name,
      members: members?.map((m: any) => ({ value: m.user_id })) ?? [],
      meta: {
        resourceType: 'Group',
        created: group.created_at,
        lastModified: new Date().toISOString(),
        location: `${baseUrl}/scim/v2/Groups/${groupId}`,
      },
    },
  };
}

export async function deleteGroup(
  orgId: string,
  groupId: string,
): Promise<{ ok: true } | { error: ScimError; status: number }> {
  const admin = createSupabaseAdminClient();

  const { data: group } = await admin
    .from('scim_groups')
    .select('id')
    .eq('id', groupId)
    .eq('organization_id', orgId)
    .maybeSingle();

  if (!group) {
    return { error: scimError('404', 'Group not found'), status: 404 };
  }

  await admin.from('scim_group_members').delete().eq('group_id', groupId);
  await admin.from('scim_groups').delete().eq('id', groupId);

  return { ok: true };
}

// ─── Discovery ──────────────────────────────────────────

export function getServiceProviderConfig(baseUrl: string) {
  return {
    schemas: ['urn:ietf:params:scim:schemas:core:2.0:ServiceProviderConfig'],
    documentationUri: 'https://formaos.com.au/docs/scim',
    patch: { supported: true },
    bulk: { supported: false, maxOperations: 0, maxPayloadSize: 0 },
    filter: { supported: true, maxResults: 100 },
    changePassword: { supported: false },
    sort: { supported: false },
    etag: { supported: false },
    authenticationSchemes: [
      {
        type: 'oauthbearertoken',
        name: 'OAuth Bearer Token',
        description:
          'Authentication scheme using the OAuth Bearer Token Standard',
        specUri: 'https://www.rfc-editor.org/info/rfc6750',
        documentationUri: 'https://formaos.com.au/docs/scim#auth',
        primary: true,
      },
    ],
    meta: {
      resourceType: 'ServiceProviderConfig',
      location: `${baseUrl}/scim/v2/ServiceProviderConfig`,
    },
  };
}

export function getResourceTypes(baseUrl: string) {
  return [
    {
      schemas: ['urn:ietf:params:scim:schemas:core:2.0:ResourceType'],
      id: 'User',
      name: 'User',
      endpoint: '/Users',
      schema: SCIM_SCHEMA_USER,
      meta: {
        resourceType: 'ResourceType',
        location: `${baseUrl}/scim/v2/ResourceTypes/User`,
      },
    },
    {
      schemas: ['urn:ietf:params:scim:schemas:core:2.0:ResourceType'],
      id: 'Group',
      name: 'Group',
      endpoint: '/Groups',
      schema: SCIM_SCHEMA_GROUP,
      meta: {
        resourceType: 'ResourceType',
        location: `${baseUrl}/scim/v2/ResourceTypes/Group`,
      },
    },
  ];
}

// ─── Helpers ────────────────────────────────────────────

function mapToScimUser(
  authUser: any,
  member: any,
  profile: any,
  orgId: string,
  baseUrl: string,
): ScimUser {
  const fullName =
    profile?.full_name ?? authUser.user_metadata?.full_name ?? '';
  const parts = fullName.split(' ');
  const givenName = parts[0] ?? '';
  const familyName = parts.slice(1).join(' ') ?? '';

  return {
    schemas: [SCIM_SCHEMA_USER],
    id: authUser.id,
    userName: authUser.email ?? '',
    name: { givenName, familyName, formatted: fullName },
    displayName: fullName || authUser.email,
    emails: authUser.email
      ? [{ value: authUser.email, type: 'work', primary: true }]
      : [],
    active: true,
    meta: {
      resourceType: 'User',
      created: member.created_at ?? authUser.created_at,
      lastModified:
        member.updated_at ?? member.created_at ?? authUser.created_at,
      location: `${baseUrl}/scim/v2/Users/${authUser.id}`,
    },
  };
}

function scimError(status: string, detail: string): ScimError {
  return { schemas: [SCIM_SCHEMA_ERROR], status, detail };
}
