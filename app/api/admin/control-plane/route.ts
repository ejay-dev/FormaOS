import { NextResponse } from 'next/server';
import { requireFounderAccess } from '@/app/app/admin/access';
import { handleAdminError } from '@/app/api/admin/_helpers';
import {
  enqueueAdminJob,
  getAdminControlPlaneSnapshot,
  runAdminJob,
  upsertFeatureFlag,
  upsertMarketingConfig,
  upsertSystemSetting,
  writeControlPlaneAudit,
  resolveControlPlaneEnvironment,
} from '@/lib/control-plane/server';

function asObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

async function handleAction(
  actorUserId: string,
  environment: string,
  action: string,
  payload: Record<string, unknown>,
) {
  if (action === 'set_feature_flag') {
    const flagKey = String(payload.flagKey ?? '').trim();
    const scopeType = String(payload.scopeType ?? 'global');
    const rawScopeId = isNonEmptyString(payload.scopeId) ? payload.scopeId.trim() : null;

    if (!flagKey) {
      return NextResponse.json({ error: 'flagKey is required' }, { status: 400 });
    }

    if (!['global', 'organization', 'user'].includes(scopeType)) {
      return NextResponse.json(
        { error: 'scopeType must be global, organization, or user' },
        { status: 400 },
      );
    }

    if (scopeType !== 'global' && !rawScopeId) {
      return NextResponse.json(
        { error: 'scopeId is required for organization and user scopes' },
        { status: 400 },
      );
    }

    const result = await upsertFeatureFlag({
      environment,
      actorUserId,
      flagKey,
      scopeType: scopeType as 'global' | 'organization' | 'user',
      scopeId: rawScopeId,
      enabled: Boolean(payload.enabled),
      killSwitch: Boolean(payload.killSwitch),
      rolloutPercentage: Number(payload.rolloutPercentage ?? 100),
      variants: asObject(payload.variants) as Record<string, number>,
      defaultVariant: isNonEmptyString(payload.defaultVariant)
        ? payload.defaultVariant.trim()
        : null,
      description: isNonEmptyString(payload.description)
        ? payload.description.trim()
        : null,
      isPublic: payload.isPublic !== false,
      startAt: isNonEmptyString(payload.startAt) ? payload.startAt : null,
      endAt: isNonEmptyString(payload.endAt) ? payload.endAt : null,
    });

    return NextResponse.json({ ok: true, featureFlag: result });
  }

  if (action === 'set_marketing_config') {
    const section = String(payload.section ?? '').trim();
    const configKey = String(payload.configKey ?? '').trim();

    if (!section || !configKey) {
      return NextResponse.json(
        { error: 'section and configKey are required' },
        { status: 400 },
      );
    }

    const result = await upsertMarketingConfig({
      environment,
      actorUserId,
      section,
      configKey,
      value: payload.value,
      description: isNonEmptyString(payload.description)
        ? payload.description.trim()
        : null,
    });

    return NextResponse.json({ ok: true, marketingConfig: result });
  }

  if (action === 'set_system_setting') {
    const category = String(payload.category ?? '').trim();
    const settingKey = String(payload.settingKey ?? '').trim();

    if (!category || !settingKey) {
      return NextResponse.json(
        { error: 'category and settingKey are required' },
        { status: 400 },
      );
    }

    const result = await upsertSystemSetting({
      environment,
      actorUserId,
      category,
      settingKey,
      value: payload.value,
      description: isNonEmptyString(payload.description)
        ? payload.description.trim()
        : null,
      eventType: isNonEmptyString(payload.eventType) ? payload.eventType : undefined,
    });

    return NextResponse.json({ ok: true, systemSetting: result });
  }

  if (action === 'set_integration_control') {
    const integrationKey = String(payload.integrationKey ?? '').trim();
    if (!integrationKey) {
      return NextResponse.json(
        { error: 'integrationKey is required' },
        { status: 400 },
      );
    }

    const currentSnapshot = await getAdminControlPlaneSnapshot({
      environment,
      auditLimit: 20,
      jobsLimit: 20,
    });

    const existing =
      currentSnapshot.integrations.find((entry) => entry.key === integrationKey)?.value ?? {
        enabled: true,
        connection_status: 'disconnected' as const,
        last_sync_at: null,
        last_error: null,
        error_logs: [],
        scopes: [],
        enabled_scopes: [],
        retry_requested_at: null,
      };

    const next = {
      ...existing,
      ...asObject(payload.value),
      error_logs: Array.isArray(asObject(payload.value).error_logs)
        ? asObject(payload.value).error_logs
        : existing.error_logs,
    };

    const result = await upsertSystemSetting({
      environment,
      actorUserId,
      category: 'integrations',
      settingKey: integrationKey,
      value: next,
      eventType: 'integration_control.updated',
    });

    return NextResponse.json({ ok: true, integrationSetting: result });
  }

  if (action === 'retry_integration') {
    const integrationKey = String(payload.integrationKey ?? '').trim();
    if (!integrationKey) {
      return NextResponse.json(
        { error: 'integrationKey is required' },
        { status: 400 },
      );
    }

    const currentSnapshot = await getAdminControlPlaneSnapshot({
      environment,
      auditLimit: 20,
      jobsLimit: 20,
    });

    const existing =
      currentSnapshot.integrations.find((entry) => entry.key === integrationKey)?.value ?? {
        enabled: true,
        connection_status: 'disconnected' as const,
        last_sync_at: null,
        last_error: null,
        error_logs: [],
        scopes: [],
        enabled_scopes: [],
        retry_requested_at: null,
      };

    const nextErrorLogs = [
      {
        at: new Date().toISOString(),
        message: 'Manual retry requested from Admin Control Plane',
      },
      ...existing.error_logs,
    ].slice(0, 20);

    const result = await upsertSystemSetting({
      environment,
      actorUserId,
      category: 'integrations',
      settingKey: integrationKey,
      value: {
        ...existing,
        connection_status: 'syncing',
        retry_requested_at: new Date().toISOString(),
        error_logs: nextErrorLogs,
      },
      eventType: 'integration_control.retry_requested',
    });

    return NextResponse.json({ ok: true, integrationSetting: result });
  }

  if (action === 'enqueue_job') {
    const jobType = String(payload.jobType ?? '').trim();
    if (!jobType) {
      return NextResponse.json({ error: 'jobType is required' }, { status: 400 });
    }

    const job = await enqueueAdminJob({
      environment,
      actorUserId,
      jobType,
      payload: asObject(payload.payload),
    });

    void runAdminJob(job.id, environment).catch((error) => {
      console.error('[control-plane] async job runner failed:', error);
    });

    return NextResponse.json({ ok: true, job });
  }

  if (action === 'run_job') {
    const jobId = String(payload.jobId ?? '').trim();
    if (!jobId) {
      return NextResponse.json({ error: 'jobId is required' }, { status: 400 });
    }

    const job = await runAdminJob(jobId, environment);
    return NextResponse.json({ ok: true, job });
  }

  return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
}

