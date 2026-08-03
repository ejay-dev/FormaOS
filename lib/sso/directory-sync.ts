import { randomUUID } from 'crypto';
import type { User } from '@supabase/supabase-js';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { revokeAllSessions } from '@/lib/auth/session-revocation';
import { consoleShim } from '@/lib/monitoring/console-shim';
import { logIdentityEvent } from '@/lib/identity/audit';
import { upsertScimGroup, syncGroupMembership } from '@/lib/scim/scim-groups';
import type { DirectorySyncProvider } from '@/lib/sso/saml';
import {
  encodeIntegrationConfig,
  decodeIntegrationConfig,
} from '@/lib/integrations/config-crypto';

// v4-017: IdP access tokens (Azure/Okta/Google admin) are bearer
// credentials with directory-wide read on the customer's tenant.
// They were previously stored as plaintext JSON in
// directory_sync_configs.config — a single DB read (RLS bypass,
// pg_dump, backup exfil) hands the attacker every customer's admin
// directory. encodeIntegrationConfig wraps the value in an
// aes-256-gcm envelope keyed off INTEGRATION_CONFIG_SECRET; the
// envelope is stored as-is in JSONB, and decoded only when the
// sync engine needs to call the provider.
const SENSITIVE_CONFIG_KEYS = new Set([
  'accessToken',
  'access_token',
  'refreshToken',
  'refresh_token',
  'clientSecret',
  'client_secret',
  'privateKey',
  'private_key',
  'apiKey',
  'api_key',
]);

function redactSensitiveConfig(
  config: Record<string, unknown> | null | undefined,
): Record<string, unknown> {
  if (!config || typeof config !== 'object') return {};
  // If the value is an encrypted envelope, return a stub — the UI
  // only needs to know that a secret is configured, not its value.
  if ('__encrypted' in config && (config as { __encrypted?: unknown }).__encrypted === true) {
    return { __encrypted: true };
  }
  const redacted: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(config)) {
    redacted[key] = SENSITIVE_CONFIG_KEYS.has(key) ? '***' : value;
  }
  return redacted;
}

type DirectoryUser = {
  externalId: string;
  email: string;
  displayName: string;
  active: boolean;
  role?: 'owner' | 'admin' | 'member' | 'viewer' | 'auditor';
  groups?: string[];
};

type DirectoryGroup = {
  externalId: string;
  displayName: string;
  members: string[];
};

type DirectorySyncConfig = Record<string, unknown>;

interface AzureDirectoryUser {
  id?: string;
  displayName?: string;
  mail?: string;
  userPrincipalName?: string;
  accountEnabled?: boolean;
}

interface AzureDirectoryGroup {
  id?: string;
  displayName?: string;
}

interface OktaDirectoryUser {
  id?: string;
  profile?: { email?: string; displayName?: string };
  status?: string;
}

interface OktaDirectoryGroup {
  id?: string;
  profile?: { name?: string };
}

interface GoogleDirectoryUser {
  id?: string;
  name?: { fullName?: string };
  primaryEmail?: string;
  suspended?: boolean;
}

interface GoogleDirectoryGroup {
  id?: string;
  name?: string;
  email?: string;
}

async function fetchJson(url: string, token: string) {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Directory API failed with ${response.status}`);
  }

  return response.json();
}

async function fetchAzureDirectory(config: DirectorySyncConfig) {
  const accessToken = String(config.accessToken ?? '');
  const tenant = String(config.tenantId ?? '');
  const baseUrl =
    String(config.baseUrl ?? '').trim() || `https://graph.microsoft.com/v1.0`;
  if (!accessToken || !tenant) {
    throw new Error('Azure AD sync requires tenantId and accessToken');
  }

  const [usersPayload, groupsPayload] = await Promise.all([
    fetchJson(
      `${baseUrl}/users?$select=id,displayName,mail,userPrincipalName,accountEnabled`,
      accessToken,
    ),
    fetchJson(`${baseUrl}/groups?$select=id,displayName`, accessToken),
  ]);

  return {
    users: ((usersPayload.value ?? []) as Array<AzureDirectoryUser>).map(
      (user): DirectoryUser => ({
        externalId: user.id ?? '',
        email: (user.mail || user.userPrincipalName || '').toLowerCase(),
        displayName:
          user.displayName || user.mail || user.userPrincipalName || '',
        active: user.accountEnabled !== false,
      }),
    ),
    groups: ((groupsPayload.value ?? []) as Array<AzureDirectoryGroup>).map(
      (group): DirectoryGroup => ({
        externalId: group.id ?? '',
        displayName: group.displayName ?? '',
        members: [],
      }),
    ),
  };
}

