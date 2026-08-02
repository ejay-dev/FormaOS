import { createHash } from 'crypto';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { revokeAllSessions } from '@/lib/auth/session-revocation';
import { consoleShim } from '@/lib/monitoring/console-shim';
import {
  getGroupMembers,
  inferRoleMapping,
  syncGroupMembership,
  syncGroupRoleAssignments,
  upsertScimGroup,
  type GroupMemberInput,
} from '@/lib/scim/scim-groups';
import {
  SCIM_ENTERPRISE_USER_EXTENSION,
  SCIM_SCHEMA_BULK,
  SCIM_SCHEMA_BULK_RESPONSE,
  SCIM_SCHEMA_ERROR,
  SCIM_SCHEMA_GROUP,
  SCIM_SCHEMA_LIST,
  SCIM_SCHEMA_PATCH,
  SCIM_SCHEMA_USER,
} from '@/lib/scim/scim-schemas';
import { scimError, type ScimErrorBody } from '@/lib/scim/scim-auth';

interface ScimPatchOperation {
  op: string;
  path?: string;
  value?: unknown;
}

interface ScimGroupMemberJoinRow {
  user_id: string;
  scim_groups:
    | { id: string; organization_id: string; display_name: string | null }
    | Array<{
        id: string;
        organization_id: string;
        display_name: string | null;
      }>;
}

interface ScimGroupRow {
  id: string;
  external_id: string | null;
  display_name: string;
  created_at: string;
  updated_at: string;
}

type OrgMemberRole = 'owner' | 'admin' | 'member' | 'viewer' | 'auditor';

export interface ScimMeta {
  resourceType: 'User' | 'Group';
  created: string;
  lastModified: string;
  location: string;
  version: string;
}

export interface ScimUser {
  schemas: string[];
  id: string;
  externalId?: string;
  userName: string;
  name?: { givenName?: string; familyName?: string; formatted?: string };
  displayName?: string;
  active: boolean;
  emails?: Array<{ value: string; type?: string; primary?: boolean }>;
  groups?: Array<{ value: string; display?: string; type?: string }>;
  [SCIM_ENTERPRISE_USER_EXTENSION]?: {
    department?: string | null;
    organization?: string | null;
    manager?: { value?: string | null; displayName?: string | null };
  };
  meta: ScimMeta;
}

export interface ScimGroup {
  schemas: string[];
  id: string;
  externalId?: string;
  displayName: string;
  members?: Array<{ value: string; display?: string; type?: string }>;
  meta: ScimMeta;
}

export interface ScimListResponse<T> {
  schemas: string[];
  totalResults: number;
  itemsPerPage: number;
  startIndex: number;
  Resources: T[];
}

export interface ScimOperationResult<T> {
  status: number;
  data?: T;
  error?: ScimErrorBody;
}

export interface BulkRequestOperation {
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  bulkId?: string;
  data?: Record<string, unknown>;
  version?: string;
}

export interface ScimFilterNode {
  attribute: string;
  operator: 'eq' | 'ne' | 'co' | 'sw' | 'ew' | 'gt' | 'lt' | 'ge' | 'le' | 'pr';
  value?: string;
}

type RawOrgMember = {
  user_id: string;
  role: string | null;
  department?: string | null;
  compliance_status?: string | null;
  created_at: string;
  profiles?: {
    full_name?: string | null;
    phone?: string | null;
    updated_at?: string | null;
  } | null;
  organizations?: {
    name?: string | null;
  } | null;
};

function hashPayload(value: unknown) {
  const payload = JSON.stringify(value);
  return `W/"${createHash('sha1').update(payload).digest('hex')}"`;
}

function resolveScimPath(
  baseUrl: string,
  resourceType: 'Users' | 'Groups',
  id: string,
) {
  return `${baseUrl}/api/scim/v2/${resourceType}/${id}`;
}

function splitName(fullName: string) {
  const trimmed = fullName.trim();
  if (!trimmed) {
    return { givenName: '', familyName: '', formatted: '' };
  }

  const parts = trimmed.split(/\s+/);
  return {
    givenName: parts[0] ?? '',
    familyName: parts.slice(1).join(' '),
    formatted: trimmed,
  };
}

async function buildUserLookup(orgId: string) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from('org_members')
    .select(
      'user_id, role, department, compliance_status, created_at, profiles:user_profiles(full_name, phone, updated_at), organizations:organizations(name)',
    )
    .eq('organization_id', orgId);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as RawOrgMember[];
}

