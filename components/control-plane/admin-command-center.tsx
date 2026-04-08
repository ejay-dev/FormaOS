'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DEFAULT_RUNTIME_MARKETING } from '@/lib/control-plane/defaults';
import type {
  AdminControlPlaneSnapshot,
  IntegrationControl,
  RuntimeMarketingConfig,
} from '@/lib/control-plane/types';
import type {
  FeatureFlagDraft,
  MarketingFormState,
  UndoState,
} from './command-center-types';
import {
  areMarketingFormsEqual,
  fetchSnapshot,
  fromLocalInput,
  makeSettingsMap,
  parseVariantWeights,
  readOpsValue,
  readRateLimitMultiplier,
  toMarketingFormState,
  upsertMarketingConfigRecord,
} from './command-center-utils';
import { CommandCenterHeader } from './command-center-header';
import { CommandCenterMetrics } from './command-center-metrics';
import { CommandCenterMarketing } from './command-center-marketing';
import { CommandCenterIntegrations } from './command-center-integrations';
import { CommandCenterOps } from './command-center-ops';

const DEFAULT_FLAG_DRAFT: FeatureFlagDraft = {
  flagKey: '',
  scopeType: 'global',
  scopeId: '',
  enabled: false,
  killSwitch: false,
  rolloutPercentage: 100,
  variantsText: '{"control": 50, "variant": 50}',
  defaultVariant: 'control',
  description: '',
  isPublic: true,
  startAt: '',
  endAt: '',
};

