import type {
  AdminControlPlaneSnapshot,
  RuntimeMarketingConfig,
  SystemSettingRecord,
} from '@/lib/control-plane/types';
import type { MarketingFormState } from './command-center-types';

export async function fetchSnapshot(signal?: AbortSignal) {
  const response = await fetch('/api/admin/control-plane', {
    cache: 'no-store',
    signal,
  });

  if (!response.ok) {
    const payload: Record<string, unknown> = await response
      .json()
      .catch(() => ({}));
    throw new Error(
      (payload.error as string) || 'Failed to load control plane',
    );
  }

  return (await response.json()) as AdminControlPlaneSnapshot;
}

export function coerceJsonObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

export function makeSettingsMap(settings: SystemSettingRecord[]) {
  return new Map(
    settings.map((item) => [`${item.category}:${item.setting_key}`, item]),
  );
}

export function readOpsValue(
  settings: Map<string, SystemSettingRecord>,
  settingKey: string,
  defaultEnabled = false,
) {
  const value = coerceJsonObject(settings.get(`ops:${settingKey}`)?.value);
  return typeof value.enabled === 'boolean' ? value.enabled : defaultEnabled;
}

export function readRateLimitMultiplier(
  settings: Map<string, SystemSettingRecord>,
) {
  const value = coerceJsonObject(settings.get('ops:rate_limit_mode')?.value);
  return typeof value.multiplier === 'number' ? value.multiplier : 1;
}

export function fromLocalInput(localValue: string) {
  if (!localValue) return null;
  const date = new Date(localValue);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

export function parseVariantWeights(raw: string) {
  if (!raw.trim()) return {};

  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('Variants must be a JSON object');
    }

    const entries = Object.entries(parsed as Record<string, unknown>).map(
      ([key, value]) => [key, Number(value)] as [string, number],
    );
    return Object.fromEntries(
      entries.filter(
        ([key, value]) =>
          key.trim().length > 0 && Number.isFinite(value) && value > 0,
      ),
    );
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : 'Invalid variant JSON',
    );
  }
}

export function toMarketingFormState(
  runtime: RuntimeMarketingConfig,
): MarketingFormState {
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

export function upsertMarketingConfigRecord(
  current: AdminControlPlaneSnapshot,
  section: string,
  configKey: string,
  value: unknown,
): AdminControlPlaneSnapshot {
  return {
    ...current,
    marketingConfig: [
      ...current.marketingConfig.filter(
        (entry) =>
          !(entry.section === section && entry.config_key === configKey),
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

export function areMarketingFormsEqual(
  a: MarketingFormState,
  b: MarketingFormState,
) {
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