async function loadUserResources(
  orgId: string,
  baseUrl: string,
): Promise<ScimUser[]> {
  const admin = createSupabaseAdminClient();
  const members = await buildUserLookup(orgId);
  const groupsByUser = await getUserGroups(orgId);
  const resources: ScimUser[] = [];

  for (const member of members) {
    const { data } = await admin.auth.admin.getUserById(member.user_id);
    const authUser = data?.user;
    if (!authUser) continue;

    const fullName =
      member.profiles?.full_name ??
      (authUser.user_metadata?.full_name as string | undefined) ??
      (authUser.user_metadata?.name as string | undefined) ??
      '';
    const name = splitName(fullName);
    const groups = groupsByUser.get(member.user_id) ?? [];
    const lastModified =
      member.profiles?.updated_at ??
      (authUser.updated_at as string | undefined) ??
      member.created_at;

    const resource: Omit<ScimUser, 'meta'> = {
      schemas: [SCIM_SCHEMA_USER, SCIM_ENTERPRISE_USER_EXTENSION],
      id: authUser.id,
      externalId:
        (authUser.app_metadata?.provider_id as string | undefined) ?? undefined,
      userName: authUser.email ?? '',
      name,
      displayName: fullName || (authUser.email ?? ''),
      active: member.compliance_status !== 'inactive',
      emails: authUser.email
        ? [{ value: authUser.email, type: 'work', primary: true }]
        : [],
      groups,
      [SCIM_ENTERPRISE_USER_EXTENSION]: {
        department: member.department ?? null,
        organization: member.organizations?.name ?? null,
      },
    };

    resources.push({
      ...resource,
      meta: {
        resourceType: 'User',
        created: member.created_at,
        lastModified,
        location: resolveScimPath(baseUrl, 'Users', authUser.id),
        version: hashPayload(resource),
      },
    });
  }

  return resources;
}

async function getUserGroups(orgId: string) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from('scim_group_members')
    .select('user_id, scim_groups!inner(id, organization_id, display_name)')
    .eq('scim_groups.organization_id', orgId);

  if (error) {
    return new Map<
      string,
      Array<{ value: string; display?: string; type?: string }>
    >();
  }

  const grouped = new Map<
    string,
    Array<{ value: string; display?: string; type?: string }>
  >();
  for (const row of (data ?? []) as Array<ScimGroupMemberJoinRow>) {
    const group = Array.isArray(row.scim_groups)
      ? row.scim_groups[0]
      : row.scim_groups;
    if (!group?.id || !row.user_id) continue;
    const list = grouped.get(row.user_id) ?? [];
    list.push({
      value: group.id,
      display: group.display_name ?? undefined,
      type: 'direct',
    });
    grouped.set(row.user_id, list);
  }
  return grouped;
}

async function loadGroupResources(
  orgId: string,
  baseUrl: string,
): Promise<ScimGroup[]> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from('scim_groups')
    .select('*')
    .eq('organization_id', orgId)
    .order('display_name', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const resources: ScimGroup[] = [];

  for (const row of (data ?? []) as Array<ScimGroupRow>) {
    const members = await getGroupMembers(row.id);
    const resource: Omit<ScimGroup, 'meta'> = {
      schemas: [SCIM_SCHEMA_GROUP],
      id: row.id,
      externalId: row.external_id ?? undefined,
      displayName: row.display_name,
      members: members.map((member) => ({
        value: member.value,
        display: member.display,
        type: member.type ?? 'User',
      })),
    };

    resources.push({
      ...resource,
      meta: {
        resourceType: 'Group',
        created: row.created_at,
        lastModified: row.updated_at ?? row.created_at,
        location: resolveScimPath(baseUrl, 'Groups', row.id),
        version: hashPayload(resource),
      },
    });
  }

  return resources;
}

function resolveAttributeValue(
  record: Record<string, unknown>,
  attribute: string,
): unknown {
  const normalized = attribute.toLowerCase();
  const direct = record[attribute];
  if (typeof direct !== 'undefined') {
    return direct;
  }

  switch (normalized) {
    case 'username':
      return record.userName;
    case 'displayname':
      return record.displayName;
    case 'active':
      return record.active;
    case 'emails.value':
      return Array.isArray(record.emails)
        ? (record.emails as Array<{ value?: string }>)
            .map((entry) => entry.value)
            .join(' ')
        : undefined;
    case 'name.givenname':
      return (record.name as Record<string, unknown> | undefined)?.givenName;
    case 'name.familyname':
      return (record.name as Record<string, unknown> | undefined)?.familyName;
    case 'meta.lastmodified':
      return (record.meta as Record<string, unknown> | undefined)?.lastModified;
    default:
      return undefined;
  }
}

