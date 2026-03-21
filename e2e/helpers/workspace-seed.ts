import { randomUUID } from 'crypto';
import { createClient } from '@supabase/supabase-js';
import type { Page } from '@playwright/test';

import {
  E2EAuthBootstrapError,
  createMagicLinkSession,
  getTestCredentials,
  setPlaywrightSession,
} from './test-auth';
import { dismissProductTour } from './fixtures';

type SeedClient = ReturnType<typeof createClient>;

export type WorkspaceSeedContext = {
  admin: SeedClient;
  anon: SeedClient;
  userId: string;
  orgId: string;
  email: string;
  password: string;
};

type SeedTaskInput = {
  title: string;
  assignedTo?: string;
  status?: string;
  priority?: string;
  dueDate?: string | null;
};

type SeedEvidenceInput = {
  fileName: string;
  title?: string;
  taskId?: string | null;
  uploadedBy: string;
  verificationStatus?: 'pending' | 'verified' | 'rejected';
  mimeType?: string;
  content?: string;
};

type SecondaryUserOptions = {
  email?: string;
  password?: string;
  role?: 'owner' | 'admin' | 'member' | 'viewer';
  addMembership?: boolean;
};

type WorkspaceStateInput = {
  role?: 'owner' | 'admin' | 'member' | 'viewer';
  industry?: string | null;
  frameworks?: string[];
  onboardingCompleted?: boolean;
  currentStep?: number;
  completedSteps?: number[];
  organizationName?: string;
  planKey?: string;
  teamSize?: string;
  firstAction?: string | null;
};

const createdUserIds = new Set<string>();

function getFrameworkCodeForSlug(slug: string) {
  switch (slug) {
    case 'nist-csf':
      return 'NIST_CSF';
    case 'cis-controls':
      return 'CIS_CONTROLS';
    case 'soc2':
      return 'SOC2';
    case 'iso27001':
      return 'ISO27001';
    case 'gdpr':
      return 'GDPR';
    case 'hipaa':
      return 'HIPAA';
    case 'pci-dss':
      return 'PCIDSS';
    default:
      return slug.toUpperCase().replace(/[^A-Z0-9]+/g, '_');
  }
}

function extractMissingColumnName(message: string, table: string) {
  const escapedTable = table.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = message.match(
    new RegExp(`Could not find the '([^']+)' column of '${escapedTable}'`),
  );
  return match?.[1] ?? null;
}

async function insertWithSchemaTolerance(
  client: SeedClient,
  table: string,
  row: Record<string, any>,
) {
  const candidate = { ...row };
  const removableKeys = new Set(Object.keys(candidate));

  for (;;) {
    const { data, error } = await client
      .from(table)
      .insert(candidate)
      .select('*')
      .single();

    if (!error && data) {
      return { data, row: candidate };
    }

    const message = error?.message ?? '';
    const missingColumn = extractMissingColumnName(message, table);
    if (!missingColumn || !removableKeys.has(missingColumn)) {
      throw new Error(
        `Failed to seed ${table} row: ${error?.message ?? 'unknown error'}`,
      );
    }

    removableKeys.delete(missingColumn);
    delete candidate[missingColumn];
  }
}

async function updateWithSchemaTolerance(
  client: SeedClient,
  table: string,
  filters: Record<string, any>,
  patch: Record<string, any>,
) {
  const candidate = { ...patch };
  const removableKeys = new Set(Object.keys(candidate));

  for (;;) {
    let query = client.from(table).update(candidate);
    for (const [key, value] of Object.entries(filters)) {
      query = query.eq(key, value);
    }

    const { error } = await query;

    if (!error) {
      let selectQuery = client.from(table).select('*').limit(1);
      for (const [key, value] of Object.entries(filters)) {
        selectQuery = selectQuery.eq(key, value);
      }

      const { data } = await selectQuery.maybeSingle();
      return { data: (data as Record<string, any> | null) ?? null, patch: candidate };
    }

    const message = error?.message ?? '';
    const missingColumn = extractMissingColumnName(message, table);
    if (!missingColumn || !removableKeys.has(missingColumn)) {
      throw new Error(
        `Failed to update ${table} row: ${error?.message ?? 'unknown error'}`,
      );
    }

    removableKeys.delete(missingColumn);
    delete candidate[missingColumn];
  }
}

