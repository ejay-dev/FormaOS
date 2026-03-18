'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  Download,
  Gauge,
  Lock,
  PlayCircle,
  RefreshCcw,
  Shield,
  ShieldAlert,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Wrench,
} from 'lucide-react';
import { VirtualizedList } from '@/components/control-plane/virtualized-list';
import {
  ADMIN_AUTOMATION_ACTIONS,
  DEFAULT_RUNTIME_MARKETING,
} from '@/lib/control-plane/defaults';
import type {
  AdminControlPlaneSnapshot,
  IntegrationControl,
  RuntimeMarketingConfig,
  SystemSettingRecord,
} from '@/lib/control-plane/types';

type UndoState = {
  label: string;
  action: string;
  payload: Record<string, unknown>;
};

type FeatureFlagDraft = {
  flagKey: string;
  scopeType: 'global' | 'organization' | 'user';
  scopeId: string;
  enabled: boolean;
  killSwitch: boolean;
  rolloutPercentage: number;
  variantsText: string;
  defaultVariant: string;
  description: string;
  isPublic: boolean;
  startAt: string;
  endAt: string;
};

type MarketingFormState = {
  badgeText: string;
  headlinePrimary: string;
  headlineAccent: string;
  subheadline: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
  themeVariant: string;
  backgroundVariant: string;
  activeShowcaseModule: string;
};

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

async function fetchSnapshot(signal?: AbortSignal) {
  const response = await fetch('/api/admin/control-plane', {
    cache: 'no-store',
    signal,
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || 'Failed to load control plane');
  }

  return (await response.json()) as AdminControlPlaneSnapshot;
}

function coerceJsonObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function makeSettingsMap(settings: SystemSettingRecord[]) {
  return new Map(settings.map((item) => [`${item.category}:${item.setting_key}`, item]));
}

function readOpsValue(
  settings: Map<string, SystemSettingRecord>,
  settingKey: string,
  defaultEnabled = false,
) {
  const value = coerceJsonObject(settings.get(`ops:${settingKey}`)?.value);
  return typeof value.enabled === 'boolean' ? value.enabled : defaultEnabled;
}

function readRateLimitMultiplier(settings: Map<string, SystemSettingRecord>) {
  const value = coerceJsonObject(settings.get('ops:rate_limit_mode')?.value);
  return typeof value.multiplier === 'number' ? value.multiplier : 1;
}

function toLocalInput(isoValue: string | null) {
  if (!isoValue) return '';
  const date = new Date(isoValue);
  if (Number.isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset() * 60_000;
  const local = new Date(date.getTime() - offset);
  return local.toISOString().slice(0, 16);
}

function fromLocalInput(localValue: string) {
  if (!localValue) return null;
  const date = new Date(localValue);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function parseVariantWeights(raw: string) {
  if (!raw.trim()) return {};

  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('Variants must be a JSON object');
    }

    const entries = Object.entries(parsed as Record<string, unknown>).map(
      ([key, value]) => [key, Number(value)] as [string, number],
    );
    const next = Object.fromEntries(
      entries.filter(
        ([key, value]) =>
          key.trim().length > 0 && Number.isFinite(value) && value > 0,
      ),
    );

    return next;
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : 'Invalid variant JSON',
    );
  }
}