function compareValues(
  left: unknown,
  right: string | undefined,
  operator: ScimFilterNode['operator'],
) {
  const normalizedLeft =
    typeof left === 'string'
      ? left.toLowerCase()
      : left instanceof Date
        ? left.toISOString()
        : left;
  const normalizedRight = right?.toLowerCase();

  if (operator === 'pr') {
    if (Array.isArray(left)) return left.length > 0;
    return (
      left !== null && typeof left !== 'undefined' && String(left).length > 0
    );
  }

  if (typeof normalizedLeft === 'boolean') {
    const booleanRight = normalizedRight === 'true';
    if (operator === 'eq') return normalizedLeft === booleanRight;
    if (operator === 'ne') return normalizedLeft !== booleanRight;
    return false;
  }

  if (typeof normalizedLeft === 'number') {
    const numberRight = Number(normalizedRight);
    if (Number.isNaN(numberRight)) return false;
    switch (operator) {
      case 'eq':
        return normalizedLeft === numberRight;
      case 'ne':
        return normalizedLeft !== numberRight;
      case 'gt':
        return normalizedLeft > numberRight;
      case 'lt':
        return normalizedLeft < numberRight;
      case 'ge':
        return normalizedLeft >= numberRight;
      case 'le':
        return normalizedLeft <= numberRight;
      default:
        return false;
    }
  }

  const leftString = String(normalizedLeft ?? '');
  const rightString = String(normalizedRight ?? '');

  switch (operator) {
    case 'eq':
      return leftString === rightString;
    case 'ne':
      return leftString !== rightString;
    case 'co':
      return leftString.includes(rightString);
    case 'sw':
      return leftString.startsWith(rightString);
    case 'ew':
      return leftString.endsWith(rightString);
    case 'gt':
      return leftString > rightString;
    case 'lt':
      return leftString < rightString;
    case 'ge':
      return leftString >= rightString;
    case 'le':
      return leftString <= rightString;
    default:
      return false;
  }
}

export function parseScimFilterExpression(
  filter?: string | null,
): ScimFilterNode[] {
  if (!filter?.trim()) return [];

  return filter
    .split(/\s+and\s+/i)
    .map((clause) => clause.trim())
    .filter(Boolean)
    .map((clause) => {
      const presenceMatch = clause.match(/^([A-Za-z0-9_.:$-]+)\s+pr$/i);
      if (presenceMatch) {
        return {
          attribute: presenceMatch[1],
          operator: 'pr' as const,
        };
      }

      const match = clause.match(
        /^([A-Za-z0-9_.:$-]+)\s+(eq|ne|co|sw|ew|gt|lt|ge|le)\s+"?([^"]+?)"?$/i,
      );

      if (!match) {
        throw new Error(`Unsupported SCIM filter clause: ${clause}`);
      }

      return {
        attribute: match[1],
        operator: match[2].toLowerCase() as ScimFilterNode['operator'],
        value: match[3],
      };
    });
}

export function applyScimFilter<T extends object>(
  records: T[],
  filter?: string | null,
): T[] {
  const nodes = parseScimFilterExpression(filter);
  if (!nodes.length) return records;

  return records.filter((record) =>
    nodes.every((node) => {
      const value = resolveAttributeValue(
        record as Record<string, unknown>,
        node.attribute,
      );
      return compareValues(value, node.value, node.operator);
    }),
  );
}

export function applyScimSort<T extends object>(
  records: T[],
  sortBy?: string | null,
  sortOrder?: string | null,
) {
  if (!sortBy) return records;
  const direction = sortOrder?.toLowerCase() === 'descending' ? -1 : 1;

  return [...records].sort((left, right) => {
    const leftValue = resolveAttributeValue(
      left as Record<string, unknown>,
      sortBy,
    );
    const rightValue = resolveAttributeValue(
      right as Record<string, unknown>,
      sortBy,
    );
    return (
      String(leftValue ?? '').localeCompare(String(rightValue ?? '')) *
      direction
    );
  });
}

function paginate<T>(
  records: T[],
  startIndex = 1,
  count = 100,
): ScimListResponse<T> {
  const safeStart = Math.max(1, startIndex);
  const safeCount = Math.min(100, Math.max(1, count));
  const start = safeStart - 1;
  const Resources = records.slice(start, start + safeCount);

  return {
    schemas: [SCIM_SCHEMA_LIST],
    totalResults: records.length,
    itemsPerPage: Resources.length,
    startIndex: safeStart,
    Resources,
  };
}