async function insertAuditLog(
  context: WorkspaceSeedContext,
  action: string,
  target: string,
  actorUserId: string,
  metadata: Record<string, any> = {},
) {
  const entityId =
    typeof metadata.entity_id === 'string' && metadata.entity_id.length > 0
      ? metadata.entity_id
      : null;

  await insertWithSchemaTolerance(context.admin, 'org_audit_logs', {
    organization_id: context.orgId,
    action,
    target,
    actor_email: context.email || actorUserId,
    entity_id: entityId,
    created_at: new Date().toISOString(),
  });
}

function resolveEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !anonKey || !serviceRoleKey) {
    throw new E2EAuthBootstrapError(
      'Workspace E2E seeding requires NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY.',
    );
  }

  return { url, anonKey, serviceRoleKey };
}

function createSeedClients() {
  const { url, anonKey, serviceRoleKey } = resolveEnv();
  return {
    admin: createClient(url, serviceRoleKey, {
      auth: { persistSession: false },
    }),
    anon: createClient(url, anonKey, {
      auth: { persistSession: false },
    }),
  };
}

export async function getWorkspaceSeedContext(): Promise<WorkspaceSeedContext> {
  const creds = await getTestCredentials();
  const { admin, anon } = createSeedClients();

  const signInResult = await anon.auth.signInWithPassword({
    email: creds.email,
    password: creds.password,
  });

  if (signInResult.error || !signInResult.data.user) {
    throw new Error(
      `Failed to resolve seeded workspace user: ${signInResult.error?.message ?? 'unknown error'}`,
    );
  }

  const userId = signInResult.data.user.id;
  const { data: membership, error: membershipError } = await admin
    .from('org_members')
    .select('organization_id')
    .eq('user_id', userId)
    .maybeSingle();

  if (membershipError || !membership?.organization_id) {
    throw new Error(
      `Failed to resolve organization membership for ${creds.email}: ${membershipError?.message ?? 'missing membership'}`,
    );
  }

  return {
    admin,
    anon,
    userId,
    orgId: membership.organization_id as string,
    email: creds.email,
    password: creds.password,
  };
}

export async function authenticateWorkspacePage(
  page: Page,
  email?: string,
) {
  const { url } = resolveEnv();
  const appBase = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
  const targetEmail = email ?? (await getWorkspaceSeedContext()).email;
  const session = await createMagicLinkSession(targetEmail);

  await setPlaywrightSession(page.context(), session, appBase);
  let bootstrapResponse: Awaited<ReturnType<Page['request']['post']>> | null = null;
  let bootstrapFailure: Error | null = null;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      bootstrapResponse = await page.request.post(`${appBase}/api/auth/bootstrap`, {
        headers: {
          'x-formaos-e2e': '1',
        },
      });

      if (bootstrapResponse.ok()) {
        bootstrapFailure = null;
        break;
      }

      const retryableStatus = bootstrapResponse.status() >= 500;
      if (!retryableStatus || attempt === 2) {
        throw new Error(`Workspace bootstrap failed with status ${bootstrapResponse.status()}`);
      }
    } catch (error) {
      bootstrapFailure =
        error instanceof Error ? error : new Error(String(error));
      if (attempt === 2) {
        break;
      }
    }

    await page.waitForTimeout(350 * (attempt + 1));
  }

  const bootstrapPayload = bootstrapResponse?.ok()
    ? ((await bootstrapResponse.json().catch(() => null)) as
        | { next?: string }
        | null)
    : null;
  const nextPath =
    typeof bootstrapPayload?.next === 'string' && bootstrapPayload.next.length > 0
      ? bootstrapPayload.next
      : '/app';

  await page.goto(nextPath, { waitUntil: 'domcontentloaded' });
  await dismissProductTour(page);

  const landedOnAuth = page.url().includes('/auth/');
  if (landedOnAuth && bootstrapFailure) {
    throw bootstrapFailure;
  }
  if (landedOnAuth && bootstrapResponse && !bootstrapResponse.ok()) {
    throw new Error(`Workspace bootstrap failed with status ${bootstrapResponse.status()}`);
  }

  return { appBase, projectRef: new URL(url).hostname.split('.')[0] };
}