export async function GET(request: Request) {
  try {
    await requireFounderAccess();

    const { searchParams } = new URL(request.url);
    const environment = resolveControlPlaneEnvironment(
      searchParams.get('environment') ?? undefined,
    );

    const snapshot = await getAdminControlPlaneSnapshot({ environment });

    return NextResponse.json(snapshot, {
      headers: {
        'Cache-Control': 'private, no-store, max-age=0',
      },
    });
  } catch (error) {
    return handleAdminError(error, '/api/admin/control-plane');
  }
}

export async function POST(request: Request) {
  try {
    const { user } = await requireFounderAccess();

    const body = await request.json().catch(() => ({}));
    const action = String(body?.action ?? '').trim();
    const payload = asObject(body?.payload);
    const environment = resolveControlPlaneEnvironment(
      isNonEmptyString(body?.environment) ? body.environment : undefined,
    );

    if (!action) {
      return NextResponse.json({ error: 'action is required' }, { status: 400 });
    }

    const response = await handleAction(user.id, environment, action, payload);

    if (response.status >= 400) {
      return response;
    }

    await writeControlPlaneAudit({
      actorUserId: user.id,
      environment,
      eventType: 'control_plane.action',
      targetType: 'control_plane',
      targetId: action,
      metadata: {
        action,
      },
    });

    return response;
  } catch (error) {
    return handleAdminError(error, '/api/admin/control-plane');
  }
}