function ensureIfMatch(expected: string, ifMatchHeader?: string | null) {
  if (!ifMatchHeader) return null;
  if (ifMatchHeader === '*' || ifMatchHeader === expected) return null;
  return scimError(412, 'ETag does not match current resource version');
}

export async function listUsers(
  orgId: string,
  baseUrl: string,
  params: {
    startIndex?: number;
    count?: number;
    filter?: string | null;
    sortBy?: string | null;
    sortOrder?: string | null;
  },
): Promise<ScimListResponse<ScimUser>> {
  const resources = applyScimSort(
    applyScimFilter(await loadUserResources(orgId, baseUrl), params.filter),
    params.sortBy,
    params.sortOrder,
  );
  return paginate(resources, params.startIndex, params.count);
}

export async function getUser(
  orgId: string,
  userId: string,
  baseUrl: string,
): Promise<ScimUser | null> {
  const resources = await loadUserResources(orgId, baseUrl);
  return resources.find((resource) => resource.id === userId) ?? null;
}

function extractScimRole(input: Record<string, unknown>): string | null {
  const requestedRole =
    (input.role as string | undefined) ??
    (input.roles as Array<{ value?: string }> | undefined)?.[0]?.value;
  return typeof requestedRole === 'string' && requestedRole.trim()
    ? requestedRole
    : null;
}

function normalizeOrgMemberRole(requestedRole: string): OrgMemberRole {
  const normalized = requestedRole.toLowerCase();
  if (
    normalized === 'owner' ||
    normalized === 'admin' ||
    normalized === 'viewer' ||
    normalized === 'auditor'
  ) {
    return normalized;
  }
  return 'member';
}

function mapScimRole(input: Record<string, unknown>): OrgMemberRole {
  return normalizeOrgMemberRole(extractScimRole(input) ?? 'member');
}

function getPrimaryEmail(input: Record<string, unknown>) {
  if (typeof input.userName === 'string' && input.userName.includes('@')) {
    return input.userName.trim().toLowerCase();
  }

  const emails = input.emails as Array<{ value?: string }> | undefined;
  const email = emails?.find((entry) => entry.value)?.value;
  return typeof email === 'string' ? email.trim().toLowerCase() : null;
}

function getFullName(input: Record<string, unknown>) {
  const name = input.name as Record<string, unknown> | undefined;
  if (typeof name?.formatted === 'string' && name.formatted.trim()) {
    return name.formatted.trim();
  }

  const given =
    typeof name?.givenName === 'string' ? name.givenName.trim() : '';
  const family =
    typeof name?.familyName === 'string' ? name.familyName.trim() : '';
  const combined = `${given} ${family}`.trim();
  if (combined) return combined;

  return typeof input.displayName === 'string' ? input.displayName.trim() : '';
}

// auth.admin.listUsers() defaults to page 1 / perPage 50, so an
// unpaginated call only ever searches the first 50 auth users. Walk
// every page until a short page is returned, otherwise an existing
// user sorting past page 1 is treated as new and createUser() fails
// on the duplicate email — a permanent SCIM provisioning outage for
// that user.
const AUTH_USER_PAGE_SIZE = 200;
const AUTH_USER_MAX_PAGES = 100;

async function lookupUserByEmail(email: string) {
  const admin = createSupabaseAdminClient();
  const target = email.toLowerCase();

  for (let page = 1; page <= AUTH_USER_MAX_PAGES; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: AUTH_USER_PAGE_SIZE,
    });

    if (error) {
      throw new Error(`Failed to look up SCIM user: ${error.message}`);
    }

    const users = data?.users ?? [];
    const match = users.find(
      (user: { email?: string }) => user.email?.toLowerCase() === target,
    );
    if (match) return match;
    if (users.length < AUTH_USER_PAGE_SIZE) break;
  }

  return null;
}