async function fetchOktaDirectory(config: DirectorySyncConfig) {
  const accessToken = String(config.accessToken ?? '');
  const domain = String(config.domain ?? '');
  if (!accessToken || !domain) {
    throw new Error('Okta sync requires domain and accessToken');
  }
  const baseUrl = `https://${domain.replace(/^https?:\/\//, '')}/api/v1`;
  const [usersPayload, groupsPayload] = await Promise.all([
    fetchJson(`${baseUrl}/users`, accessToken),
    fetchJson(`${baseUrl}/groups`, accessToken),
  ]);

  return {
    users: (usersPayload as Array<OktaDirectoryUser>).map(
      (user): DirectoryUser => ({
        externalId: user.id ?? '',
        email: String(user.profile?.email ?? '').toLowerCase(),
        displayName:
          user.profile?.displayName ?? user.profile?.email ?? user.id ?? '',
        active: user.status !== 'DEPROVISIONED',
      }),
    ),
    groups: (groupsPayload as Array<OktaDirectoryGroup>).map(
      (group): DirectoryGroup => ({
        externalId: group.id ?? '',
        displayName: group.profile?.name ?? group.id ?? '',
        members: [],
      }),
    ),
  };
}

async function fetchGoogleWorkspaceDirectory(config: DirectorySyncConfig) {
  const accessToken = String(config.accessToken ?? '');
  const customer = String(config.customer ?? 'my_customer');
  if (!accessToken) {
    throw new Error('Google Workspace sync requires accessToken');
  }

  const [usersPayload, groupsPayload] = await Promise.all([
    fetchJson(
      `https://admin.googleapis.com/admin/directory/v1/users?customer=${encodeURIComponent(customer)}`,
      accessToken,
    ),
    fetchJson(
      `https://admin.googleapis.com/admin/directory/v1/groups?customer=${encodeURIComponent(customer)}`,
      accessToken,
    ),
  ]);

  return {
    users: ((usersPayload.users ?? []) as Array<GoogleDirectoryUser>).map(
      (user): DirectoryUser => ({
        externalId: user.id ?? '',
        email: String(user.primaryEmail ?? '').toLowerCase(),
        displayName: user.name?.fullName ?? user.primaryEmail ?? user.id ?? '',
        active: user.suspended !== true,
      }),
    ),
    groups: ((groupsPayload.groups ?? []) as Array<GoogleDirectoryGroup>).map(
      (group): DirectoryGroup => ({
        externalId: group.id ?? '',
        displayName: group.name ?? group.email ?? group.id ?? '',
        members: [],
      }),
    ),
  };
}

async function loadDirectorySnapshot(
  provider: DirectorySyncProvider,
  config: DirectorySyncConfig,
) {
  switch (provider) {
    case 'azure-ad':
      return fetchAzureDirectory(config);
    case 'okta':
      return fetchOktaDirectory(config);
    case 'google-workspace':
      return fetchGoogleWorkspaceDirectory(config);
    default:
      throw new Error(`Unsupported provider: ${provider satisfies never}`);
  }
}

// auth.admin.listUsers() defaults to page 1 / perPage 50, so an
// unpaginated call only ever sees the first 50 auth users — anyone
// past page 1 was reported as new, which made createUser() fail on a
// duplicate email and abort the entire sync run. Pages are pulled
// lazily and cached: a lookup only walks far enough to find its
// email, so a three-user directory on a project with thousands of
// auth users costs one page instead of the whole table, while a
// large directory degrades to the same full walk as before.
const AUTH_USER_PAGE_SIZE = 200;
const AUTH_USER_MAX_PAGES = 100;