export async function seedTask(
  context: WorkspaceSeedContext,
  input: SeedTaskInput,
) {
  const now = new Date().toISOString();
  const row = {
    organization_id: context.orgId,
    title: input.title,
    assigned_to: input.assignedTo ?? context.userId,
    status: input.status ?? 'pending',
    priority: input.priority ?? 'high',
    due_date: input.dueDate ?? now,
    created_at: now,
  };

  const { data, error } = await context.admin
    .from('org_tasks')
    .insert(row)
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(`Failed to seed task: ${error?.message ?? 'unknown error'}`);
  }

  return data as Record<string, any>;
}

export async function seedEvidence(
  context: WorkspaceSeedContext,
  input: SeedEvidenceInput,
) {
  const mimeType = input.mimeType ?? 'text/plain';
  const content =
    input.content ?? `FormaOS E2E artifact for ${input.fileName} @ ${Date.now()}`;
  const filePath = `${context.orgId}/e2e/${randomUUID()}-${input.fileName}`;

  const uploadResult = await context.admin.storage
    .from('evidence')
    .upload(filePath, Buffer.from(content, 'utf8'), {
      contentType: mimeType,
      upsert: true,
    });

  if (uploadResult.error) {
    throw new Error(`Failed to upload evidence fixture: ${uploadResult.error.message}`);
  }

  const row = {
    organization_id: context.orgId,
    task_id: input.taskId ?? null,
    title: input.title ?? input.fileName,
    file_name: input.fileName,
    file_path: filePath,
    uploaded_by: input.uploadedBy,
    verification_status: input.verificationStatus ?? 'pending',
    created_at: new Date().toISOString(),
  };

  const { data, row: insertedRow } = await insertWithSchemaTolerance(
    context.admin,
    'org_evidence',
    row,
  );

  return {
    ...insertedRow,
    ...((data as Record<string, any>) ?? {}),
  };
}

export async function completeTaskWithAudit(
  context: WorkspaceSeedContext,
  taskId: string,
  actorUserId = context.userId,
) {
  const { data: task } = await updateWithSchemaTolerance(
    context.admin,
    'org_tasks',
    { id: taskId, organization_id: context.orgId },
    { status: 'completed' },
  );

  await insertAuditLog(context, 'TASK_COMPLETED', `task:${taskId}`, actorUserId, {
    entity_type: 'task',
    entity_id: taskId,
    after_state: { status: 'completed' },
    reason: 'e2e_completion',
  });

  return task as Record<string, any>;
}

export async function verifyEvidenceWithAudit(
  context: WorkspaceSeedContext,
  evidenceId: string,
  status: 'verified' | 'rejected',
  actorUserId = context.userId,
  reason = 'e2e_verification',
) {
  const now = new Date().toISOString();
  const { data: evidence } = await updateWithSchemaTolerance(
    context.admin,
    'org_evidence',
    { id: evidenceId, organization_id: context.orgId },
    {
      verification_status: status,
      verified_by: actorUserId,
      verified_at: now,
    },
  );

  await insertAuditLog(
    context,
    status === 'verified' ? 'EVIDENCE_VERIFIED' : 'EVIDENCE_REJECTED',
    `evidence:${evidenceId}`,
    actorUserId,
    {
      entity_type: 'evidence',
      entity_id: evidenceId,
      after_state: { verification_status: status },
      reason,
    },
  );

  return evidence as Record<string, any>;
}