export async function createUser(
  orgId: string,
  body: Record<string, unknown>,
  baseUrl: string,
): Promise<ScimOperationResult<ScimUser>> {
  const admin = createSupabaseAdminClient();
  const email = getPrimaryEmail(body);

  if (!email) {
    return {
      status: 400,
      error: scimError(
        400,
        'userName or emails[0].value is required',
        'invalidValue',
      ),
    };
  }

  let authUser: Awaited<ReturnType<typeof lookupUserByEmail>>;
  try {
    authUser = await lookupUserByEmail(email);
  } catch (error) {
    return {
      status: 500,
      error: scimError(
        500,
        error instanceof Error ? error.message : 'Failed to look up SCIM user',
      ),
    };
  }

  if (!authUser) {
    const created = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
      password: createHash('sha256')
        .update(`${orgId}:${email}:${Date.now()}`)
        .digest('hex'),
      user_metadata: {
        full_name: getFullName(body),
        scim_provisioned: true,
      },
    });

    if (created.error || !created.data.user) {
      return {
        status: 500,
        error: scimError(
          500,
          created.error?.message ?? 'Failed to provision user',
        ),
      };
    }

    authUser = created.data.user;
  }

  const membership = await admin.from('org_members').upsert(
    {
      organization_id: orgId,
      user_id: authUser.id,
      role: mapScimRole(body),
      department:
        (
          body[SCIM_ENTERPRISE_USER_EXTENSION] as
            | Record<string, unknown>
            | undefined
        )?.department ?? null,
      compliance_status: body.active === false ? 'inactive' : 'active',
    },
    { onConflict: 'organization_id,user_id' },
  );

  if (membership.error) {
    return {
      status: 500,
      error: scimError(500, membership.error.message),
    };
  }

  const fullName = getFullName(body);
  await admin.from('user_profiles').upsert(
    {
      user_id: authUser.id,
      organization_id: orgId,
      full_name: fullName || null,
    },
    { onConflict: 'user_id' },
  );

  const user = await getUser(orgId, authUser.id, baseUrl);
  if (!user) {
    return {
      status: 500,
      error: scimError(500, 'Provisioned user could not be loaded'),
    };
  }

  return { status: 201, data: user };
}

// Entra ID sends `active` as the strings "True"/"False" rather than a JSON
// boolean; downstream comparisons are strict (`payload.active === false`).
function normalizeScimActive(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'true') return true;
  if (normalized === 'false') return false;
  return value;
}

function applyUserPatchAttribute(
  next: Record<string, unknown>,
  attributePath: string,
  value: unknown,
) {
  switch (attributePath) {
    case 'displayName':
      next.displayName = value;
      return;
    case 'userName':
      next.userName = value;
      return;
    case 'active':
      next.active = normalizeScimActive(value);
      return;
    case 'name':
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        next.name = { ...(next.name as object), ...(value as object) };
      }
      return;
    case 'name.givenName':
      next.name = { ...(next.name as object), givenName: value };
      return;
    case 'name.familyName':
      next.name = { ...(next.name as object), familyName: value };
      return;
    case 'emails':
      next.emails = value;
      return;
    case `${SCIM_ENTERPRISE_USER_EXTENSION}:department`:
      next[SCIM_ENTERPRISE_USER_EXTENSION] = {
        ...(next[SCIM_ENTERPRISE_USER_EXTENSION] as object),
        department: value,
      };
      return;
    case SCIM_ENTERPRISE_USER_EXTENSION:
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        next[SCIM_ENTERPRISE_USER_EXTENSION] = {
          ...(next[SCIM_ENTERPRISE_USER_EXTENSION] as object),
          ...(value as object),
        };
      }
      return;
    default:
  }
}

function applyUserPatchDocument(
  current: ScimUser,
  body: Record<string, unknown>,
): Record<string, unknown> {
  if (!Array.isArray(body.Operations)) {
    return body;
  }

  const next: Record<string, unknown> = {
    userName: current.userName,
    displayName: current.displayName,
    active: current.active,
    name: current.name ?? {},
    emails: current.emails ?? [],
    [SCIM_ENTERPRISE_USER_EXTENSION]:
      current[SCIM_ENTERPRISE_USER_EXTENSION] ?? {},
  };

  for (const operation of body.Operations as ScimPatchOperation[]) {
    const op = String(operation.op ?? '').toLowerCase();
    const path = String(operation.path ?? '');
    if (op !== 'replace' && op !== 'add') continue;

    if (path) {
      applyUserPatchAttribute(next, path, operation.value);
      continue;
    }

    // RFC 7644 §3.5.2: a path-less operation's value is an object whose keys
    // are attribute paths, not a scalar applied to every attribute.
    const { value } = operation;
    if (!value || typeof value !== 'object' || Array.isArray(value)) continue;
    for (const [attributePath, attributeValue] of Object.entries(
      value as Record<string, unknown>,
    )) {
      applyUserPatchAttribute(next, attributePath, attributeValue);
    }
  }

  return next;
}

