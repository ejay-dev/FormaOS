import { randomUUID } from 'crypto';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { logIdentityEvent } from '@/lib/identity/audit';
import { upsertScimGroup, syncGroupMembership } from '@/lib/scim/scim-groups';
import type { DirectorySyncProvider } from '@/lib/sso/saml';

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

async function findUserByEmail(email: string) {
  const admin = createSupabaseAdminClient();
  const { data } = await admin.auth.admin.listUsers();
  return (
    data?.users?.find(
      (user: { email?: string }) =>
        user.email?.toLowerCase() === email.toLowerCase(),
    ) ?? null
  );
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
      config: args.config,
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

  return {
    configs: configs ?? [],
    runs: runs ?? [],
  };
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

    let createdUsers = 0;
    let updatedUsers = 0;
    let deactivatedUsers = 0;

    for (const directoryUser of snapshot.users) {
      if (!directoryUser.email) continue;

      let user = await findUserByEmail(directoryUser.email);
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
        const user = await findUserByEmail(email);
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