export function AdminCommandCenter() {
  const [snapshot, setSnapshot] = useState<AdminControlPlaneSnapshot | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [undoState, setUndoState] = useState<UndoState | null>(null);
  const [flagDraft, setFlagDraft] =
    useState<FeatureFlagDraft>(DEFAULT_FLAG_DRAFT);
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);
  const [marketingForm, setMarketingForm] = useState<MarketingFormState>(() =>
    toMarketingFormState(DEFAULT_RUNTIME_MARKETING),
  );
  const [adminStreamStatus, setAdminStreamStatus] = useState<
    'connecting' | 'connected' | 'disconnected'
  >('connecting');
  const adminStreamRef = useRef<EventSource | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectDelayRef = useRef(1_000);
  const closeUndoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refresh = useCallback(async () => {
    try {
      const next = await fetchSnapshot();
      setSnapshot(next);
      setError(null);
    } catch (fetchError) {
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : 'Runtime unavailable',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void fetchSnapshot(controller.signal)
      .then((next) => {
        setSnapshot(next);
        setError(null);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : 'Runtime unavailable');
      })
      .finally(() => {
        setLoading(false);
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    let closed = false;
    const closeStream = () => {
      adminStreamRef.current?.close();
      adminStreamRef.current = null;
    };
    const clearReconnect = () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };
    const scheduleReconnect = () => {
      if (closed) return;
      clearReconnect();
      const delay = reconnectDelayRef.current;
      reconnectDelayRef.current = Math.min(30_000, delay * 2);
      reconnectTimerRef.current = setTimeout(connectStream, delay);
    };
    function connectStream() {
      if (closed) return;
      setAdminStreamStatus('connecting');
      closeStream();
      const stream = new EventSource('/api/admin/control-plane/stream');
      adminStreamRef.current = stream;
      stream.onopen = () => {
        reconnectDelayRef.current = 1_000;
        setAdminStreamStatus('connected');
        setError(null);
      };
      stream.onmessage = (event) => {
        try {
          setSnapshot(JSON.parse(event.data) as AdminControlPlaneSnapshot);
          setError(null);
          setAdminStreamStatus('connected');
        } catch {
          /* skip malformed */
        }
      };
      stream.onerror = () => {
        setAdminStreamStatus('disconnected');
        setError('Live updates disconnected. Reconnecting...');
        closeStream();
        scheduleReconnect();
      };
    }
    connectStream();
    const onUnload = () => {
      closed = true;
      clearReconnect();
      closeStream();
    };
    window.addEventListener('beforeunload', onUnload);
    return () => {
      closed = true;
      window.removeEventListener('beforeunload', onUnload);
      clearReconnect();
      closeStream();
    };
  }, []);

  useEffect(
    () => () => {
      if (closeUndoTimerRef.current) clearTimeout(closeUndoTimerRef.current);
    },
    [],
  );

  const settingsMap = useMemo(
    () => makeSettingsMap(snapshot?.systemSettings ?? []),
    [snapshot?.systemSettings],
  );

  const marketingRuntime = useMemo<RuntimeMarketingConfig>(() => {
    const rows = snapshot?.marketingConfig ?? [];
    const next: RuntimeMarketingConfig = JSON.parse(
      JSON.stringify(DEFAULT_RUNTIME_MARKETING),
    );
    for (const row of rows) {
      if (row.section === 'home.hero') {
        if (row.config_key === 'badge_text' && typeof row.value === 'string')
          next.hero.badgeText = row.value;
        if (
          row.config_key === 'headline_primary' &&
          typeof row.value === 'string'
        )
          next.hero.headlinePrimary = row.value;
        if (
          row.config_key === 'headline_accent' &&
          typeof row.value === 'string'
        )
          next.hero.headlineAccent = row.value;
        if (row.config_key === 'subheadline' && typeof row.value === 'string')
          next.hero.subheadline = row.value;
        if (
          row.config_key === 'primary_cta_label' &&
          typeof row.value === 'string'
        )
          next.hero.primaryCtaLabel = row.value;
        if (
          row.config_key === 'primary_cta_href' &&
          typeof row.value === 'string'
        )
          next.hero.primaryCtaHref = row.value;
        if (
          row.config_key === 'secondary_cta_label' &&
          typeof row.value === 'string'
        )
          next.hero.secondaryCtaLabel = row.value;
        if (
          row.config_key === 'secondary_cta_href' &&
          typeof row.value === 'string'
        )
          next.hero.secondaryCtaHref = row.value;
      }
      if (row.section === 'home.runtime') {
        if (
          row.config_key === 'expensive_effects_enabled' &&
          typeof row.value === 'boolean'
        )
          next.runtime.expensiveEffectsEnabled = row.value;
        if (
          row.config_key === 'active_showcase_module' &&
          typeof row.value === 'string'
        )
          next.runtime.activeShowcaseModule = row.value;
        if (
          row.config_key === 'showcase_modules' &&
          row.value &&
          typeof row.value === 'object' &&
          !Array.isArray(row.value)
        ) {
          next.runtime.showcaseModules = Object.fromEntries(
            Object.entries(row.value as Record<string, unknown>).map(
              ([k, v]) => [k, Boolean(v)],
            ),
          );
        }
        if (
          row.config_key === 'section_visibility' &&
          row.value &&
          typeof row.value === 'object' &&
          !Array.isArray(row.value)
        ) {
          next.runtime.sectionVisibility = Object.fromEntries(
            Object.entries(row.value as Record<string, unknown>).map(
              ([k, v]) => [k, Boolean(v)],
            ),
          );
        }
        if (row.config_key === 'theme_variant' && typeof row.value === 'string')
          next.runtime.themeVariant = row.value;
        if (
          row.config_key === 'background_variant' &&
          typeof row.value === 'string'
        )
          next.runtime.backgroundVariant = row.value;
      }
    }
    return next;
  }, [snapshot?.marketingConfig]);

  const marketingBaseline = useMemo(
    () => toMarketingFormState(marketingRuntime),
    [marketingRuntime],
  );
  useEffect(() => {
    setMarketingForm(marketingBaseline);
  }, [marketingBaseline]);

  const performAction = useCallback(
    async (
      action: string,
      payload: Record<string, unknown>,
      options?: {
        confirmText?: string;
        undo?: UndoState;
        successMessage?: string;
        optimisticUpdater?: (
          c: AdminControlPlaneSnapshot,
        ) => AdminControlPlaneSnapshot;
        skipRefresh?: boolean;
        rethrowError?: boolean;
      },
    ) => {
      if (options?.confirmText && !window.confirm(options.confirmText)) return;
      const prev = snapshot;
      try {
        setPendingAction(action);
        setBannerMessage(null);
        if (prev && options?.optimisticUpdater)
          setSnapshot(options.optimisticUpdater(prev));
        const res = await fetch('/api/admin/control-plane', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action, payload }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.error || `Failed to run ${action}`);
        if (options?.undo) {
          setUndoState(options.undo);
          if (closeUndoTimerRef.current)
            clearTimeout(closeUndoTimerRef.current);
          closeUndoTimerRef.current = setTimeout(
            () => setUndoState(null),
            10_000,
          );
        }
        setBannerMessage(options?.successMessage ?? `${action} applied.`);
        if (!options?.skipRefresh) void refresh();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : `Failed to run ${action}`,
        );
        if (prev && options?.optimisticUpdater) setSnapshot(prev);
        if (options?.rethrowError) throw err;
      } finally {
        setPendingAction(null);
      }
    },
    [refresh, snapshot],
  );

  const submitFeatureFlag = useCallback(async () => {
    try {
      const variants = parseVariantWeights(flagDraft.variantsText);
      await performAction(
        'set_feature_flag',
        {
          flagKey: flagDraft.flagKey,
          scopeType: flagDraft.scopeType,
          scopeId: flagDraft.scopeType === 'global' ? null : flagDraft.scopeId,
          enabled: flagDraft.enabled,
          killSwitch: flagDraft.killSwitch,
          rolloutPercentage: Number(flagDraft.rolloutPercentage || 0),
          variants,
          defaultVariant: flagDraft.defaultVariant || null,
          description: flagDraft.description || null,
          isPublic: flagDraft.isPublic,
          startAt: fromLocalInput(flagDraft.startAt),
          endAt: fromLocalInput(flagDraft.endAt),
        },
        { successMessage: 'Feature flag updated.' },
      );
      setFlagDraft(DEFAULT_FLAG_DRAFT);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Invalid feature flag configuration',
      );
    }
  }, [flagDraft, performAction]);

  const saveMarketingForm = useCallback(async () => {
    const prev = marketingBaseline;
    const entries: Array<{
      section: string;
      configKey: string;
      value: string;
    }> = [
      {
        section: 'home.hero',
        configKey: 'badge_text',
        value: marketingForm.badgeText,
      },
      {
        section: 'home.hero',
        configKey: 'headline_primary',
        value: marketingForm.headlinePrimary,
      },
      {
        section: 'home.hero',
        configKey: 'headline_accent',
        value: marketingForm.headlineAccent,
      },
      {
        section: 'home.hero',
        configKey: 'subheadline',
        value: marketingForm.subheadline,
      },
      {
        section: 'home.hero',
        configKey: 'primary_cta_label',
        value: marketingForm.primaryCtaLabel,
      },
      {
        section: 'home.hero',
        configKey: 'primary_cta_href',
        value: marketingForm.primaryCtaHref,
      },
      {
        section: 'home.hero',
        configKey: 'secondary_cta_label',
        value: marketingForm.secondaryCtaLabel,
      },
      {
        section: 'home.hero',
        configKey: 'secondary_cta_href',
        value: marketingForm.secondaryCtaHref,
      },
      {
        section: 'home.runtime',
        configKey: 'theme_variant',
        value: marketingForm.themeVariant,
      },
      {
        section: 'home.runtime',
        configKey: 'background_variant',
        value: marketingForm.backgroundVariant,
      },
      {
        section: 'home.runtime',
        configKey: 'active_showcase_module',
        value: marketingForm.activeShowcaseModule,
      },
    ];
    try {
      setBannerMessage('Saving marketing controls...');
      for (let i = 0; i < entries.length; i += 1) {
        const e = entries[i];
        await performAction(
          'set_marketing_config',
          { section: e.section, configKey: e.configKey, value: e.value },
          {
            skipRefresh: i !== entries.length - 1,
            rethrowError: true,
            optimisticUpdater: (c) =>
              upsertMarketingConfigRecord(c, e.section, e.configKey, e.value),
            successMessage:
              i === entries.length - 1
                ? 'Marketing controls saved.'
                : undefined,
          },
        );
      }
    } catch {
      setMarketingForm(prev);
      setBannerMessage('Marketing save failed. Reverted local draft.');
    }
  }, [marketingBaseline, marketingForm, performAction]);

  const updateMarketingBoolean = useCallback(
    (section: string, configKey: string, value: boolean, undo?: UndoState) => {
      void performAction(
        'set_marketing_config',
        { section, configKey, value },
        {
          undo,
          successMessage: `Updated ${section}.${configKey}`,
          optimisticUpdater: (c) => ({
            ...c,
            marketingConfig: [
              ...c.marketingConfig.filter(
                (e) => !(e.section === section && e.config_key === configKey),
              ),
              {
                id: `optimistic:${section}:${configKey}`,
                environment: c.environment,
                section,
                config_key: configKey,
                value,
                description: null,
                created_by: null,
                updated_by: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
            ],
          }),
        },
      );
    },
    [performAction],
  );

  const updateOpsToggle = useCallback(
    (settingKey: string, enabled: boolean, destructive = false) => {
      void performAction(
        'set_system_setting',
        {
          category: 'ops',
          settingKey,
          value: { enabled },
          eventType: `ops.${settingKey}.updated`,
        },
        {
          confirmText: destructive
            ? 'This action affects all tenants. Do you want to continue?'
            : undefined,
          undo: {
            label: `Undo ${settingKey}`,
            action: 'set_system_setting',
            payload: {
              category: 'ops',
              settingKey,
              value: { enabled: !enabled },
              eventType: `ops.${settingKey}.updated`,
            },
          },
          successMessage: `${settingKey} ${enabled ? 'enabled' : 'disabled'}`,
          optimisticUpdater: (c) => ({
            ...c,
            systemSettings: [
              ...c.systemSettings.filter(
                (e) => !(e.category === 'ops' && e.setting_key === settingKey),
              ),
              {
                id: `optimistic:ops:${settingKey}`,
                environment: c.environment,
                category: 'ops',
                setting_key: settingKey,
                value: { enabled },
                description: null,
                created_by: null,
                updated_by: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
            ],
          }),
        },
      );
    },
    [performAction],
  );

  const updateRateLimitMultiplier = useCallback(
    (multiplier: number) => {
      void performAction(
        'set_system_setting',
        {
          category: 'ops',
          settingKey: 'rate_limit_mode',
          value: { multiplier },
          eventType: 'ops.rate_limit_mode.updated',
        },
        {
          successMessage: 'Rate limit multiplier updated.',
          optimisticUpdater: (c) => ({
            ...c,
            systemSettings: [
              ...c.systemSettings.filter(
                (e) =>
                  !(
                    e.category === 'ops' && e.setting_key === 'rate_limit_mode'
                  ),
              ),
              {
                id: 'optimistic:ops:rate_limit_mode',
                environment: c.environment,
                category: 'ops',
                setting_key: 'rate_limit_mode',
                value: { multiplier },
                description: null,
                created_by: null,
                updated_by: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
            ],
          }),
        },
      );
    },
    [performAction],
  );

  const updateIntegration = useCallback(
    (integrationKey: string, value: Partial<IntegrationControl>) => {
      const existing =
        snapshot?.integrations.find((e) => e.key === integrationKey)?.value ??
        ({
          enabled: true,
          connection_status: 'disconnected',
          last_sync_at: null,
          last_error: null,
          error_logs: [],
          scopes: [],
          enabled_scopes: [],
          retry_requested_at: null,
        } satisfies IntegrationControl);
      void performAction(
        'set_integration_control',
        { integrationKey, value },
        {
          successMessage: `${integrationKey} updated`,
          optimisticUpdater: (c) => ({
            ...c,
            integrations: [
              ...c.integrations.filter((e) => e.key !== integrationKey),
              {
                key: integrationKey,
                value: { ...existing, ...value } as IntegrationControl,
              },
            ],
          }),
        },
      );
    },
    [performAction, snapshot?.integrations],
  );

  const requestIntegrationRetry = useCallback(
    (integrationKey: string) => {
      void performAction(
        'retry_integration',
        { integrationKey },
        {
          confirmText: `Request retry for ${integrationKey.replaceAll('_', ' ')} now?`,
          successMessage: `${integrationKey} retry requested`,
        },
      );
    },
    [performAction],
  );

  const enqueueJob = useCallback(
    (jobType: string) => {
      const label = jobType
        .replaceAll('_', ' ')
        .replace(/\b\w/g, (l) => l.toUpperCase());
      void performAction(
        'enqueue_job',
        { jobType },
        { confirmText: `Queue ${label}?`, successMessage: `${label} queued.` },
      );
    },
    [performAction],
  );

  const exportConfig = useCallback(() => {
    if (!snapshot) return;
    const blob = new Blob(
      [
        JSON.stringify(
          {
            exported_at: new Date().toISOString(),
            environment: snapshot.environment,
            runtime_version: snapshot.runtimeVersion,
            feature_flags: snapshot.featureFlags,
            marketing_config: snapshot.marketingConfig,
            system_settings: snapshot.systemSettings,
          },
          null,
          2,
        ),
      ],
      { type: 'application/json' },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `formaos-control-plane-${snapshot.environment}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [snapshot]);

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="h-8 w-64 animate-pulse rounded-md bg-slate-800" />
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-lg bg-slate-900/60"
            />
          ))}
        </div>
        <div className="h-[420px] animate-pulse rounded-lg bg-slate-900/60" />
      </div>
    );
  }

  if (!snapshot) {
    return (
      <div className="rounded-lg border border-red-800/40 bg-red-950/30 p-6 text-red-100">
        {error ?? 'Failed to load control plane.'}
      </div>
    );
  }

  const maintenanceMode = readOpsValue(settingsMap, 'maintenance_mode');
  const readOnlyMode = readOpsValue(settingsMap, 'read_only_mode');
  const emergencyLockdown = readOpsValue(settingsMap, 'emergency_lockdown');
  const rateLimitMultiplier = readRateLimitMultiplier(settingsMap);
  const rolloutFlags = snapshot.featureFlags.filter(
    (f) => f.rollout_percentage < 100,
  ).length;
  const marketingDirty = !areMarketingFormsEqual(
    marketingForm,
    marketingBaseline,
  );

  return (
    <div className="space-y-6">
      <CommandCenterHeader
        snapshot={snapshot}
        adminStreamStatus={adminStreamStatus}
        error={error}
        bannerMessage={bannerMessage}
        undoState={undoState}
        rolloutFlags={rolloutFlags}
        onRefresh={() => void refresh()}
        onExportConfig={exportConfig}
        onPerformAction={performAction}
        onClearUndo={() => setUndoState(null)}
      />
      <CommandCenterMetrics
        maintenanceMode={maintenanceMode}
        readOnlyMode={readOnlyMode}
        marketingRuntime={marketingRuntime}
        featureFlags={snapshot.featureFlags}
        flagDraft={flagDraft}
        pendingAction={pendingAction}
        onUpdateOpsToggle={updateOpsToggle}
        onUpdateMarketingBoolean={updateMarketingBoolean}
        onSetFlagDraft={setFlagDraft}
        onSubmitFeatureFlag={submitFeatureFlag}
        onPerformAction={performAction}
      />
      <CommandCenterMarketing
        marketingForm={marketingForm}
        marketingRuntime={marketingRuntime}
        marketingBaseline={marketingBaseline}
        marketingDirty={marketingDirty}
        pendingAction={pendingAction}
        onSetMarketingForm={setMarketingForm}
        onSaveMarketingForm={saveMarketingForm}
        onPerformAction={performAction}
      />
      <CommandCenterIntegrations
        integrations={snapshot.integrations}
        onUpdateIntegration={updateIntegration}
        onRequestIntegrationRetry={requestIntegrationRetry}
      />
      <CommandCenterOps
        maintenanceMode={maintenanceMode}
        readOnlyMode={readOnlyMode}
        emergencyLockdown={emergencyLockdown}
        rateLimitMultiplier={rateLimitMultiplier}
        health={snapshot.health}
        jobs={snapshot.jobs}
        audit={snapshot.audit}
        pendingAction={pendingAction}
        onUpdateOpsToggle={updateOpsToggle}
        onUpdateRateLimitMultiplier={updateRateLimitMultiplier}
        onEnqueueJob={enqueueJob}
      />
    </div>
  );
}