export async function updateUser(
  orgId: string,
  userId: string,
  body: Record<string, unknown>,
  baseUrl: string,
  ifMatch?: string | null,
): Promise<ScimOperationResult<ScimUser>> {
  const admin = createSupabaseAdminClient();
  const current = await getUser(orgId, userId, baseUrl);
  if (!current) {
    return { status: 404, error: scimError(404, 'User not found') };
  }

  const etagError = ensureIfMatch(current.meta.version, ifMatch);
  if (etagError) {
    return { status: 412, error: etagError };
  }

  const payload =
    Array.isArray(body.schemas) && body.schemas.includes(SCIM_SCHEMA_PATCH)
      ? applyUserPatchDocument(current, body)
      : body;

  const email = getPrimaryEmail(payload) ?? current.userName;
  const fullName = getFullName(payload) || current.displayName || '';
  const department =
    (
      payload[SCIM_ENTERPRISE_USER_EXTENSION] as
        | Record<string, unknown>
        | undefined
    )?.department ??
    current[SCIM_ENTERPRISE_USER_EXTENSION]?.department ??
    null;

  // PUT carries `active` straight from the IdP, so it needs the same
  // "True"/"False" string normalisation the PATCH path applies.
  const nextActive = normalizeScimActive(payload.active);
  const membershipStatus = nextActive === false ? 'inactive' : 'active';

  // Only touch org_members.role when the request actually carries one — a
  // display-name or activation update must not demote an owner/admin.
  const requestedRole = extractScimRole(payload);
  const memberUpdate: Record<string, unknown> = {
    department,
    compliance_status: membershipStatus,
  };
  if (requestedRole) {
    memberUpdate.role = normalizeOrgMemberRole(requestedRole);
  }

  const [profileResult, memberResult, authResult] = await Promise.all([
    admin.from('user_profiles').upsert(
      {
        user_id: userId,
        organization_id: orgId,
        full_name: fullName || null,
      },
      { onConflict: 'user_id' },
    ),
    admin
      .from('org_members')
      .update(memberUpdate)
      .eq('organization_id', orgId)
      .eq('user_id', userId),
    admin.auth.admin.updateUserById(userId, {
      email,
      user_metadata: {
        full_name: fullName || null,
        scim_provisioned: true,
      },
    }),
  ]);

  if (profileResult.error || memberResult.error || authResult.error) {
    return {
      status: 500,
      error: scimError(
        500,
        profileResult.error?.message ??
          memberResult.error?.message ??
          authResult.error?.message ??
          'Failed to update user',
      ),
    };
  }

  // Deactivation is a deprovisioning event, not just a flag flip: an
  // already-issued token keeps working until expiry unless the session
  // watermark moves. Mirror deleteUser and revoke on the transition
  // only, so a repeated no-op push from the IdP doesn't keep bumping it.
  if (current.active && membershipStatus === 'inactive') {
    try {
      await revokeAllSessions(userId, { reason: 'scim_deprovision' });
    } catch (err) {
      consoleShim.error('[SCIM] updateUser: session revoke failed', err);
    }
  }

  const updated = await getUser(orgId, userId, baseUrl);
  if (!updated) {
    return {
      status: 404,
      error: scimError(404, 'User not found after update'),
    };
  }

  return { status: 200, data: updated };
}

