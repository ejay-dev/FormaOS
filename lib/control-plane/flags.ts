import type {
  FeatureDecision,
  FeatureFlagContext,
  FeatureFlagRecord,
} from '@/lib/control-plane/types';

function stableHash(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0);
}

function resolveScheduleActive(flag: FeatureFlagRecord, nowIso: string): boolean {
  const now = Date.parse(nowIso);
  const starts = flag.start_at ? Date.parse(flag.start_at) : null;
  const ends = flag.end_at ? Date.parse(flag.end_at) : null;

  if (starts && Number.isFinite(starts) && now < starts) return false;
  if (ends && Number.isFinite(ends) && now >= ends) return false;
  return true;
}

function rolloutIdentity(
  key: string,
  context: FeatureFlagContext,
  scopeType: FeatureFlagRecord['scope_type'],
): string {
  if (scopeType === 'user') {
    return `${key}:${context.userId ?? context.anonymousId ?? 'anon'}`;
  }
  if (scopeType === 'organization') {
    return `${key}:${context.orgId ?? context.userId ?? context.anonymousId ?? 'anon'}`;
  }
  return `${key}:${context.userId ?? context.orgId ?? context.anonymousId ?? 'anon'}`;
}

function chooseVariant(
  flag: FeatureFlagRecord,
  seed: string,
): string | null {
  const entries = Object.entries(flag.variants ?? {}).filter(
    ([name, weight]) => name && typeof weight === 'number' && weight > 0,
  );

  if (!entries.length) {
    return flag.default_variant ?? null;
  }

  const total = entries.reduce((sum, [, weight]) => sum + Number(weight), 0);
  if (total <= 0) return flag.default_variant ?? null;

  const bucket = stableHash(seed) % total;
  let cursor = 0;
  for (const [variant, weight] of entries) {
    cursor += Number(weight);
    if (bucket < cursor) {
      return variant;
    }
  }

  return flag.default_variant ?? entries[0][0];
}

function selectMostSpecificFlag(
  rows: FeatureFlagRecord[],
  context: FeatureFlagContext,
): FeatureFlagRecord | null {
  const byUser = rows.find(
    (row) => row.scope_type === 'user' && row.scope_id && row.scope_id === context.userId,
  );
  if (byUser) return byUser;

  const byOrg = rows.find(
    (row) =>
      row.scope_type === 'organization' && row.scope_id && row.scope_id === context.orgId,
  );
  if (byOrg) return byOrg;

  return rows.find((row) => row.scope_type === 'global') ?? null;
}

export function evaluateFeatureDecision(
  key: string,
  rows: FeatureFlagRecord[],
  context: FeatureFlagContext,
  nowIso = new Date().toISOString(),
): FeatureDecision {
  const selected = selectMostSpecificFlag(rows, context);

  if (!selected) {
    return {
      enabled: false,
      variant: null,
      reason: 'not-configured',
      scopeType: 'none',
    };
  }

  if (selected.kill_switch) {
    return {
      enabled: false,
      variant: null,
      reason: 'kill-switch',
      scopeType: selected.scope_type,
    };
  }

  if (!resolveScheduleActive(selected, nowIso)) {
    return {
      enabled: false,
      variant: null,
      reason: 'outside-schedule',
      scopeType: selected.scope_type,
    };
  }

  if (!selected.enabled) {
    return {
      enabled: false,
      variant: null,
      reason: 'disabled',
      scopeType: selected.scope_type,
    };
  }

  const identity = rolloutIdentity(key, context, selected.scope_type);
  const bucket = stableHash(identity) % 100;
  const inRollout = bucket < selected.rollout_percentage;

  if (!inRollout) {
    return {
      enabled: false,
      variant: null,
      reason: 'outside-rollout',
      scopeType: selected.scope_type,
    };
  }

  return {
    enabled: true,
    variant: chooseVariant(selected, identity),
    reason: 'enabled',
    scopeType: selected.scope_type,
  };
}