export async function seedVersionedArtifact(
  context: WorkspaceSeedContext,
  evidenceId: string,
  fileName: string,
) {
  const now = new Date().toISOString();
  const fileMetadataId = randomUUID();
  const versionOnePath = `${context.orgId}/e2e/${randomUUID()}-${fileName}`;
  const versionTwoPath = `${context.orgId}/e2e/${randomUUID()}-v2-${fileName}`;

  await Promise.all([
    context.admin.storage
      .from('evidence')
      .upload(versionOnePath, Buffer.from('version-one', 'utf8'), {
        contentType: 'text/plain',
        upsert: true,
      }),
    context.admin.storage
      .from('evidence')
      .upload(versionTwoPath, Buffer.from('version-two', 'utf8'), {
        contentType: 'text/plain',
        upsert: true,
      }),
  ]);

  await context.admin.from('file_metadata').insert({
    id: fileMetadataId,
    organization_id: context.orgId,
    entity_type: 'evidence',
    entity_id: evidenceId,
    file_name: fileName,
    current_version: 2,
    total_versions: 2,
    created_at: now,
    updated_at: now,
  });

  await context.admin.from('file_versions').insert([
    {
      file_id: fileMetadataId,
      version_number: 1,
      file_name: fileName,
      file_path: versionOnePath,
      file_size: 11,
      mime_type: 'text/plain',
      uploaded_by: context.userId,
      change_summary: 'Initial upload',
      checksum: Buffer.from('version-one', 'utf8').toString('hex').slice(0, 64),
      created_at: now,
    },
    {
      file_id: fileMetadataId,
      version_number: 2,
      file_name: fileName,
      file_path: versionTwoPath,
      file_size: 11,
      mime_type: 'text/plain',
      uploaded_by: context.userId,
      change_summary: 'Revision',
      checksum: Buffer.from('version-two', 'utf8').toString('hex').slice(0, 64),
      created_at: new Date(Date.now() + 1000).toISOString(),
    },
  ]);

  await insertAuditLog(context, 'EVIDENCE_VERSIONED', `evidence:${evidenceId}`, context.userId, {
    entity_type: 'evidence',
    entity_id: evidenceId,
    total_versions: 2,
  });

  return {
    fileMetadataId,
    versionCount: 2,
    latestPath: versionTwoPath,
  };
}

export async function ensureTeamPlanAccess(context: WorkspaceSeedContext) {
  const now = new Date().toISOString();
  const { data: subscription } = await context.admin
    .from('org_subscriptions')
    .select('id')
    .eq('organization_id', context.orgId)
    .maybeSingle();

  if (subscription?.id) {
    await context.admin
      .from('org_subscriptions')
      .update({
        plan_key: 'pro',
        status: 'active',
        updated_at: now,
      })
      .eq('id', subscription.id);
  } else {
    await context.admin.from('org_subscriptions').insert({
      organization_id: context.orgId,
      plan_key: 'pro',
      status: 'active',
      created_at: now,
      updated_at: now,
    });
  }

  const entitlementRows = [
    {
      organization_id: context.orgId,
      feature_key: 'team_limit',
      enabled: true,
      limit_value: 75,
      updated_at: now,
    },
    {
      organization_id: context.orgId,
      feature_key: 'team',
      enabled: true,
      limit_value: null,
      updated_at: now,
    },
  ];

  for (const row of entitlementRows) {
    const { data: existing } = await context.admin
      .from('org_entitlements')
      .select('id')
      .eq('organization_id', row.organization_id)
      .eq('feature_key', row.feature_key)
      .maybeSingle();

    if (existing?.id) {
      await context.admin
        .from('org_entitlements')
        .update({
          enabled: row.enabled,
          limit_value: row.limit_value,
          updated_at: row.updated_at,
        })
        .eq('id', existing.id);
    } else {
      await context.admin.from('org_entitlements').insert({
        ...row,
        created_at: now,
      });
    }
  }
}

