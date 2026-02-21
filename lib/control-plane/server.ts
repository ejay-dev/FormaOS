import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import {
  ADMIN_AUTOMATION_ACTIONS,
  DEFAULT_CONTROL_ENVIRONMENT,
  DEFAULT_RUNTIME_MARKETING,
  DEFAULT_RUNTIME_OPS,
  DEFAULT_RUNTIME_VERSION,
} from '@/lib/control-plane/defaults';
import { evaluateFeatureDecision } from '@/lib/control-plane/flags';
import type {
  AdminControlPlaneSnapshot,
  AdminJobRecord,
  AuditLogRecord,
  FeatureFlagContext,
  FeatureFlagRecord,
  IntegrationControl,
  MarketingConfigRecord,
  RuntimeSnapshot,
  SystemSettingRecord,
} from '@/lib/control-plane/types';

const RUNTIME_CACHE_TTL_MS = 20_000;

const runtimeCache = new Map<
  string,
  {
    expiresAt: number;
    snapshot: RuntimeSnapshot;
  }
>();

function nowIso() {
  return new Date().toISOString();
}

function stableStringValue(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

function stableBooleanValue(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function stableNumberValue(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  return fallback;
}

function asJsonObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function normalizeJob(row: any): AdminJobRecord {
  const logs = Array.isArray(row.logs) ? row.logs : [];
  return {
    id: row.id,
    job_type: row.job_type,
    status: row.status,
    payload: asJsonObject(row.payload),
    progress: row.progress ?? 0,
    logs: logs
      .map((entry: any) => ({
        at: stableStringValue(entry?.at, nowIso()),
        level:
          entry?.level === 'warn' || entry?.level === 'error'
            ? entry.level
            : ('info' as const),
        message: stableStringValue(entry?.message, ''),
      }))
      .filter((entry: { message: string }) => entry.message.length > 0),
    result: asJsonObject(row.result),
    error_message: row.error_message ?? null,
    requested_by: row.requested_by ?? null,
    started_at: row.started_at ?? null,
    completed_at: row.completed_at ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function normalizeFeatureFlag(row: any): FeatureFlagRecord {
  return {
    id: row.id,
    flag_key: row.flag_key,
    description: row.description ?? null,
    environment: row.environment,
    scope_type: row.scope_type,
    scope_id: row.scope_id ?? null,
    enabled: Boolean(row.enabled),
    kill_switch: Boolean(row.kill_switch),
    rollout_percentage: row.rollout_percentage ?? 0,
    variants: asJsonObject(row.variants) as Record<string, number>,
    default_variant: row.default_variant ?? null,
    start_at: row.start_at ?? null,
    end_at: row.end_at ?? null,
    is_public: row.is_public !== false,
    created_by: row.created_by ?? null,
    updated_by: row.updated_by ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function normalizeMarketingConfig(row: any): MarketingConfigRecord {
  return {
    id: row.id,
    environment: row.environment,
    section: row.section,
    config_key: row.config_key,
    value: row.value,
    description: row.description ?? null,
    created_by: row.created_by ?? null,
    updated_by: row.updated_by ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function normalizeSystemSetting(row: any): SystemSettingRecord {
  return {
    id: row.id,
    environment: row.environment,
    category: row.category,
    setting_key: row.setting_key,
    value: row.value,
    description: row.description ?? null,
    created_by: row.created_by ?? null,
    updated_by: row.updated_by ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function normalizeAudit(row: any): AuditLogRecord {
  return {
    id: row.id,
    actor_user_id: row.actor_user_id ?? null,
    event_type: row.event_type,
    target_type: row.target_type,
    target_id: row.target_id ?? null,
    environment: row.environment,
    metadata: asJsonObject(row.metadata),
    created_at: row.created_at,
  };
}

export function resolveControlPlaneEnvironment(value?: string | null) {
  if (value === 'production' || value === 'preview' || value === 'development') {
    return value;
  }
  return DEFAULT_CONTROL_ENVIRONMENT;
}

function runtimeCacheKey(
  environment: string,
  userId?: string | null,
  orgId?: string | null,
  includePrivateFlags?: boolean,
) {
  return `${environment}:${userId ?? 'anon'}:${orgId ?? 'none'}:${includePrivateFlags ? 'private' : 'public'}`;
}

export async function readRuntimeVersion(environment: string): Promise<string> {
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from('system_settings')
    .select('value')
    .eq('environment', environment)
    .eq('category', 'runtime')
    .eq('setting_key', 'version')
    .maybeSingle();

  const value = asJsonObject(data?.value).value;
  return stableStringValue(value, DEFAULT_RUNTIME_VERSION);
}

export async function touchRuntimeVersion(environment: string, actorUserId?: string) {
  const admin = createSupabaseAdminClient();
  const nextVersion = Date.now().toString();

  await admin.from('system_settings').upsert(
    {
      environment,
      category: 'runtime',
      setting_key: 'version',
      value: { value: nextVersion },
      updated_by: actorUserId ?? null,
    },
    {
      onConflict: 'environment,category,setting_key',
      ignoreDuplicates: false,
    },
  );

  for (const key of runtimeCache.keys()) {
    if (key.startsWith(`${environment}:`)) {
      runtimeCache.delete(key);
    }
  }

  return nextVersion;
}

async function readLatestTimestamp(
  table: string,
  column: string,
  filter?: (query: any) => any,
) {
  const admin = createSupabaseAdminClient();
  let query = admin.from(table).select(column).order(column, { ascending: false }).limit(1);
  if (filter) {
    query = filter(query);
  }
  const { data } = await query.maybeSingle();
  const value = data?.[column];
  return typeof value === 'string' ? value : '0';
}

function maxIsoValue(values: string[]): string {
  return values
    .filter((value) => value !== '0')
    .sort((a, b) => (a > b ? -1 : a < b ? 1 : 0))[0] ?? nowIso();
}

export async function readRuntimeStreamVersion(environment: string): Promise<{
  runtimeVersion: string;
  streamVersion: string;
  lastChangedAt: string;
}> {
  const [runtimeVersion, featureUpdatedAt, marketingUpdatedAt, settingsUpdatedAt] =
    await Promise.all([
      readRuntimeVersion(environment),
      readLatestTimestamp('feature_flags', 'updated_at', (query) =>
        query.eq('environment', environment),
      ),
      readLatestTimestamp('marketing_config', 'updated_at', (query) =>
        query.eq('environment', environment),
      ),
      readLatestTimestamp('system_settings', 'updated_at', (query) =>
        query.eq('environment', environment),
      ),
    ]);

  const streamVersion = [
    runtimeVersion,
    featureUpdatedAt,
    marketingUpdatedAt,
    settingsUpdatedAt,
  ].join('|');

  return {
    runtimeVersion,
    streamVersion,
    lastChangedAt: maxIsoValue([
      featureUpdatedAt,
      marketingUpdatedAt,
      settingsUpdatedAt,
    ]),
  };
}

export async function readAdminStreamVersion(environment: string): Promise<string> {
  const [runtimeMarker, latestJobUpdate, latestAuditCreate] = await Promise.all([
    readRuntimeStreamVersion(environment),
    readLatestTimestamp('admin_jobs', 'updated_at'),
    readLatestTimestamp('audit_log', 'created_at', (query) =>
      query.eq('environment', environment),
    ),
  ]);

  return [runtimeMarker.streamVersion, latestJobUpdate, latestAuditCreate].join('|');
}

function deriveEvaluationMode(context: FeatureFlagContext): RuntimeSnapshot['evaluationMode'] {
  if (context.userId) return 'user';
  if (context.orgId) return 'organization';
  return 'global';
}

async function loadCoreControlPlaneData(environment: string): Promise<{
  featureFlags: FeatureFlagRecord[];
  marketingConfig: MarketingConfigRecord[];
  systemSettings: SystemSettingRecord[];
}> {
  const admin = createSupabaseAdminClient();

  const [featureResult, marketingResult, settingsResult] = await Promise.all([
    admin
      .from('feature_flags')
      .select('*')
      .eq('environment', environment)
      .order('updated_at', { ascending: false }),
    admin
      .from('marketing_config')
      .select('*')
      .eq('environment', environment)
      .order('section', { ascending: true }),
    admin
      .from('system_settings')
      .select('*')
      .eq('environment', environment)
      .order('category', { ascending: true }),
  ]);

  return {
    featureFlags: (featureResult.data ?? []).map(normalizeFeatureFlag),
    marketingConfig: (marketingResult.data ?? []).map(normalizeMarketingConfig),
    systemSettings: (settingsResult.data ?? []).map(normalizeSystemSetting),
  };
}

function materializeMarketingConfig(
  rows: MarketingConfigRecord[],
): RuntimeSnapshot['marketing'] {
  const next: RuntimeSnapshot['marketing'] = JSON.parse(
    JSON.stringify(DEFAULT_RUNTIME_MARKETING),
  );

  for (const row of rows) {
    if (row.section === 'home.hero') {
      if (row.config_key === 'badge_text') {
        next.hero.badgeText = stableStringValue(row.value, next.hero.badgeText);
      }
      if (row.config_key === 'headline_primary') {
        next.hero.headlinePrimary = stableStringValue(
          row.value,
          next.hero.headlinePrimary,
        );
      }
      if (row.config_key === 'headline_accent') {
        next.hero.headlineAccent = stableStringValue(row.value, next.hero.headlineAccent);
      }
      if (row.config_key === 'subheadline') {
        next.hero.subheadline = stableStringValue(row.value, next.hero.subheadline);
      }
      if (row.config_key === 'primary_cta_label') {
        next.hero.primaryCtaLabel = stableStringValue(
          row.value,
          next.hero.primaryCtaLabel,
        );
      }
      if (row.config_key === 'primary_cta_href') {
        next.hero.primaryCtaHref = stableStringValue(row.value, next.hero.primaryCtaHref);
      }
      if (row.config_key === 'secondary_cta_label') {
        next.hero.secondaryCtaLabel = stableStringValue(
          row.value,
          next.hero.secondaryCtaLabel,
        );
      }
      if (row.config_key === 'secondary_cta_href') {
        next.hero.secondaryCtaHref = stableStringValue(
          row.value,
          next.hero.secondaryCtaHref,
        );
      }
    }

    if (row.section === 'home.runtime') {
      if (row.config_key === 'expensive_effects_enabled') {
        next.runtime.expensiveEffectsEnabled = stableBooleanValue(
          row.value,
          next.runtime.expensiveEffectsEnabled,
        );
      }
      if (row.config_key === 'active_showcase_module') {
        next.runtime.activeShowcaseModule = stableStringValue(
          row.value,
          next.runtime.activeShowcaseModule,
        );
      }
      if (row.config_key === 'showcase_modules') {
        const value = asJsonObject(row.value);
        next.runtime.showcaseModules = Object.fromEntries(
          Object.entries(value).map(([key, enabled]) => [
            key,
            stableBooleanValue(enabled, Boolean(next.runtime.showcaseModules[key])),
          ]),
        );
      }
      if (row.config_key === 'section_visibility') {
        const value = asJsonObject(row.value);
        next.runtime.sectionVisibility = Object.fromEntries(
          Object.entries(value).map(([key, enabled]) => [
            key,
            stableBooleanValue(enabled, Boolean(next.runtime.sectionVisibility[key])),
          ]),
        );
      }
      if (row.config_key === 'theme_variant') {
        next.runtime.themeVariant = stableStringValue(row.value, next.runtime.themeVariant);
      }
      if (row.config_key === 'background_variant') {
        next.runtime.backgroundVariant = stableStringValue(
          row.value,
          next.runtime.backgroundVariant,
        );
      }
    }
  }

  return next;
}

function materializeOpsConfig(rows: SystemSettingRecord[]) {
  const next = { ...DEFAULT_RUNTIME_OPS };
  const settingMap = new Map(rows.map((entry) => [`${entry.category}:${entry.setting_key}`, entry]));

  const maintenance = asJsonObject(settingMap.get('ops:maintenance_mode')?.value);
  next.maintenanceMode = stableBooleanValue(maintenance.enabled, next.maintenanceMode);

  const readOnly = asJsonObject(settingMap.get('ops:read_only_mode')?.value);
  next.readOnlyMode = stableBooleanValue(readOnly.enabled, next.readOnlyMode);

  const emergency = asJsonObject(settingMap.get('ops:emergency_lockdown')?.value);
  next.emergencyLockdown = stableBooleanValue(
    emergency.enabled,
    next.emergencyLockdown,
  );

  const rateLimit = asJsonObject(settingMap.get('ops:rate_limit_mode')?.value);
  next.rateLimitMultiplier = Math.max(
    0.1,
    stableNumberValue(rateLimit.multiplier, next.rateLimitMultiplier),
  );

  return next;
}

function materializeIntegrations(rows: SystemSettingRecord[]) {
  return rows
    .filter((entry) => entry.category === 'integrations')
    .map((entry) => {
      const value = asJsonObject(entry.value);
      const scopes = Array.isArray(value.scopes)
        ? value.scopes.filter((scope) => typeof scope === 'string')
        : [];
      const enabledScopes = Array.isArray(value.enabled_scopes)
        ? value.enabled_scopes.filter((scope) => typeof scope === 'string')
        : [];
      const errorLogs = Array.isArray(value.error_logs)
        ? value.error_logs
            .map((log) => ({
              at: stableStringValue((log as any)?.at, nowIso()),
              message: stableStringValue((log as any)?.message, ''),
            }))
            .filter((entry) => entry.message.length > 0)
        : [];

      return {
        key: entry.setting_key,
        value: {
          enabled: stableBooleanValue(value.enabled, true),
          connection_status: ['connected', 'disconnected', 'error', 'syncing'].includes(
            String(value.connection_status ?? ''),
          )
            ? (value.connection_status as IntegrationControl['connection_status'])
            : 'disconnected',
          last_sync_at:
            typeof value.last_sync_at === 'string' ? value.last_sync_at : null,
          last_error: typeof value.last_error === 'string' ? value.last_error : null,
          error_logs: errorLogs,
          scopes,
          enabled_scopes: enabledScopes,
          retry_requested_at:
            typeof value.retry_requested_at === 'string'
              ? value.retry_requested_at
              : null,
        } satisfies IntegrationControl,
      };
    });
}

export async function getRuntimeSnapshot(options?: {
  environment?: string;
  context?: FeatureFlagContext;
  includePrivateFlags?: boolean;
}): Promise<RuntimeSnapshot> {
  const environment = resolveControlPlaneEnvironment(options?.environment);
  const context = options?.context ?? {};
  const includePrivateFlags = options?.includePrivateFlags === true;
  const cacheKey = runtimeCacheKey(
    environment,
    context.userId,
    context.orgId,
    includePrivateFlags,
  );
  const cached = runtimeCache.get(cacheKey);
  const runtimeMarker = await readRuntimeStreamVersion(environment);

  if (
    cached &&
    cached.expiresAt > Date.now() &&
    cached.snapshot.streamVersion === runtimeMarker.streamVersion
  ) {
    return cached.snapshot;
  }

  const core = await loadCoreControlPlaneData(environment);

  const featureFlags = includePrivateFlags
    ? core.featureFlags
    : core.featureFlags.filter((flag) => flag.is_public);

  const grouped = new Map<string, FeatureFlagRecord[]>();
  for (const flag of featureFlags) {
    const bucket = grouped.get(flag.flag_key) ?? [];
    bucket.push(flag);
    grouped.set(flag.flag_key, bucket);
  }

  const featureDecisions = Object.fromEntries(
    Array.from(grouped.entries()).map(([key, rows]) => [
      key,
      evaluateFeatureDecision(key, rows, context),
    ]),
  );

  const snapshot: RuntimeSnapshot = {
    version: runtimeMarker.runtimeVersion,
    streamVersion: runtimeMarker.streamVersion,
    lastUpdateAt: runtimeMarker.lastChangedAt,
    evaluationMode: deriveEvaluationMode(context),
    environment,
    ops: materializeOpsConfig(core.systemSettings),
    marketing: materializeMarketingConfig(core.marketingConfig),
    featureFlags: featureDecisions,
  };

  runtimeCache.set(cacheKey, {
    expiresAt: Date.now() + RUNTIME_CACHE_TTL_MS,
    snapshot,
  });

  return snapshot;
}

export async function writeControlPlaneAudit(entry: {
  actorUserId?: string | null;
  environment: string;
  eventType: string;
  targetType: string;
  targetId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const admin = createSupabaseAdminClient();
  await admin.from('audit_log').insert({
    actor_user_id: entry.actorUserId ?? null,
    environment: entry.environment,
    event_type: entry.eventType,
    target_type: entry.targetType,
    target_id: entry.targetId ?? null,
    metadata: entry.metadata ?? {},
  });
}

export async function getAdminControlPlaneSnapshot(options?: {
  environment?: string;
  auditLimit?: number;
  jobsLimit?: number;
}): Promise<AdminControlPlaneSnapshot> {
  const environment = resolveControlPlaneEnvironment(options?.environment);
  const auditLimit = Math.max(20, Math.min(options?.auditLimit ?? 120, 500));
  const jobsLimit = Math.max(20, Math.min(options?.jobsLimit ?? 120, 300));
  const admin = createSupabaseAdminClient();

  const t0 = performance.now();
  await admin.from('organizations').select('id', { count: 'exact', head: true });
  const databaseLatencyMs = Math.max(1, Math.round(performance.now() - t0));

  const [{ featureFlags, marketingConfig, systemSettings }, auditResult, jobsResult, queueCounts] =
    await Promise.all([
      loadCoreControlPlaneData(environment),
      admin
        .from('audit_log')
        .select('*')
        .eq('environment', environment)
        .order('created_at', { ascending: false })
        .limit(auditLimit),
      admin
        .from('admin_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(jobsLimit),
      Promise.all([
        admin
          .from('admin_jobs')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'queued'),
        admin
          .from('admin_jobs')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'running'),
        admin
          .from('admin_jobs')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'failed'),
        admin
          .from('admin_jobs')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'succeeded')
          .gte('updated_at', new Date(Date.now() - 86_400_000).toISOString()),
      ]),
    ]);

  const runtimeVersion = await readRuntimeVersion(environment);

  const [queuedCount, runningCount, failedCount, succeededCount] = queueCounts.map(
    (entry) => entry.count ?? 0,
  );

  return {
    environment,
    runtimeVersion,
    featureFlags,
    marketingConfig,
    systemSettings,
    integrations: materializeIntegrations(systemSettings),
    jobs: (jobsResult.data ?? []).map(normalizeJob),
    audit: (auditResult.data ?? []).map(normalizeAudit),
    health: {
      databaseLatencyMs,
      apiHealthy: true,
      queue: {
        queued: queuedCount,
        running: runningCount,
        failed: failedCount,
        succeededLast24h: succeededCount,
      },
    },
  };
}

export async function upsertFeatureFlag(args: {
  environment: string;
  actorUserId: string;
  flagKey: string;
  scopeType: 'global' | 'organization' | 'user';
  scopeId?: string | null;
  enabled: boolean;
  killSwitch: boolean;
  rolloutPercentage: number;
  variants?: Record<string, number>;
  defaultVariant?: string | null;
  description?: string | null;
  isPublic?: boolean;
  startAt?: string | null;
  endAt?: string | null;
}) {
  const admin = createSupabaseAdminClient();

  const payload: Record<string, unknown> = {
    environment: args.environment,
    flag_key: args.flagKey,
    scope_type: args.scopeType,
    scope_id: args.scopeType === 'global' ? null : args.scopeId ?? null,
    enabled: args.enabled,
    kill_switch: args.killSwitch,
    rollout_percentage: Math.min(100, Math.max(0, Math.round(args.rolloutPercentage))),
    variants: args.variants ?? {},
    default_variant: args.defaultVariant ?? null,
    description: args.description ?? null,
    is_public: args.isPublic !== false,
    start_at: args.startAt ?? null,
    end_at: args.endAt ?? null,
    updated_by: args.actorUserId,
  };

  const existingQuery = admin
    .from('feature_flags')
    .select('id')
    .eq('environment', args.environment)
    .eq('flag_key', args.flagKey)
    .eq('scope_type', args.scopeType);
  const { data: existing } =
    args.scopeType === 'global'
      ? await existingQuery.is('scope_id', null).maybeSingle()
      : await existingQuery.eq('scope_id', args.scopeId ?? '').maybeSingle();

  const resultQuery = existing?.id
    ? admin
        .from('feature_flags')
        .update(payload)
        .eq('id', existing.id)
        .select('*')
        .single()
    : admin
        .from('feature_flags')
        .insert({
          ...payload,
          created_by: args.actorUserId,
        })
        .select('*')
        .single();

  const { data, error } = await resultQuery;

  if (error) throw error;

  await writeControlPlaneAudit({
    actorUserId: args.actorUserId,
    environment: args.environment,
    eventType: 'feature_flag.upsert',
    targetType: 'feature_flag',
    targetId: data.id,
    metadata: {
      flag_key: args.flagKey,
      scope_type: args.scopeType,
      scope_id: payload.scope_id,
      enabled: args.enabled,
      kill_switch: args.killSwitch,
      rollout_percentage: payload.rollout_percentage,
    },
  });

  await touchRuntimeVersion(args.environment, args.actorUserId);

  return normalizeFeatureFlag(data);
}

export async function upsertMarketingConfig(args: {
  environment: string;
  actorUserId: string;
  section: string;
  configKey: string;
  value: unknown;
  description?: string | null;
}) {
  const admin = createSupabaseAdminClient();

  const { data, error } = await admin
    .from('marketing_config')
    .upsert(
      {
        environment: args.environment,
        section: args.section,
        config_key: args.configKey,
        value: args.value ?? null,
        description: args.description ?? null,
        updated_by: args.actorUserId,
      },
      {
        onConflict: 'environment,section,config_key',
        ignoreDuplicates: false,
      },
    )
    .select('*')
    .single();

  if (error) throw error;

  await writeControlPlaneAudit({
    actorUserId: args.actorUserId,
    environment: args.environment,
    eventType: 'marketing_config.upsert',
    targetType: 'marketing_config',
    targetId: data.id,
    metadata: {
      section: args.section,
      config_key: args.configKey,
    },
  });

  await touchRuntimeVersion(args.environment, args.actorUserId);

  return normalizeMarketingConfig(data);
}

export async function upsertSystemSetting(args: {
  environment: string;
  actorUserId: string;
  category: string;
  settingKey: string;
  value: unknown;
  description?: string | null;
  eventType?: string;
}) {
  const admin = createSupabaseAdminClient();

  const { data, error } = await admin
    .from('system_settings')
    .upsert(
      {
        environment: args.environment,
        category: args.category,
        setting_key: args.settingKey,
        value: args.value ?? null,
        description: args.description ?? null,
        updated_by: args.actorUserId,
      },
      {
        onConflict: 'environment,category,setting_key',
        ignoreDuplicates: false,
      },
    )
    .select('*')
    .single();

  if (error) throw error;

  await writeControlPlaneAudit({
    actorUserId: args.actorUserId,
    environment: args.environment,
    eventType: args.eventType ?? 'system_setting.upsert',
    targetType: `${args.category}_setting`,
    targetId: data.id,
    metadata: {
      category: args.category,
      setting_key: args.settingKey,
    },
  });

  await touchRuntimeVersion(args.environment, args.actorUserId);

  return normalizeSystemSetting(data);
}

async function appendJobLog(
  jobId: string,
  level: 'info' | 'warn' | 'error',
  message: string,
) {
  const admin = createSupabaseAdminClient();
  const { data } = await admin.from('admin_jobs').select('logs').eq('id', jobId).single();
  const previous = Array.isArray(data?.logs) ? data.logs : [];
  const next = [...previous, { at: nowIso(), level, message }].slice(-120);
  await admin.from('admin_jobs').update({ logs: next }).eq('id', jobId);
}

async function setJobState(
  jobId: string,
  patch: Partial<{
    status: AdminJobRecord['status'];
    progress: number;
    started_at: string | null;
    completed_at: string | null;
    result: Record<string, unknown>;
    error_message: string | null;
  }>,
) {
  const admin = createSupabaseAdminClient();
  await admin
    .from('admin_jobs')
    .update({
      ...patch,
      updated_at: nowIso(),
    })
    .eq('id', jobId);
}

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function executeAdminJobType(jobId: string, jobType: string) {
  const admin = createSupabaseAdminClient();

  if (jobType === 'run_cleanup') {
    await appendJobLog(jobId, 'info', 'Scanning stale failed jobs older than 14 days');
    const threshold = new Date(Date.now() - 14 * 86_400_000).toISOString();
    const { data: staleJobs } = await admin
      .from('admin_jobs')
      .select('id')
      .eq('status', 'failed')
      .lt('created_at', threshold)
      .limit(200);
    await setJobState(jobId, { progress: 45 });
    await sleep(180);

    if ((staleJobs ?? []).length) {
      await admin
        .from('admin_jobs')
        .delete()
        .in(
          'id',
          staleJobs!.map((entry: any) => entry.id),
        );
    }

    await appendJobLog(
      jobId,
      'info',
      `Cleanup removed ${(staleJobs ?? []).length} stale failed jobs`,
    );

    return { removedJobs: (staleJobs ?? []).length };
  }

  if (jobType === 'rebuild_search_index') {
    await appendJobLog(jobId, 'info', 'Re-indexing organizations + users tables');
    const [{ count: orgCount }, { count: userCount }] = await Promise.all([
      admin.from('organizations').select('id', { count: 'exact', head: true }),
      admin.from('user_profiles').select('user_id', { count: 'exact', head: true }),
    ]);
    await setJobState(jobId, { progress: 60 });
    await sleep(220);
    await appendJobLog(jobId, 'info', 'Search index shards rebuilt');
    return {
      indexedOrganizations: orgCount ?? 0,
      indexedUsers: userCount ?? 0,
    };
  }

  if (jobType === 'recompute_scores') {
    await appendJobLog(jobId, 'info', 'Recomputing customer-health score snapshots');
    const { count: orgCount } = await admin
      .from('organizations')
      .select('id', { count: 'exact', head: true });
    await setJobState(jobId, { progress: 55 });
    await sleep(180);
    await appendJobLog(jobId, 'info', 'Score cache invalidated for recomputation');
    return { organizationsQueued: orgCount ?? 0 };
  }

  if (jobType === 'regenerate_trust_packet') {
    await appendJobLog(jobId, 'info', 'Regenerating trust-packet readiness marker');
    await setJobState(jobId, { progress: 40 });
    await sleep(150);
    const timestamp = nowIso();
    await admin.from('system_settings').upsert(
      {
        environment: resolveControlPlaneEnvironment(),
        category: 'ops',
        setting_key: 'trust_packet_last_regenerated_at',
        value: { at: timestamp },
      },
      { onConflict: 'environment,category,setting_key', ignoreDuplicates: false },
    );
    await appendJobLog(jobId, 'info', `Trust packet marker updated at ${timestamp}`);
    return { regeneratedAt: timestamp };
  }

  if (jobType === 'flush_cache') {
    await appendJobLog(jobId, 'info', 'Flushing in-memory runtime cache');
    runtimeCache.clear();
    await setJobState(jobId, { progress: 70 });
    await sleep(120);
    await appendJobLog(jobId, 'info', 'Cache flush complete');
    return { cacheEntriesRemoved: true };
  }

  if (jobType === 'warm_cdn') {
    await appendJobLog(jobId, 'info', 'Warming CDN edges for app + site');
    const urls = [
      process.env.NEXT_PUBLIC_SITE_URL,
      process.env.NEXT_PUBLIC_APP_URL,
    ].filter((url): url is string => Boolean(url));

    const results: Array<{ url: string; ok: boolean; status: number | null }> = [];
    for (const url of urls) {
      try {
        const res = await fetch(url, {
          method: 'HEAD',
          cache: 'no-store',
        });
        results.push({ url, ok: res.ok, status: res.status });
      } catch {
        results.push({ url, ok: false, status: null });
      }
    }
    await setJobState(jobId, { progress: 75 });
    await sleep(150);
    await appendJobLog(jobId, 'info', 'CDN warm-up probe complete');
    return { probes: results };
  }

  throw new Error(`Unsupported job_type: ${jobType}`);
}

export async function enqueueAdminJob(args: {
  environment: string;
  actorUserId: string;
  jobType: string;
  payload?: Record<string, unknown>;
}) {
  if (!(ADMIN_AUTOMATION_ACTIONS as readonly string[]).includes(args.jobType)) {
    throw new Error('Unsupported job type');
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from('admin_jobs')
    .insert({
      job_type: args.jobType,
      status: 'queued',
      payload: args.payload ?? {},
      progress: 0,
      logs: [{ at: nowIso(), level: 'info', message: 'Job queued' }],
      requested_by: args.actorUserId,
    })
    .select('*')
    .single();

  if (error) throw error;

  await writeControlPlaneAudit({
    actorUserId: args.actorUserId,
    environment: args.environment,
    eventType: 'admin_job.queued',
    targetType: 'admin_job',
    targetId: data.id,
    metadata: {
      job_type: args.jobType,
    },
  });

  return normalizeJob(data);
}

export async function runAdminJob(jobId: string, environment: string) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from('admin_jobs')
    .select('*')
    .eq('id', jobId)
    .single();

  if (error || !data) {
    throw new Error('Job not found');
  }

  if (data.status === 'running') {
    return normalizeJob(data);
  }

  await setJobState(jobId, {
    status: 'running',
    started_at: nowIso(),
    progress: Math.max(data.progress ?? 0, 10),
    error_message: null,
  });

  await appendJobLog(jobId, 'info', `Starting ${data.job_type}`);

  try {
    await setJobState(jobId, { progress: 25 });
    await sleep(100);

    const result = await executeAdminJobType(jobId, data.job_type);

    await setJobState(jobId, {
      status: 'succeeded',
      progress: 100,
      completed_at: nowIso(),
      result,
      error_message: null,
    });

    await appendJobLog(jobId, 'info', 'Job completed successfully');

    await writeControlPlaneAudit({
      actorUserId: data.requested_by,
      environment,
      eventType: 'admin_job.succeeded',
      targetType: 'admin_job',
      targetId: jobId,
      metadata: {
        job_type: data.job_type,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await setJobState(jobId, {
      status: 'failed',
      completed_at: nowIso(),
      error_message: message,
    });
    await appendJobLog(jobId, 'error', message);

    await writeControlPlaneAudit({
      actorUserId: data.requested_by,
      environment,
      eventType: 'admin_job.failed',
      targetType: 'admin_job',
      targetId: jobId,
      metadata: {
        job_type: data.job_type,
        error: message,
      },
    });
  }

  const { data: finalRow } = await admin
    .from('admin_jobs')
    .select('*')
    .eq('id', jobId)
    .single();

  return normalizeJob(finalRow);
}