function labelFromJobType(jobType: string) {
  return jobType
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function toMarketingFormState(runtime: RuntimeMarketingConfig): MarketingFormState {
  return {
    badgeText: runtime.hero.badgeText,
    headlinePrimary: runtime.hero.headlinePrimary,
    headlineAccent: runtime.hero.headlineAccent,
    subheadline: runtime.hero.subheadline,
    primaryCtaLabel: runtime.hero.primaryCtaLabel,
    primaryCtaHref: runtime.hero.primaryCtaHref,
    secondaryCtaLabel: runtime.hero.secondaryCtaLabel,
    secondaryCtaHref: runtime.hero.secondaryCtaHref,
    themeVariant: runtime.runtime.themeVariant,
    backgroundVariant: runtime.runtime.backgroundVariant,
    activeShowcaseModule: runtime.runtime.activeShowcaseModule,
  };
}

function upsertMarketingConfigRecord(
  current: AdminControlPlaneSnapshot,
  section: string,
  configKey: string,
  value: unknown,
): AdminControlPlaneSnapshot {
  return {
    ...current,
    marketingConfig: [
      ...current.marketingConfig.filter(
        (entry) => !(entry.section === section && entry.config_key === configKey),
      ),
      {
        id: `optimistic:${section}:${configKey}`,
        environment: current.environment,
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
  };
}

function areMarketingFormsEqual(a: MarketingFormState, b: MarketingFormState) {
  return (
    a.badgeText === b.badgeText &&
    a.headlinePrimary === b.headlinePrimary &&
    a.headlineAccent === b.headlineAccent &&
    a.subheadline === b.subheadline &&
    a.primaryCtaLabel === b.primaryCtaLabel &&
    a.primaryCtaHref === b.primaryCtaHref &&
    a.secondaryCtaLabel === b.secondaryCtaLabel &&
    a.secondaryCtaHref === b.secondaryCtaHref &&
    a.themeVariant === b.themeVariant &&
    a.backgroundVariant === b.backgroundVariant &&
    a.activeShowcaseModule === b.activeShowcaseModule
  );
}

export function AdminCommandCenter() {
  const [snapshot, setSnapshot] = useState<AdminControlPlaneSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [undoState, setUndoState] = useState<UndoState | null>(null);
  const [flagDraft, setFlagDraft] = useState<FeatureFlagDraft>(DEFAULT_FLAG_DRAFT);
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
      const message =
        fetchError instanceof Error ? fetchError.message : 'Runtime unavailable';
      setError(message);
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
      .catch((fetchError) => {
        const message =
          fetchError instanceof Error ? fetchError.message : 'Runtime unavailable';
        setError(message);
      })
      .finally(() => {
        setLoading(false);
      });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    let closed = false;

    const closeStream = () => {
      if (adminStreamRef.current) {
        adminStreamRef.current.close();
        adminStreamRef.current = null;
      }
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
      reconnectTimerRef.current = setTimeout(() => {
        connectStream();
      }, delay);
    };

    const connectStream = () => {
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
          const next = JSON.parse(event.data) as AdminControlPlaneSnapshot;
          setSnapshot(next);
          setError(null);
          setAdminStreamStatus('connected');
        } catch {
          // Ignore malformed events.
        }
      };

      stream.onerror = () => {
        setAdminStreamStatus('disconnected');
        setError('Live updates disconnected. Reconnecting...');
        closeStream();
        scheduleReconnect();
      };
    };

    const handleBeforeUnload = () => {
      closed = true;
      clearReconnect();
      closeStream();
    };

    connectStream();
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      closed = true;
      window.removeEventListener('beforeunload', handleBeforeUnload);
      clearReconnect();
      closeStream();
    };
  }, []);

  useEffect(() => {
    return () => {
      if (closeUndoTimerRef.current) {
        clearTimeout(closeUndoTimerRef.current);
      }
    };
  }, []);

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
        if (row.config_key === 'badge_text' && typeof row.value === 'string') {
          next.hero.badgeText = row.value;
        }
        if (row.config_key === 'headline_primary' && typeof row.value === 'string') {
          next.hero.headlinePrimary = row.value;
        }
        if (row.config_key === 'headline_accent' && typeof row.value === 'string') {
          next.hero.headlineAccent = row.value;
        }
        if (row.config_key === 'subheadline' && typeof row.value === 'string') {
          next.hero.subheadline = row.value;
        }
        if (row.config_key === 'primary_cta_label' && typeof row.value === 'string') {
          next.hero.primaryCtaLabel = row.value;
        }
        if (row.config_key === 'primary_cta_href' && typeof row.value === 'string') {
          next.hero.primaryCtaHref = row.value;
        }
        if (row.config_key === 'secondary_cta_label' && typeof row.value === 'string') {
          next.hero.secondaryCtaLabel = row.value;
        }
        if (row.config_key === 'secondary_cta_href' && typeof row.value === 'string') {
          next.hero.secondaryCtaHref = row.value;
        }
      }

      if (row.section === 'home.runtime') {
        if (
          row.config_key === 'expensive_effects_enabled' &&
          typeof row.value === 'boolean'
        ) {
          next.runtime.expensiveEffectsEnabled = row.value;
        }
        if (row.config_key === 'active_showcase_module' && typeof row.value === 'string') {
          next.runtime.activeShowcaseModule = row.value;
        }
        if (
          row.config_key === 'showcase_modules' &&
          row.value &&
          typeof row.value === 'object' &&
          !Array.isArray(row.value)
        ) {
          next.runtime.showcaseModules = Object.fromEntries(
            Object.entries(row.value as Record<string, unknown>).map(([key, value]) => [
              key,
              Boolean(value),
            ]),
          );
        }
        if (
          row.config_key === 'section_visibility' &&
          row.value &&
          typeof row.value === 'object' &&
          !Array.isArray(row.value)
        ) {
          next.runtime.sectionVisibility = Object.fromEntries(
            Object.entries(row.value as Record<string, unknown>).map(([key, value]) => [
              key,
              Boolean(value),
            ]),
          );
        }
        if (row.config_key === 'theme_variant' && typeof row.value === 'string') {
          next.runtime.themeVariant = row.value;
        }
        if (row.config_key === 'background_variant' && typeof row.value === 'string') {
          next.runtime.backgroundVariant = row.value;
        }
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
          current: AdminControlPlaneSnapshot,
        ) => AdminControlPlaneSnapshot;
        skipRefresh?: boolean;
        rethrowError?: boolean;
      },
    ) => {
      if (options?.confirmText && !window.confirm(options.confirmText)) {
        return;
      }

      const previousSnapshot = snapshot;

      try {
        setPendingAction(action);
        setBannerMessage(null);

        if (previousSnapshot && options?.optimisticUpdater) {
          setSnapshot(options.optimisticUpdater(previousSnapshot));
        }

        const response = await fetch('/api/admin/control-plane', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action,
            payload,
          }),
        });

        const json = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(json.error || `Failed to run ${action}`);
        }

        if (options?.undo) {
          setUndoState(options.undo);
          if (closeUndoTimerRef.current) {
            clearTimeout(closeUndoTimerRef.current);
          }
          closeUndoTimerRef.current = setTimeout(() => {
            setUndoState(null);
          }, 10_000);
        }

        setBannerMessage(options?.successMessage ?? `${action} applied.`);
        if (!options?.skipRefresh) {
          void refresh();
        }
      } catch (actionError) {
        const message =
          actionError instanceof Error
            ? actionError.message
            : `Failed to run ${action}`;
        setError(message);
        if (previousSnapshot && options?.optimisticUpdater) {
          setSnapshot(previousSnapshot);
        }
        if (options?.rethrowError) {
          throw actionError;
        }
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
        {
          successMessage: 'Feature flag updated.',
        },
      );
      setFlagDraft(DEFAULT_FLAG_DRAFT);
    } catch (submissionError) {
      const message =
        submissionError instanceof Error
          ? submissionError.message
          : 'Invalid feature flag configuration';
      setError(message);
    }
  }, [flagDraft, performAction]);

  const saveMarketingForm = useCallback(async () => {
    const previousForm = marketingBaseline;
    const entries: Array<{ section: string; configKey: string; value: string }> = [
      { section: 'home.hero', configKey: 'badge_text', value: marketingForm.badgeText },
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
      { section: 'home.hero', configKey: 'subheadline', value: marketingForm.subheadline },
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
      for (let index = 0; index < entries.length; index += 1) {
        const entry = entries[index];
        await performAction(
          'set_marketing_config',
          {
            section: entry.section,
            configKey: entry.configKey,
            value: entry.value,
          },
          {
            skipRefresh: index !== entries.length - 1,
            rethrowError: true,
            optimisticUpdater: (current) =>
              upsertMarketingConfigRecord(
                current,
                entry.section,
                entry.configKey,
                entry.value,
              ),
            successMessage:
              index === entries.length - 1
                ? 'Marketing controls saved.'
                : undefined,
          },
        );
      }
    } catch {
      setMarketingForm(previousForm);
      setBannerMessage('Marketing save failed. Reverted local draft.');
    }
  }, [marketingBaseline, marketingForm, performAction]);

  const updateMarketingBoolean = useCallback(
    (section: string, configKey: string, value: boolean, undo?: UndoState) => {
      void performAction(
        'set_marketing_config',
        {
          section,
          configKey,
          value,
        },
        {
          undo,
          successMessage: `Updated ${section}.${configKey}`,
          optimisticUpdater: (current) => ({
            ...current,
            marketingConfig: [
              ...current.marketingConfig.filter(
                (entry) => !(entry.section === section && entry.config_key === configKey),
              ),
              {
                id: `optimistic:${section}:${configKey}`,
                environment: current.environment,
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
          optimisticUpdater: (current) => ({
            ...current,
            systemSettings: [
              ...current.systemSettings.filter(
                (entry) =>
                  !(entry.category === 'ops' && entry.setting_key === settingKey),
              ),
              {
                id: `optimistic:ops:${settingKey}`,
                environment: current.environment,
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
          value: {
            multiplier,
          },
          eventType: 'ops.rate_limit_mode.updated',
        },
        {
          successMessage: 'Rate limit multiplier updated.',
          optimisticUpdater: (current) => ({
            ...current,
            systemSettings: [
              ...current.systemSettings.filter(
                (entry) =>
                  !(entry.category === 'ops' && entry.setting_key === 'rate_limit_mode'),
              ),
              {
                id: 'optimistic:ops:rate_limit_mode',
                environment: current.environment,
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
        snapshot?.integrations.find((entry) => entry.key === integrationKey)?.value ??
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
        {
          integrationKey,
          value,
        },
        {
          successMessage: `${integrationKey} updated`,
          optimisticUpdater: (current) => ({
            ...current,
            integrations: [
              ...current.integrations.filter((entry) => entry.key !== integrationKey),
              {
                key: integrationKey,
                value: {
                  ...existing,
                  ...value,
                } as IntegrationControl,
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
        {
          integrationKey,
        },
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
      void performAction(
        'enqueue_job',
        {
          jobType,
        },
        {
          confirmText: `Queue ${labelFromJobType(jobType)}?`,
          successMessage: `${labelFromJobType(jobType)} queued.`,
        },
      );
    },
    [performAction],
  );

  const exportConfig = useCallback(() => {
    if (!snapshot) return;
    const payload = {
      exported_at: new Date().toISOString(),
      environment: snapshot.environment,
      runtime_version: snapshot.runtimeVersion,
      feature_flags: snapshot.featureFlags,
      marketing_config: snapshot.marketingConfig,
      system_settings: snapshot.systemSettings,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `formaos-control-plane-${snapshot.environment}-${Date.now()}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }, [snapshot]);

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="h-8 w-64 animate-pulse rounded-md bg-slate-800" />
        <div className="grid gap-4 md:grid-cols-3">
          <div className="h-24 animate-pulse rounded-lg bg-slate-900/60" />
          <div className="h-24 animate-pulse rounded-lg bg-slate-900/60" />
          <div className="h-24 animate-pulse rounded-lg bg-slate-900/60" />
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
    (flag) => flag.rollout_percentage < 100,
  ).length;
  const latestAudit = snapshot.audit[0] ?? null;
  const marketingDirty = !areMarketingFormsEqual(marketingForm, marketingBaseline);

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-100">Admin Control Plane</h1>
            <p className="mt-1 text-sm text-slate-400">
              Founder-only command center with live runtime control and immutable audit.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`rounded border px-2 py-1 text-xs ${
                adminStreamStatus === 'connected'
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                  : adminStreamStatus === 'connecting'
                    ? 'border-amber-500/40 bg-amber-500/10 text-amber-200'
                    : 'border-rose-500/40 bg-rose-500/10 text-rose-200'
              }`}
            >
              Stream {adminStreamStatus}
            </span>
            <button
              type="button"
              onClick={() => void refresh()}
              className="inline-flex items-center gap-1 rounded border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-700"
            >
              <RefreshCcw className="h-3.5 w-3.5" />
              Refresh
            </button>
            <button
              type="button"
              onClick={exportConfig}
              className="inline-flex items-center gap-1 rounded border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-700"
            >
              <Download className="h-3.5 w-3.5" />
              Export Config
            </button>
          </div>
        </div>

        {latestAudit ? (
          <div className="mt-3 rounded border border-slate-800 bg-slate-950/40 px-3 py-2 text-xs text-slate-400">
            Last updated by {latestAudit.actor_user_id ?? 'system'} at{' '}
            {new Date(latestAudit.created_at).toLocaleString()} ({latestAudit.event_type})
          </div>
        ) : null}

        {error ? (
          <div className="mt-4 rounded border border-red-800/40 bg-red-950/30 px-3 py-2 text-xs text-red-200">
            {error}
          </div>
        ) : null}

        {bannerMessage ? (
          <div className="mt-4 rounded border border-emerald-700/30 bg-emerald-900/20 px-3 py-2 text-xs text-emerald-200">
            {bannerMessage}
          </div>
        ) : null}

        {undoState ? (
          <div className="mt-4 flex items-center justify-between gap-3 rounded border border-cyan-700/30 bg-cyan-900/20 px-3 py-2 text-xs text-cyan-100">
            <span>{undoState.label}</span>
            <button
              type="button"
              onClick={() => {
                void performAction(undoState.action, undoState.payload, {
                  successMessage: 'Undo applied.',
                });
                setUndoState(null);
              }}
              className="rounded border border-cyan-500/50 px-2 py-1 text-cyan-100 hover:bg-cyan-700/30"
            >
              Undo
            </button>
          </div>
        ) : null}

        <div className="mt-5 grid gap-3 md:grid-cols-4">
          <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-3">
            <p className="text-xs text-slate-500">Feature flags</p>
            <p className="mt-1 text-2xl font-semibold text-slate-100">
              {snapshot.featureFlags.length}
            </p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-3">
            <p className="text-xs text-slate-500">Rollout flags</p>
            <p className="mt-1 text-2xl font-semibold text-slate-100">{rolloutFlags}</p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-3">
            <p className="text-xs text-slate-500">Queued jobs</p>
            <p className="mt-1 text-2xl font-semibold text-slate-100">
              {snapshot.health.queue.queued}
            </p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-3">
            <p className="text-xs text-slate-500">DB latency</p>
            <p className="mt-1 text-2xl font-semibold text-slate-100">
              {snapshot.health.databaseLatencyMs}ms
            </p>
          </div>
        </div>
      </section>

      <section className="sticky top-20 z-20 rounded-xl border border-rose-800/40 bg-rose-950/25 p-4 backdrop-blur">
        <div className="mb-3 flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-rose-300" />
          <h2 className="text-sm font-semibold text-rose-100">Pinned Kill Switches</h2>
        </div>
        <div className="grid gap-2 md:grid-cols-3">
          <button
            type="button"
            title="Immediately pauses customer operations during maintenance."
            onClick={() => updateOpsToggle('maintenance_mode', !maintenanceMode, true)}
            className={`rounded border px-3 py-2 text-left text-xs ${
              maintenanceMode
                ? 'border-amber-600/50 bg-amber-900/30 text-amber-100'
                : 'border-slate-700 bg-slate-900/60 text-slate-200 hover:bg-slate-800'
            }`}
          >
            <div className="font-medium">Maintenance mode</div>
            <div className="mt-1 text-[11px] opacity-90">
              {maintenanceMode ? 'Enabled' : 'Disabled'}
            </div>
          </button>

          <button
            type="button"
            title="Forces read-only behavior for non-admin writes."
            onClick={() => updateOpsToggle('read_only_mode', !readOnlyMode, true)}
            className={`rounded border px-3 py-2 text-left text-xs ${
              readOnlyMode
                ? 'border-cyan-600/50 bg-cyan-900/30 text-cyan-100'
                : 'border-slate-700 bg-slate-900/60 text-slate-200 hover:bg-slate-800'
            }`}
          >
            <div className="font-medium">Read-only mode</div>
            <div className="mt-1 text-[11px] opacity-90">
              {readOnlyMode ? 'Enabled' : 'Disabled'}
            </div>
          </button>

          <button
            type="button"
            title="Disables expensive visual effects on marketing pages."
            onClick={() =>
              updateMarketingBoolean(
                'home.runtime',
                'expensive_effects_enabled',
                !marketingRuntime.runtime.expensiveEffectsEnabled,
                {
                  label: 'Undo disable heavy effects toggle',
                  action: 'set_marketing_config',
                  payload: {
                    section: 'home.runtime',
                    configKey: 'expensive_effects_enabled',
                    value: marketingRuntime.runtime.expensiveEffectsEnabled,
                  },
                },
              )
            }
            className={`rounded border px-3 py-2 text-left text-xs ${
              marketingRuntime.runtime.expensiveEffectsEnabled
                ? 'border-emerald-600/50 bg-emerald-900/30 text-emerald-100'
                : 'border-rose-600/50 bg-rose-900/30 text-rose-100'
            }`}
          >
            <div className="font-medium">Disable heavy effects</div>
            <div className="mt-1 text-[11px] opacity-90">
              {marketingRuntime.runtime.expensiveEffectsEnabled ? 'Effects enabled' : 'Effects disabled'}
            </div>
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-cyan-300" />
          <h2 className="text-lg font-semibold text-slate-100">Feature Flags & Experiments</h2>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <input
            value={flagDraft.flagKey}
            onChange={(event) =>
              setFlagDraft((prev) => ({ ...prev, flagKey: event.target.value }))
            }
            placeholder="flag key (e.g. marketing_new_hero)"
            className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
          />
          <select
            value={flagDraft.scopeType}
            onChange={(event) =>
              setFlagDraft((prev) => ({
                ...prev,
                scopeType: event.target.value as FeatureFlagDraft['scopeType'],
              }))
            }
            className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
          >
            <option value="global">Global</option>
            <option value="organization">Organization</option>
            <option value="user">User</option>
          </select>
          <input
            value={flagDraft.scopeId}
            onChange={(event) =>
              setFlagDraft((prev) => ({ ...prev, scopeId: event.target.value }))
            }
            disabled={flagDraft.scopeType === 'global'}
            placeholder={flagDraft.scopeType === 'global' ? 'N/A for global' : 'org/user id'}
            className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 disabled:opacity-50"
          />
          <input
            value={flagDraft.description}
            onChange={(event) =>
              setFlagDraft((prev) => ({ ...prev, description: event.target.value }))
            }
            placeholder="description"
            className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 md:col-span-2"
          />
          <input
            type="number"
            min={0}
            max={100}
            value={flagDraft.rolloutPercentage}
            onChange={(event) =>
              setFlagDraft((prev) => ({
                ...prev,
                rolloutPercentage: Number(event.target.value || 0),
              }))
            }
            placeholder="rollout %"
            className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
          />
          <textarea
            value={flagDraft.variantsText}
            onChange={(event) =>
              setFlagDraft((prev) => ({ ...prev, variantsText: event.target.value }))
            }
            placeholder='{"control": 50, "variant": 50}'
            className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 md:col-span-2"
          />
          <input
            value={flagDraft.defaultVariant}
            onChange={(event) =>
              setFlagDraft((prev) => ({ ...prev, defaultVariant: event.target.value }))
            }
            placeholder="default variant"
            className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
          />
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={flagDraft.enabled}
              onChange={(event) =>
                setFlagDraft((prev) => ({ ...prev, enabled: event.target.checked }))
              }
            />
            Enabled
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={flagDraft.killSwitch}
              onChange={(event) =>
                setFlagDraft((prev) => ({ ...prev, killSwitch: event.target.checked }))
              }
            />
            Kill switch
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={flagDraft.isPublic}
              onChange={(event) =>
                setFlagDraft((prev) => ({ ...prev, isPublic: event.target.checked }))
              }
            />
            Public runtime
          </label>
          <input
            type="datetime-local"
            value={flagDraft.startAt}
            onChange={(event) =>
              setFlagDraft((prev) => ({ ...prev, startAt: event.target.value }))
            }
            className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
          />
          <input
            type="datetime-local"
            value={flagDraft.endAt}
            onChange={(event) =>
              setFlagDraft((prev) => ({ ...prev, endAt: event.target.value }))
            }
            className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
          />
          <button
            type="button"
            disabled={pendingAction !== null}
            onClick={() => void submitFeatureFlag()}
            className="rounded bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-500 disabled:opacity-60"
          >
            Save Flag
          </button>
        </div>

        <div className="mt-5 space-y-2">
          {snapshot.featureFlags.map((flag) => {
            const onToggle = !flag.enabled;
            return (
              <div
                key={flag.id}
                className="rounded-lg border border-slate-800 bg-slate-950/40 p-3"
              >
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                  <span className="rounded border border-slate-700 px-2 py-0.5 text-slate-200">
                    {flag.flag_key}
                  </span>
                  <span>{flag.scope_type}</span>
                  {flag.scope_id ? <span>• {flag.scope_id}</span> : null}
                  <span>• rollout {flag.rollout_percentage}%</span>
                  {flag.start_at || flag.end_at ? (
                    <span>
                      • window {toLocalInput(flag.start_at)} → {toLocalInput(flag.end_at)}
                    </span>
                  ) : null}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    title="Toggle enable/disable"
                    onClick={() => {
                      void performAction(
                        'set_feature_flag',
                        {
                          flagKey: flag.flag_key,
                          scopeType: flag.scope_type,
                          scopeId: flag.scope_id,
                          enabled: onToggle,
                          killSwitch: flag.kill_switch,
                          rolloutPercentage: flag.rollout_percentage,
                          variants: flag.variants,
                          defaultVariant: flag.default_variant,
                          description: flag.description,
                          isPublic: flag.is_public,
                          startAt: flag.start_at,
                          endAt: flag.end_at,
                        },
                        {
                          undo: {
                            label: `Undo ${flag.flag_key}`,
                            action: 'set_feature_flag',
                            payload: {
                              flagKey: flag.flag_key,
                              scopeType: flag.scope_type,
                              scopeId: flag.scope_id,
                              enabled: flag.enabled,
                              killSwitch: flag.kill_switch,
                              rolloutPercentage: flag.rollout_percentage,
                              variants: flag.variants,
                              defaultVariant: flag.default_variant,
                              description: flag.description,
                              isPublic: flag.is_public,
                              startAt: flag.start_at,
                              endAt: flag.end_at,
                            },
                          },
                          successMessage: `${flag.flag_key} ${onToggle ? 'enabled' : 'disabled'}`,
                        },
                      );
                    }}
                    className="inline-flex items-center gap-1 rounded border border-slate-700 px-2 py-1 text-xs text-slate-200 hover:bg-slate-800"
                  >
                    {flag.enabled ? (
                      <ToggleRight className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <ToggleLeft className="h-4 w-4 text-slate-500" />
                    )}
                    {flag.enabled ? 'Enabled' : 'Disabled'}
                  </button>

                  <button
                    type="button"
                    title="Emergency kill-switch"
                    onClick={() => {
                      void performAction(
                        'set_feature_flag',
                        {
                          flagKey: flag.flag_key,
                          scopeType: flag.scope_type,
                          scopeId: flag.scope_id,
                          enabled: flag.enabled,
                          killSwitch: !flag.kill_switch,
                          rolloutPercentage: flag.rollout_percentage,
                          variants: flag.variants,
                          defaultVariant: flag.default_variant,
                          description: flag.description,
                          isPublic: flag.is_public,
                          startAt: flag.start_at,
                          endAt: flag.end_at,
                        },
                        {
                          confirmText: !flag.kill_switch
                            ? `Enable kill-switch for ${flag.flag_key}?`
                            : undefined,
                          undo: {
                            label: `Undo kill-switch for ${flag.flag_key}`,
                            action: 'set_feature_flag',
                            payload: {
                              flagKey: flag.flag_key,
                              scopeType: flag.scope_type,
                              scopeId: flag.scope_id,
                              enabled: flag.enabled,
                              killSwitch: flag.kill_switch,
                              rolloutPercentage: flag.rollout_percentage,
                              variants: flag.variants,
                              defaultVariant: flag.default_variant,
                              description: flag.description,
                              isPublic: flag.is_public,
                              startAt: flag.start_at,
                              endAt: flag.end_at,
                            },
                          },
                          successMessage: `${flag.flag_key} kill-switch ${
                            !flag.kill_switch ? 'enabled' : 'disabled'
                          }`,
                        },
                      );
                    }}
                    className={`inline-flex items-center gap-1 rounded border px-2 py-1 text-xs ${
                      flag.kill_switch
                        ? 'border-rose-700/50 bg-rose-900/20 text-rose-200'
                        : 'border-slate-700 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <ShieldAlert className="h-3.5 w-3.5" />
                    Kill switch
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-indigo-300" />
          <h2 className="text-lg font-semibold text-slate-100">Site / Marketing Controls</h2>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-sm text-slate-300">
            Hero badge
            <input
              value={marketingForm.badgeText}
              onChange={(event) =>
                setMarketingForm((prev) => ({ ...prev, badgeText: event.target.value }))
              }
              className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
            />
          </label>

          <label className="text-sm text-slate-300">
            Hero headline (primary)
            <input
              value={marketingForm.headlinePrimary}
              onChange={(event) =>
                setMarketingForm((prev) => ({ ...prev, headlinePrimary: event.target.value }))
              }
              className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
            />
          </label>

          <label className="text-sm text-slate-300">
            Hero headline (accent)
            <input
              value={marketingForm.headlineAccent}
              onChange={(event) =>
                setMarketingForm((prev) => ({ ...prev, headlineAccent: event.target.value }))
              }
              className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
            />
          </label>

          <label className="text-sm text-slate-300">
            Hero subheadline
            <textarea
              value={marketingForm.subheadline}
              onChange={(event) =>
                setMarketingForm((prev) => ({ ...prev, subheadline: event.target.value }))
              }
              className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
            />
          </label>

          <label className="text-sm text-slate-300">
            Primary CTA label
            <input
              value={marketingForm.primaryCtaLabel}
              onChange={(event) =>
                setMarketingForm((prev) => ({ ...prev, primaryCtaLabel: event.target.value }))
              }
              className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
            />
          </label>
          <label className="text-sm text-slate-300">
            Primary CTA link
            <input
              value={marketingForm.primaryCtaHref}
              onChange={(event) =>
                setMarketingForm((prev) => ({ ...prev, primaryCtaHref: event.target.value }))
              }
              className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
            />
          </label>

          <label className="text-sm text-slate-300">
            Secondary CTA label
            <input
              value={marketingForm.secondaryCtaLabel}
              onChange={(event) =>
                setMarketingForm((prev) => ({ ...prev, secondaryCtaLabel: event.target.value }))
              }
              className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
            />
          </label>
          <label className="text-sm text-slate-300">
            Secondary CTA link
            <input
              value={marketingForm.secondaryCtaHref}
              onChange={(event) =>
                setMarketingForm((prev) => ({ ...prev, secondaryCtaHref: event.target.value }))
              }
              className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
            />
          </label>

          <label className="text-sm text-slate-300">
            Theme variant
            <input
              value={marketingForm.themeVariant}
              onChange={(event) =>
                setMarketingForm((prev) => ({ ...prev, themeVariant: event.target.value }))
              }
              className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
            />
          </label>
          <label className="text-sm text-slate-300">
            Background variant
            <input
              value={marketingForm.backgroundVariant}
              onChange={(event) =>
                setMarketingForm((prev) => ({ ...prev, backgroundVariant: event.target.value }))
              }
              className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
            />
          </label>

          <label className="text-sm text-slate-300">
            Active showcase module
            <select
              value={marketingForm.activeShowcaseModule}
              onChange={(event) =>
                setMarketingForm((prev) => ({
                  ...prev,
                  activeShowcaseModule: event.target.value,
                }))
              }
              className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
            >
              {Object.keys(marketingRuntime.runtime.showcaseModules).map((key) => (
                <option key={key} value={key}>
                  {key}
                </option>
              ))}
            </select>
          </label>

          <div className="md:col-span-2 flex flex-wrap items-center justify-end gap-2 rounded border border-slate-800 bg-slate-950/50 p-3">
            <button
              type="button"
              disabled={!marketingDirty || pendingAction !== null}
              onClick={() => setMarketingForm(marketingBaseline)}
              className="rounded border border-slate-700 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-800 disabled:opacity-50"
            >
              Revert
            </button>
            <button
              type="button"
              disabled={!marketingDirty || pendingAction !== null}
              onClick={() => void saveMarketingForm()}
              className="rounded bg-cyan-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-cyan-500 disabled:opacity-50"
            >
              Apply / Save
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <div className="rounded border border-slate-800 bg-slate-950/50 p-3">
            <p className="text-sm text-slate-100">Section visibility</p>
            <div className="mt-2 grid gap-1">
              {Object.entries(marketingRuntime.runtime.sectionVisibility).map(
                ([section, visible]) => (
                  <button
                    key={section}
                    type="button"
                    onClick={() => {
                      const next = {
                        ...marketingRuntime.runtime.sectionVisibility,
                        [section]: !visible,
                      };
                      void performAction(
                        'set_marketing_config',
                        {
                          section: 'home.runtime',
                          configKey: 'section_visibility',
                          value: next,
                        },
                        {
                          undo: {
                            label: `Undo section visibility for ${section}`,
                            action: 'set_marketing_config',
                            payload: {
                              section: 'home.runtime',
                              configKey: 'section_visibility',
                              value: marketingRuntime.runtime.sectionVisibility,
                            },
                          },
                          successMessage: `${section} ${!visible ? 'shown' : 'hidden'}`,
                        },
                      );
                    }}
                    className="flex items-center justify-between rounded border border-slate-800 px-2 py-1 text-xs text-slate-200 hover:bg-slate-800"
                  >
                    <span>{section}</span>
                    {visible ? (
                      <ToggleRight className="h-3.5 w-3.5 text-emerald-400" />
                    ) : (
                      <ToggleLeft className="h-3.5 w-3.5 text-slate-500" />
                    )}
                  </button>
                ),
              )}
            </div>
          </div>

          <div className="rounded border border-slate-800 bg-slate-950/50 p-3">
            <p className="text-sm text-slate-100">Showcase modules</p>
            <div className="mt-2 grid gap-1">
              {Object.entries(marketingRuntime.runtime.showcaseModules).map(
                ([moduleKey, enabled]) => (
                  <button
                    key={moduleKey}
                    type="button"
                    onClick={() => {
                      const next = {
                        ...marketingRuntime.runtime.showcaseModules,
                        [moduleKey]: !enabled,
                      };
                      void performAction(
                        'set_marketing_config',
                        {
                          section: 'home.runtime',
                          configKey: 'showcase_modules',
                          value: next,
                        },
                        {
                          undo: {
                            label: `Undo showcase module toggle for ${moduleKey}`,
                            action: 'set_marketing_config',
                            payload: {
                              section: 'home.runtime',
                              configKey: 'showcase_modules',
                              value: marketingRuntime.runtime.showcaseModules,
                            },
                          },
                          successMessage: `${moduleKey} ${!enabled ? 'enabled' : 'disabled'}`,
                        },
                      );
                    }}
                    className="flex items-center justify-between rounded border border-slate-800 px-2 py-1 text-xs text-slate-200 hover:bg-slate-800"
                  >
                    <span>{moduleKey}</span>
                    {enabled ? (
                      <ToggleRight className="h-3.5 w-3.5 text-emerald-400" />
                    ) : (
                      <ToggleLeft className="h-3.5 w-3.5 text-slate-500" />
                    )}
                  </button>
                ),
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
        <div className="mb-4 flex items-center gap-2">
          <Wrench className="h-4 w-4 text-amber-300" />
          <h2 className="text-lg font-semibold text-slate-100">Integrations Control</h2>
        </div>

        <div className="space-y-3">
          {snapshot.integrations.map((integration) => (
            <div
              key={integration.key}
              className="rounded-lg border border-slate-800 bg-slate-950/40 p-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-slate-100">{integration.key}</p>
                  <p className="text-xs text-slate-500">
                    Status: {integration.value.connection_status} · Last sync:{' '}
                    {integration.value.last_sync_at
                      ? new Date(integration.value.last_sync_at).toLocaleString()
                      : 'never'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      updateIntegration(integration.key, {
                        enabled: !integration.value.enabled,
                      })
                    }
                    className="inline-flex items-center gap-1 rounded border border-slate-700 px-2 py-1 text-xs text-slate-200 hover:bg-slate-800"
                  >
                    {integration.value.enabled ? (
                      <ToggleRight className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <ToggleLeft className="h-4 w-4 text-slate-500" />
                    )}
                    {integration.value.enabled ? 'Enabled' : 'Disabled'}
                  </button>
                  <button
                    type="button"
                    onClick={() => requestIntegrationRetry(integration.key)}
                    className="inline-flex items-center gap-1 rounded border border-slate-700 px-2 py-1 text-xs text-slate-200 hover:bg-slate-800"
                  >
                    <RefreshCcw className="h-3.5 w-3.5" />
                    Retry
                  </button>
                </div>
              </div>

              {integration.value.last_error ? (
                <p className="mt-2 rounded border border-rose-700/40 bg-rose-900/20 px-2 py-1 text-xs text-rose-100">
                  {integration.value.last_error}
                </p>
              ) : null}

              <div className="mt-2 flex flex-wrap gap-2">
                {integration.value.scopes.map((scope) => {
                  const enabled = integration.value.enabled_scopes.includes(scope);
                  return (
                    <button
                      key={scope}
                      type="button"
                      title="Toggle OAuth scope"
                      onClick={() => {
                        const nextEnabledScopes = enabled
                          ? integration.value.enabled_scopes.filter((entry) => entry !== scope)
                          : [...integration.value.enabled_scopes, scope];

                        updateIntegration(integration.key, {
                          enabled_scopes: nextEnabledScopes,
                        });
                      }}
                      className={`rounded border px-2 py-0.5 text-[11px] ${
                        enabled
                          ? 'border-emerald-700/50 bg-emerald-900/20 text-emerald-200'
                          : 'border-slate-700 text-slate-400'
                      }`}
                    >
                      {scope}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
        <div className="mb-4 flex items-center gap-2">
          <Shield className="h-4 w-4 text-rose-300" />
          <h2 className="text-lg font-semibold text-slate-100">Ops & Security</h2>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <button
            type="button"
            onClick={() => updateOpsToggle('maintenance_mode', !maintenanceMode, true)}
            className={`rounded-lg border p-3 text-left ${
              maintenanceMode
                ? 'border-amber-700/50 bg-amber-900/20'
                : 'border-slate-800 bg-slate-950/50'
            }`}
          >
            <div className="text-sm text-slate-100">Maintenance mode</div>
            <div className="mt-1 text-xs text-slate-400">
              Block customer operations during controlled maintenance windows.
            </div>
            <div className="mt-2 text-xs text-amber-200">
              {maintenanceMode ? 'Enabled' : 'Disabled'}
            </div>
          </button>

          <button
            type="button"
            onClick={() => updateOpsToggle('read_only_mode', !readOnlyMode, true)}
            className={`rounded-lg border p-3 text-left ${
              readOnlyMode
                ? 'border-cyan-700/50 bg-cyan-900/20'
                : 'border-slate-800 bg-slate-950/50'
            }`}
          >
            <div className="text-sm text-slate-100">Read-only mode</div>
            <div className="mt-1 text-xs text-slate-400">
              Freeze mutating writes while preserving read access.
            </div>
            <div className="mt-2 text-xs text-cyan-200">
              {readOnlyMode ? 'Enabled' : 'Disabled'}
            </div>
          </button>

          <button
            type="button"
            onClick={() =>
              updateOpsToggle('emergency_lockdown', !emergencyLockdown, true)
            }
            className={`rounded-lg border p-3 text-left ${
              emergencyLockdown
                ? 'border-rose-700/50 bg-rose-900/20'
                : 'border-slate-800 bg-slate-950/50'
            }`}
          >
            <div className="text-sm text-slate-100">Emergency lock-down</div>
            <div className="mt-1 text-xs text-slate-400">
              Immediate incident response gate across app and marketing surfaces.
            </div>
            <div className="mt-2 text-xs text-rose-200">
              {emergencyLockdown ? 'Enabled' : 'Disabled'}
            </div>
          </button>

          <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-3">
            <div className="text-sm text-slate-100">Rate limit multiplier</div>
            <div className="mt-1 text-xs text-slate-400">
              Increase or reduce API throttle globally.
            </div>
            <input
              type="number"
              step="0.1"
              min="0.1"
              defaultValue={rateLimitMultiplier}
              onBlur={(event) => updateRateLimitMultiplier(Number(event.target.value || 1))}
              className="mt-2 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-100"
            />
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded border border-slate-800 bg-slate-950/50 p-3">
            <div className="flex items-center gap-2 text-sm text-slate-200">
              <Database className="h-4 w-4 text-cyan-300" />
              DB Latency
            </div>
            <p className="mt-2 text-2xl font-semibold text-slate-100">
              {snapshot.health.databaseLatencyMs}ms
            </p>
          </div>
          <div className="rounded border border-slate-800 bg-slate-950/50 p-3">
            <div className="flex items-center gap-2 text-sm text-slate-200">
              <Gauge className="h-4 w-4 text-emerald-300" />
              API Health
            </div>
            <p className="mt-2 text-2xl font-semibold text-slate-100">
              {snapshot.health.apiHealthy ? 'Healthy' : 'Degraded'}
            </p>
          </div>
          <div className="rounded border border-slate-800 bg-slate-950/50 p-3">
            <div className="flex items-center gap-2 text-sm text-slate-200">
              <Shield className="h-4 w-4 text-amber-300" />
              Queue status
            </div>
            <p className="mt-2 text-sm text-slate-300">
              queued: {snapshot.health.queue.queued} · running: {snapshot.health.queue.running} ·
              failed: {snapshot.health.queue.failed}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
        <div className="mb-4 flex items-center gap-2">
          <PlayCircle className="h-4 w-4 text-emerald-300" />
          <h2 className="text-lg font-semibold text-slate-100">Admin Automation</h2>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {ADMIN_AUTOMATION_ACTIONS.map((action) => (
            <button
              key={action}
              type="button"
              disabled={pendingAction !== null}
              onClick={() => enqueueJob(action)}
              className="rounded border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-800 disabled:opacity-60"
            >
              {labelFromJobType(action)}
            </button>
          ))}
        </div>

        <VirtualizedList
          items={snapshot.jobs}
          itemHeight={94}
          height={360}
          getKey={(item) => item.id}
          renderItem={(job) => (
            <div className="rounded border border-slate-800 bg-slate-950/40 p-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>{labelFromJobType(job.job_type)}</span>
                <span>
                  {job.status} • {job.progress}%
                </span>
              </div>
              <div className="mt-2 h-1.5 w-full rounded bg-slate-800">
                <div
                  className="h-1.5 rounded bg-cyan-500"
                  style={{ width: `${job.progress}%` }}
                />
              </div>
              <div className="mt-2 truncate text-xs text-slate-300">
                {job.logs[job.logs.length - 1]?.message || 'No logs yet'}
              </div>
              {job.status === 'failed' && job.error_message ? (
                <div className="mt-1 text-xs text-rose-300">{job.error_message}</div>
              ) : null}
            </div>
          )}
        />
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
        <div className="mb-4 flex items-center gap-2">
          <Lock className="h-4 w-4 text-slate-200" />
          <h2 className="text-lg font-semibold text-slate-100">Live Audit Stream</h2>
        </div>

        <VirtualizedList
          items={snapshot.audit}
          itemHeight={86}
          height={420}
          getKey={(item) => item.id}
          renderItem={(entry) => (
            <div className="rounded border border-slate-800 bg-slate-950/40 p-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-mono text-slate-200">{entry.event_type}</span>
                <span>{new Date(entry.created_at).toLocaleString()}</span>
              </div>
              <div className="mt-1 text-xs text-slate-400">
                {entry.target_type}
                {entry.target_id ? `:${entry.target_id}` : ''}
              </div>
              <div className="mt-1 truncate text-xs text-slate-500">
                actor: {entry.actor_user_id ?? 'system'}
              </div>
            </div>
          )}
        />
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-xs text-slate-400">
        <div className="flex flex-wrap items-center gap-2">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
          Every write is persisted to Supabase and appended to immutable `audit_log`.
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-300" />
          Destructive actions require confirmation; toggles expose undo for 10 seconds.
        </div>
      </section>
    </div>
  );
}