function createAuthUserLookup() {
  const admin = createSupabaseAdminClient();
  const byEmail = new Map<string, User>();
  let nextPage = 1;
  let exhausted = false;

  async function loadNextPage() {
    const { data, error } = await admin.auth.admin.listUsers({
      page: nextPage,
      perPage: AUTH_USER_PAGE_SIZE,
    });

    if (error) {
      throw new Error(`Failed to list auth users: ${error.message}`);
    }

    const users = data?.users ?? [];
    for (const user of users) {
      const key = user.email?.toLowerCase();
      // First page wins so a user created earlier in this run is not
      // clobbered by a later page that already includes it.
      if (key && !byEmail.has(key)) byEmail.set(key, user);
    }

    nextPage += 1;
    if (users.length < AUTH_USER_PAGE_SIZE || nextPage > AUTH_USER_MAX_PAGES) {
      exhausted = true;
    }
  }

  return {
    async find(email: string): Promise<User | null> {
      const key = email.toLowerCase();
      const cached = byEmail.get(key);
      if (cached) return cached;

      while (!exhausted) {
        await loadNextPage();
        const match = byEmail.get(key);
        if (match) return match;
      }

      return null;
    },
    remember(email: string, user: User) {
      byEmail.set(email.toLowerCase(), user);
    },
  };
}

export async function upsertDirectorySyncConfig(args: {
  orgId: string;
  provider: DirectorySyncProvider;
  enabled: boolean;
  intervalMinutes: number;
  config: DirectorySyncConfig;
}) {
  const admin = createSupabaseAdminClient();
  const { error } = await admin.from('directory_sync_configs').upsert(
    {
      organization_id: args.orgId,
      provider: args.provider,
      enabled: args.enabled,
      interval_minutes: args.intervalMinutes,
      // v4-017: encrypt at rest. Decoded on demand by syncDirectory.
      config: encodeIntegrationConfig(args.config),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'organization_id,provider' },
  );

  if (error) {
    throw new Error(error.message);
  }
}

export async function getDirectorySyncStatus(orgId: string) {
  const admin = createSupabaseAdminClient();
  const [{ data: configs }, { data: runs }] = await Promise.all([
    admin
      .from('directory_sync_configs')
      .select('*')
      .eq('organization_id', orgId)
      .order('updated_at', { ascending: false }),
    admin
      .from('directory_sync_runs')
      .select('*')
      .eq('organization_id', orgId)
      .order('started_at', { ascending: false })
      .limit(10),
  ]);

  // v4-017: never return raw config to the UI/API. Either the row
  // is already encrypted (we surface only an `__encrypted: true`
  // marker) or it's legacy plaintext (we redact accessToken-style
  // keys to '***'). The UI relies on the marker to render
  // "Configured" / "Not configured" badges without showing tokens.
  const redactedConfigs = (configs ?? []).map((row) => ({
    ...row,
    config: redactSensitiveConfig(
      (row as { config?: Record<string, unknown> | null }).config,
    ),
  }));

  return {
    configs: redactedConfigs,
    runs: runs ?? [],
  };
}

/**
 * Load and decrypt the active directory-sync config for an org.
 * Used by the sync engine. Falls back to a plaintext row if a
 * legacy unencrypted row hasn't been re-saved yet — re-saving via
 * the settings UI rewrites it through encodeIntegrationConfig.
 */
export async function loadDirectorySyncConfig(
  orgId: string,
  provider: DirectorySyncProvider,
): Promise<DirectorySyncConfig | null> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from('directory_sync_configs')
    .select('config')
    .eq('organization_id', orgId)
    .eq('provider', provider)
    .maybeSingle();

  if (error || !data?.config) return null;
  return decodeIntegrationConfig<DirectorySyncConfig>(data.config);
}