export async function ensureFrameworkScore(
  context: WorkspaceSeedContext,
  frameworkSlug: string,
  complianceScore: number,
) {
  const now = new Date().toISOString();
  const frameworkCode = getFrameworkCodeForSlug(frameworkSlug);
  let { data: complianceFramework, error } = await context.admin
    .from('compliance_frameworks')
    .select('id')
    .eq('code', frameworkCode)
    .maybeSingle();

  if (!complianceFramework?.id) {
    const insertResult = await context.admin
      .from('compliance_frameworks')
      .insert({
        code: frameworkCode,
        title: frameworkCode,
        description: `E2E seeded framework ${frameworkSlug}`,
        created_at: now,
      })
      .select('id')
      .single();
    complianceFramework = insertResult.data as { id: string } | null;
    error = insertResult.error;
  }

  if (error || !complianceFramework?.id) {
    throw new Error(`Framework ${frameworkSlug} not found for E2E seeding`);
  }

  const { data: org } = await context.admin
    .from('organizations')
    .select('frameworks')
    .eq('id', context.orgId)
    .maybeSingle();

  const currentFrameworks = Array.isArray(org?.frameworks) ? org.frameworks : [];
  const mergedFrameworks = Array.from(
    new Set([...currentFrameworks.map((value: unknown) => String(value)), frameworkSlug]),
  );

  await context.admin
    .from('organizations')
    .update({ frameworks: mergedFrameworks })
    .eq('id', context.orgId);

  const { data: existingFrameworkLink } = await context.admin
    .from('org_frameworks')
    .select('id')
    .eq('organization_id', context.orgId)
    .eq('framework_slug', frameworkSlug)
    .maybeSingle();

  if (existingFrameworkLink?.id) {
    await context.admin
      .from('org_frameworks')
      .update({ enabled_at: now })
      .eq('id', existingFrameworkLink.id);
  } else {
    await context.admin.from('org_frameworks').insert({
      organization_id: context.orgId,
      framework_slug: frameworkSlug,
      enabled_at: now,
    });
  }

  const evaluationRow = {
    organization_id: context.orgId,
    control_type: 'framework',
    control_key: frameworkSlug,
    required: true,
    status: complianceScore >= 80 ? 'compliant' : 'in_progress',
    framework_id: complianceFramework.id,
    compliance_score: complianceScore,
    total_controls: 10,
    satisfied_controls: Math.max(0, Math.round((complianceScore / 100) * 10)),
    missing_controls: Math.max(0, 10 - Math.round((complianceScore / 100) * 10)),
    evaluated_at: now,
    last_evaluated_at: now,
  };

  const { data: existingEvaluation } = await context.admin
    .from('org_control_evaluations')
    .select('id')
    .eq('organization_id', context.orgId)
    .eq('control_type', 'framework')
    .eq('control_key', frameworkSlug)
    .maybeSingle();

  let { error: insertError } = await context.admin
    .from('org_control_evaluations')
    .insert({
      ...evaluationRow,
      created_at: now,
    });

  if (
    insertError?.message?.includes('org_control_evaluations_org_control_key') &&
    existingEvaluation?.id
  ) {
    const { error: deleteError } = await context.admin
      .from('org_control_evaluations')
      .delete()
      .eq('id', existingEvaluation.id);

    if (!deleteError) {
      const retry = await context.admin
        .from('org_control_evaluations')
        .insert({
          ...evaluationRow,
          created_at: new Date(Date.now() + 1000).toISOString(),
        });
      insertError = retry.error;
    }
  }

  if (insertError) {
    throw new Error(
      `Failed to insert framework score for ${frameworkSlug}: ${insertError.message}`,
    );
  }

  return complianceFramework.id as string;
}

export async function createSecondaryUser(
  context: WorkspaceSeedContext,
  options: SecondaryUserOptions = {},
) {
  const email =
    options.email ??
    `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@test.formaos.local`;
  const password =
    options.password ??
    `TestPass${Math.random().toString(36).slice(2, 8)}!`;

  const { data, error } = await context.admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      is_e2e_test: true,
      created_at: new Date().toISOString(),
    },
  });

  if (error || !data.user) {
    throw new Error(`Failed to create secondary user: ${error?.message ?? 'unknown error'}`);
  }

  createdUserIds.add(data.user.id);

  if (options.addMembership) {
    const { error: membershipError } = await context.admin.from('org_members').insert({
      organization_id: context.orgId,
      user_id: data.user.id,
      role: options.role ?? 'member',
    });

    if (membershipError) {
      throw new Error(`Failed to create membership: ${membershipError.message}`);
    }
  }

  return {
    email,
    password,
    userId: data.user.id,
  };
}

export async function getInvitationByEmail(
  context: WorkspaceSeedContext,
  email: string,
) {
  const { data, error } = await context.admin
    .from('team_invitations')
    .select('*')
    .eq('organization_id', context.orgId)
    .eq('email', email.toLowerCase())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    throw new Error(`Failed to resolve invitation for ${email}: ${error?.message ?? 'not found'}`);
  }

  return data as Record<string, any>;
}

