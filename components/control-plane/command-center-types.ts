import type { Dispatch, SetStateAction } from 'react';
import type {
  AdminControlPlaneSnapshot,
  AuditLogRecord,
  FeatureFlagRecord,
  IntegrationControl,
  RuntimeMarketingConfig,
} from '@/lib/control-plane/types';

export type UndoState = {
  label: string;
  action: string;
  payload: Record<string, unknown>;
};

export type FeatureFlagDraft = {
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

export type MarketingFormState = {
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

export type PerformActionFn = (
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
) => Promise<void>;

export interface CommandCenterHeaderProps {
  snapshot: AdminControlPlaneSnapshot;
  adminStreamStatus: 'connecting' | 'connected' | 'disconnected';
  error: string | null;
  bannerMessage: string | null;
  undoState: UndoState | null;
  rolloutFlags: number;
  onRefresh: () => void;
  onExportConfig: () => void;
  onPerformAction: PerformActionFn;
  onClearUndo: () => void;
}

export interface CommandCenterMetricsProps {
  maintenanceMode: boolean;
  readOnlyMode: boolean;
  marketingRuntime: RuntimeMarketingConfig;
  featureFlags: FeatureFlagRecord[];
  flagDraft: FeatureFlagDraft;
  pendingAction: string | null;
  onUpdateOpsToggle: (
    settingKey: string,
    enabled: boolean,
    destructive?: boolean,
  ) => void;
  onUpdateMarketingBoolean: (
    section: string,
    configKey: string,
    value: boolean,
    undo?: UndoState,
  ) => void;
  onSetFlagDraft: Dispatch<SetStateAction<FeatureFlagDraft>>;
  onSubmitFeatureFlag: () => Promise<void>;
  onPerformAction: PerformActionFn;
}

export interface CommandCenterMarketingProps {
  marketingForm: MarketingFormState;
  marketingRuntime: RuntimeMarketingConfig;
  marketingBaseline: MarketingFormState;
  marketingDirty: boolean;
  pendingAction: string | null;
  onSetMarketingForm: Dispatch<SetStateAction<MarketingFormState>>;
  onSaveMarketingForm: () => Promise<void>;
  onPerformAction: PerformActionFn;
}

export interface CommandCenterIntegrationsProps {
  integrations: AdminControlPlaneSnapshot['integrations'];
  onUpdateIntegration: (
    integrationKey: string,
    value: Partial<IntegrationControl>,
  ) => void;
  onRequestIntegrationRetry: (integrationKey: string) => void;
}

export interface CommandCenterOpsProps {
  maintenanceMode: boolean;
  readOnlyMode: boolean;
  emergencyLockdown: boolean;
  rateLimitMultiplier: number;
  health: AdminControlPlaneSnapshot['health'];
  jobs: AdminControlPlaneSnapshot['jobs'];
  audit: AuditLogRecord[];
  pendingAction: string | null;
  onUpdateOpsToggle: (
    settingKey: string,
    enabled: boolean,
    destructive?: boolean,
  ) => void;
  onUpdateRateLimitMultiplier: (multiplier: number) => void;
  onEnqueueJob: (jobType: string) => void;
}

export function toLocalInput(isoValue: string | null) {
  if (!isoValue) return '';
  const date = new Date(isoValue);
  if (Number.isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset() * 60_000;
  const local = new Date(date.getTime() - offset);
  return local.toISOString().slice(0, 16);
}

export function labelFromJobType(jobType: string) {
  return jobType
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