export async function syncDirectory(
  orgId: string,
  provider: DirectorySyncProvider,
  config: DirectorySyncConfig,
) {
  const admin = createSupabaseAdminClient();
  const runId = randomUUID();
  const startedAt = new Date().toISOString();

  await admin.from('directory_sync_runs').insert({
    id: runId,
    organization_id: orgId,
    provider,
    status: 'running',
    started_at: startedAt,
  });

  await logIdentityEvent({
    eventType: 'directory.sync.started',
    actorType: 'system',
    orgId,
    result: 'success',
    metadata: { provider, run_id: runId },
  });

  try {
    const snapshot = await loadDirectorySnapshot(provider, config);
    const authUsers = createAuthUserLookup();

    let createdUsers = 0;
    let updatedUsers = 0;
    let deactivatedUsers = 0;

    for (const directoryUser of snapshot.users) {
      if (!directoryUser.email) continue;

      const emailKey = directoryUser.email.toLowerCase();
      let user = await authUsers.find(emailKey);
      if (!user) {
        const created = await admin.auth.admin.createUser({
          email: directoryUser.email,
          email_confirm: true,
          password: `${randomUUID()}${randomUUID()}`,
          user_metadata: {
            full_name: directoryUser.displayName,
            directory_managed: true,
            directory_provider: provider,
          },
        });
        if (created.error || !created.data.user) {
          throw new Error(
            created.error?.message ?? 'Failed to create synced user',
          );
        }
        user = created.data.user;
        authUsers.remember(emailKey, user);
        createdUsers += 1;
      } else {
        await admin.auth.admin.updateUserById(user.id, {
          user_metadata: {
            ...(user.user_metadata ?? {}),
            full_name: directoryUser.displayName,
            directory_managed: true,
            directory_provider: provider,
          },
        });
        updatedUsers += 1;
      }

      await admin.from('org_members').upsert(
        {
          organization_id: orgId,
          user_id: user.id,
          role: directoryUser.role ?? 'member',
          compliance_status: directoryUser.active ? 'active' : 'inactive',
        },
        { onConflict: 'organization_id,user_id' },
      );

      await admin.from('user_profiles').upsert(
        {
          user_id: user.id,
          organization_id: orgId,
          full_name: directoryUser.displayName,
        },
        { onConflict: 'user_id' },
      );

      if (!directoryUser.active) {
        deactivatedUsers += 1;
        // Deactivation must also revoke live sessions — marking the member
        // inactive blocks new access checks, but an already-issued token
        // would otherwise keep working until expiry.
        try {
          await revokeAllSessions(user.id, { reason: 'directory_sync_deactivate' });
        } catch (err) {
          consoleShim.error('[DirectorySync] session revoke failed', err);
        }
      }
    }

    for (const group of snapshot.groups) {
      const scimGroup = await upsertScimGroup({
        orgId,
        displayName: group.displayName,
        externalId: group.externalId,
      });

      const memberIds: string[] = [];
      for (const email of group.members) {
        const user = await authUsers.find(email);
        if (user) {
          memberIds.push(user.id);
        }
      }

      await syncGroupMembership({
        orgId,
        groupId: scimGroup.id,
        members: memberIds.map((id) => ({ value: id, type: 'User' })),
      });
    }

    const summary = {
      createdUsers,
      updatedUsers,
      deactivatedUsers,
      groupsSynced: snapshot.groups.length,
    };

    await admin
      .from('directory_sync_runs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        summary,
      })
      .eq('id', runId);

    await admin
      .from('directory_sync_configs')
      .update({
        last_sync_at: new Date().toISOString(),
        last_sync_status: 'completed',
        last_error: null,
      })
      .eq('organization_id', orgId)
      .eq('provider', provider);

    await logIdentityEvent({
      eventType: 'directory.sync.completed',
      actorType: 'system',
      orgId,
      result: 'success',
      metadata: { provider, run_id: runId, summary },
    });

    return { runId, summary };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Directory sync failed';
    await admin
      .from('directory_sync_runs')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        error_message: message,
      })
      .eq('id', runId);
    await admin
      .from('directory_sync_configs')
      .update({
        last_sync_at: new Date().toISOString(),
        last_sync_status: 'failed',
        last_error: message,
      })
      .eq('organization_id', orgId)
      .eq('provider', provider);

    await logIdentityEvent({
      eventType: 'directory.sync.failed',
      actorType: 'system',
      orgId,
      result: 'failure',
      metadata: { provider, run_id: runId, error: message },
    });

    throw error;
  }
}