export async function deleteUser(
  orgId: string,
  userId: string,
  baseUrl?: string,
  ifMatch?: string | null,
): Promise<ScimOperationResult<null>> {
  const current = baseUrl ? await getUser(orgId, userId, baseUrl) : null;
  if (baseUrl && !current) {
    return { status: 404, error: scimError(404, 'User not found') };
  }

  if (current) {
    const etagError = ensureIfMatch(current.meta.version, ifMatch);
    if (etagError) {
      return { status: 412, error: etagError };
    }
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from('org_members')
    .delete()
    .eq('organization_id', orgId)
    .eq('user_id', userId);

  if (error) {
    return { status: 500, error: scimError(500, error.message) };
  }

  // Deprovisioning must also cut off any live session: removing the
  // org_members row blocks new org access, but an already-issued token would
  // keep working until expiry. Revoke all sessions so the session-revocation
  // watermark (assertSessionNotRevoked) rejects them immediately.
  try {
    await revokeAllSessions(userId, { reason: 'scim_deprovision' });
  } catch (err) {
    consoleShim.error('[SCIM] deleteUser: session revoke failed', err);
  }

  return { status: 204, data: null };
}

export async function listGroups(
  orgId: string,
  baseUrl: string,
  params: {
    startIndex?: number;
    count?: number;
    filter?: string | null;
    sortBy?: string | null;
    sortOrder?: string | null;
  },
): Promise<ScimListResponse<ScimGroup>> {
  const resources = applyScimSort(
    applyScimFilter(await loadGroupResources(orgId, baseUrl), params.filter),
    params.sortBy,
    params.sortOrder,
  );
  return paginate(resources, params.startIndex, params.count);
}

export async function getGroup(
  orgId: string,
  groupId: string,
  baseUrl: string,
): Promise<ScimGroup | null> {
  const resources = await loadGroupResources(orgId, baseUrl);
  return resources.find((resource) => resource.id === groupId) ?? null;
}

function extractGroupMembers(body: Record<string, unknown>) {
  return ((body.members as GroupMemberInput[] | undefined) ?? []).map(
    (member) => ({
      value: member.value,
      display: member.display,
      type: member.type ?? 'User',
    }),
  );
}

export async function createGroup(
  orgId: string,
  body: Record<string, unknown>,
  baseUrl: string,
): Promise<ScimOperationResult<ScimGroup>> {
  const displayName = String(body.displayName ?? '').trim();
  if (!displayName) {
    return {
      status: 400,
      error: scimError(400, 'displayName is required', 'invalidValue'),
    };
  }

  try {
    const group = await upsertScimGroup({
      orgId,
      displayName,
      externalId: typeof body.externalId === 'string' ? body.externalId : null,
      roleMapping:
        typeof body.roleMapping === 'string'
          ? body.roleMapping
          : inferRoleMapping(displayName),
    });

    const members = extractGroupMembers(body);
    if (members.length) {
      await syncGroupMembership({ orgId, groupId: group.id, members });
    }

    const resource = await getGroup(orgId, group.id, baseUrl);
    if (!resource) {
      return {
        status: 500,
        error: scimError(500, 'Group was created but could not be loaded'),
      };
    }

    return { status: 201, data: resource };
  } catch (error) {
    return {
      status: 500,
      error: scimError(
        500,
        error instanceof Error ? error.message : 'Failed to create group',
      ),
    };
  }
}

function applyGroupPatchDocument(
  current: ScimGroup,
  body: Record<string, unknown>,
): Record<string, unknown> {
  if (!Array.isArray(body.Operations)) {
    return body;
  }

  const members = [...(current.members ?? [])];
  const next: Record<string, unknown> = {
    displayName: current.displayName,
    members,
  };

  for (const operation of body.Operations as ScimPatchOperation[]) {
    const op = String(operation.op ?? '').toLowerCase();
    const path = String(operation.path ?? '');
    if (
      (op === 'replace' || op === 'add') &&
      (!path || path === 'displayName')
    ) {
      next.displayName = operation.value;
      continue;
    }

    if ((op === 'replace' || op === 'add') && path === 'members') {
      next.members = Array.isArray(operation.value) ? operation.value : [];
      continue;
    }

    if (op === 'remove' && path.startsWith('members[')) {
      const match = path.match(/members\[value eq "([^"]+)"\]/i);
      if (match) {
        next.members = (next.members as Array<{ value: string }>).filter(
          (member) => member.value !== match[1],
        );
      }
    }
  }

  return next;
}

export async function updateGroup(
  orgId: string,
  groupId: string,
  body: Record<string, unknown>,
  baseUrl: string,
  ifMatch?: string | null,
): Promise<ScimOperationResult<ScimGroup>> {
  const current = await getGroup(orgId, groupId, baseUrl);
  if (!current) {
    return { status: 404, error: scimError(404, 'Group not found') };
  }

  const etagError = ensureIfMatch(current.meta.version, ifMatch);
  if (etagError) {
    return { status: 412, error: etagError };
  }

  const payload =
    Array.isArray(body.schemas) && body.schemas.includes(SCIM_SCHEMA_PATCH)
      ? applyGroupPatchDocument(current, body)
      : body;

  try {
    const admin = createSupabaseAdminClient();
    const displayName = String(
      payload.displayName ?? current.displayName,
    ).trim();
    const roleMapping =
      typeof payload.roleMapping === 'string'
        ? payload.roleMapping
        : inferRoleMapping(displayName);

    const { error } = await admin
      .from('scim_groups')
      .update({
        display_name: displayName,
        role_mapping: roleMapping,
        updated_at: new Date().toISOString(),
      })
      .eq('id', groupId)
      .eq('organization_id', orgId);

    if (error) {
      return { status: 500, error: scimError(500, error.message) };
    }

    await syncGroupMembership({
      orgId,
      groupId,
      members: extractGroupMembers(payload),
    });
    await syncGroupRoleAssignments(orgId, groupId);

    const updated = await getGroup(orgId, groupId, baseUrl);
    if (!updated) {
      return {
        status: 404,
        error: scimError(404, 'Group not found after update'),
      };
    }

    return { status: 200, data: updated };
  } catch (error) {
    return {
      status: 500,
      error: scimError(
        500,
        error instanceof Error ? error.message : 'Failed to update group',
      ),
    };
  }
}

export async function deleteGroup(
  orgId: string,
  groupId: string,
  baseUrl?: string,
  ifMatch?: string | null,
): Promise<ScimOperationResult<null>> {
  const current = baseUrl ? await getGroup(orgId, groupId, baseUrl) : null;
  if (baseUrl && !current) {
    return { status: 404, error: scimError(404, 'Group not found') };
  }

  if (current) {
    const etagError = ensureIfMatch(current.meta.version, ifMatch);
    if (etagError) {
      return { status: 412, error: etagError };
    }
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from('scim_groups')
    .delete()
    .eq('organization_id', orgId)
    .eq('id', groupId);

  if (error) {
    return { status: 500, error: scimError(500, error.message) };
  }

  return { status: 204, data: null };
}

export async function executeBulkOperations(
  orgId: string,
  baseUrl: string,
  requestBody: Record<string, unknown>,
): Promise<{
  status: number;
  body: {
    schemas: string[];
    Operations: Array<Record<string, unknown>>;
  };
}> {
  if (!Array.isArray(requestBody.Operations)) {
    return {
      status: 400,
      body: {
        schemas: [SCIM_SCHEMA_ERROR],
        Operations: [],
      },
    };
  }

  const failOnErrors = Number(requestBody.failOnErrors ?? 0);
  let failures = 0;
  const responses: Array<Record<string, unknown>> = [];

  for (const operation of requestBody.Operations as BulkRequestOperation[]) {
    let result: ScimOperationResult<ScimUser | ScimGroup | null>;
    const normalizedPath = operation.path.replace(/^\/+/, '');

    if (operation.method === 'POST' && normalizedPath === 'Users') {
      result = await createUser(orgId, operation.data ?? {}, baseUrl);
    } else if (
      operation.method === 'PUT' ||
      operation.method === 'PATCH' ||
      operation.method === 'DELETE'
    ) {
      const [resourceType, resourceId] = normalizedPath.split('/');
      if (resourceType === 'Users' && resourceId) {
        if (operation.method === 'DELETE') {
          result = await deleteUser(
            orgId,
            resourceId,
            baseUrl,
            operation.version,
          );
        } else {
          result = await updateUser(
            orgId,
            resourceId,
            operation.data ?? {},
            baseUrl,
            operation.version,
          );
        }
      } else if (resourceType === 'Groups' && resourceId) {
        if (operation.method === 'DELETE') {
          result = await deleteGroup(
            orgId,
            resourceId,
            baseUrl,
            operation.version,
          );
        } else {
          result = await updateGroup(
            orgId,
            resourceId,
            operation.data ?? {},
            baseUrl,
            operation.version,
          );
        }
      } else {
        result = {
          status: 400,
          error: scimError(
            400,
            `Unsupported bulk path: ${operation.path}`,
            'invalidPath',
          ),
        };
      }
    } else if (operation.method === 'POST' && normalizedPath === 'Groups') {
      result = await createGroup(orgId, operation.data ?? {}, baseUrl);
    } else {
      result = {
        status: 400,
        error: scimError(
          400,
          `Unsupported bulk method/path: ${operation.method} ${operation.path}`,
        ),
      };
    }

    if (result.error) {
      failures += 1;
      responses.push({
        method: operation.method,
        bulkId: operation.bulkId,
        status: String(result.status),
        response: result.error,
      });
    } else {
      responses.push({
        method: operation.method,
        bulkId: operation.bulkId,
        status: String(result.status),
        location:
          result.data?.meta?.location ??
          (normalizedPath.startsWith('Users')
            ? resolveScimPath(
                baseUrl,
                'Users',
                normalizedPath.split('/')[1] ?? '',
              )
            : undefined),
        response: result.data ?? null,
      });
    }

    if (failOnErrors > 0 && failures >= failOnErrors) {
      break;
    }
  }

  return {
    status: failures > 0 ? 400 : 200,
    body: {
      schemas: [SCIM_SCHEMA_BULK_RESPONSE],
      Operations: responses,
    },
  };
}

export function getSingleResourceHeaders(resource: {
  meta: { version: string };
}) {
  return {
    ETag: resource.meta.version,
  };
}

export function isScimPatch(body: Record<string, unknown>) {
  return (
    Array.isArray(body.schemas) && body.schemas.includes(SCIM_SCHEMA_PATCH)
  );
}

export function getScimContentHeaders(extra?: Record<string, string>) {
  return {
    'Content-Type': 'application/scim+json',
    ...extra,
  };
}

export function getBulkRequestSchema() {
  return SCIM_SCHEMA_BULK;
}

export function getScimErrorSchema() {
  return SCIM_SCHEMA_ERROR;
}