export async function getMemberByUserId(
  context: WorkspaceSeedContext,
  userId: string,
) {
  const { data, error } = await context.admin
    .from('org_members')
    .select('*')
    .eq('organization_id', context.orgId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data) {
    throw new Error(`Failed to resolve member ${userId}: ${error?.message ?? 'not found'}`);
  }

  return data as Record<string, any>;
}

export async function configureWorkspaceState(
  context: WorkspaceSeedContext,
  input: WorkspaceStateInput,
) {
  const now = new Date().toISOString();
  const completedSteps = Array.from(
    new Set((input.completedSteps ?? []).filter((step) => Number.isInteger(step))),
  ).sort((a, b) => a - b);
  const frameworks = Array.isArray(input.frameworks)
    ? Array.from(
        new Set(
          input.frameworks
            .map((value) => (typeof value === 'string' ? value.trim() : ''))
            .filter(Boolean),
        ),
      )
    : undefined;

  if (input.role) {
    const { error: membershipError } = await context.admin
      .from('org_members')
      .update({ role: input.role })
      .eq('organization_id', context.orgId)
      .eq('user_id', context.userId);

    if (membershipError) {
      throw new Error(`Failed to update workspace role: ${membershipError.message}`);
    }
  }

  const organizationPatch: Record<string, any> = {
    updated_at: now,
  };

  if (input.organizationName !== undefined) {
    organizationPatch.name = input.organizationName;
  }
  if (input.industry !== undefined) {
    organizationPatch.industry = input.industry;
  }
  if (input.planKey !== undefined) {
    organizationPatch.plan_key = input.planKey;
  }
  if (input.teamSize !== undefined) {
    organizationPatch.team_size = input.teamSize;
  }
  if (frameworks !== undefined) {
    organizationPatch.frameworks = frameworks;
  }
  if (input.onboardingCompleted !== undefined) {
    organizationPatch.onboarding_completed = input.onboardingCompleted;
    organizationPatch.onboarding_completed_at = input.onboardingCompleted
      ? now
      : null;
  }

  await updateWithSchemaTolerance(
    context.admin,
    'organizations',
    { id: context.orgId },
    organizationPatch,
  );

  if (frameworks !== undefined) {
    const { error: deleteFrameworkError } = await context.admin
      .from('org_frameworks')
      .delete()
      .eq('organization_id', context.orgId);

    if (deleteFrameworkError) {
      throw new Error(
        `Failed to reset organization frameworks: ${deleteFrameworkError.message}`,
      );
    }

    if (frameworks.length > 0) {
      const { error: insertFrameworkError } = await context.admin
        .from('org_frameworks')
        .insert(
          frameworks.map((frameworkSlug) => ({
            organization_id: context.orgId,
            framework_slug: frameworkSlug,
            enabled_at: now,
          })),
        );

      if (insertFrameworkError) {
        throw new Error(
          `Failed to seed organization frameworks: ${insertFrameworkError.message}`,
        );
      }
    }
  }

  if (
    input.currentStep !== undefined ||
    input.completedSteps !== undefined ||
    input.firstAction !== undefined ||
    input.onboardingCompleted !== undefined
  ) {
    const onboardingPatch = {
      organization_id: context.orgId,
      current_step: input.currentStep ?? 1,
      completed_steps: completedSteps,
      first_action:
        input.firstAction === undefined ? null : input.firstAction,
      completed_at: input.onboardingCompleted ? now : null,
      updated_at: now,
    };

    const { data: existingStatus } = await context.admin
      .from('org_onboarding_status')
      .select('organization_id')
      .eq('organization_id', context.orgId)
      .maybeSingle();

    if (existingStatus?.organization_id) {
      await updateWithSchemaTolerance(
        context.admin,
        'org_onboarding_status',
        { organization_id: context.orgId },
        onboardingPatch,
      );
    } else {
      await insertWithSchemaTolerance(
        context.admin,
        'org_onboarding_status',
        onboardingPatch,
      );
    }
  }
}

export async function cleanupSecondaryUsers() {
  const { admin } = createSeedClients();
  await Promise.all(
    Array.from(createdUserIds).map(async (userId) => {
      try {
        await admin.from('org_members').delete().eq('user_id', userId);
        await admin.auth.admin.deleteUser(userId);
      } catch {
        // best effort cleanup only
      }
    }),
  );
  createdUserIds.clear();
}
