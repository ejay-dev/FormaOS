export type ControlPlaneEnvironment = 'production' | 'preview' | 'development';

export type FeatureFlagScopeType = 'global' | 'organization' | 'user';

export type FeatureFlagRecord = {
  id: string;
  flag_key: string;
  description: string | null;
  environment: string;
  scope_type: FeatureFlagScopeType;
  scope_id: string | null;
  enabled: boolean;
  kill_switch: boolean;
  rollout_percentage: number;
  variants: Record<string, number>;
  default_variant: string | null;
  start_at: string | null;
  end_at: string | null;
  is_public: boolean;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

export type MarketingConfigRecord = {
  id: string;
  environment: string;
  section: string;
  config_key: string;
  value: unknown;
  description: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

export type SystemSettingRecord = {
  id: string;
  environment: string;
  category: string;
  setting_key: string;
  value: unknown;
  description: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

export type AdminJobStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'cancelled';

export type AdminJobRecord = {
  id: string;
  job_type: string;
  status: AdminJobStatus;
  payload: Record<string, unknown>;
  progress: number;
  logs: Array<{ at: string; level: 'info' | 'warn' | 'error'; message: string }>;
  result: Record<string, unknown>;
  error_message: string | null;
  requested_by: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type AuditLogRecord = {
  id: string;
  actor_user_id: string | null;
  event_type: string;
  target_type: string;
  target_id: string | null;
  environment: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type FeatureDecision = {
  enabled: boolean;
  variant: string | null;
  reason: string;
  scopeType: FeatureFlagScopeType | 'none';
};

export type RuntimeOpsConfig = {
  maintenanceMode: boolean;
  readOnlyMode: boolean;
  emergencyLockdown: boolean;
  rateLimitMultiplier: number;
};

export type RuntimeMarketingConfig = {
  hero: {
    badgeText: string;
    headlinePrimary: string;
    headlineAccent: string;
    subheadline: string;
    primaryCtaLabel: string;
    primaryCtaHref: string;
    secondaryCtaLabel: string;
    secondaryCtaHref: string;
  };
  runtime: {
    expensiveEffectsEnabled: boolean;
    activeShowcaseModule: string;
    showcaseModules: Record<string, boolean>;
    sectionVisibility: Record<string, boolean>;
    themeVariant: string;
    backgroundVariant: string;
  };
};

export type RuntimeSnapshot = {
  version: string;
  environment: ControlPlaneEnvironment;
  lastUpdateAt: string;
  streamVersion: string;
  evaluationMode: 'global' | 'organization' | 'user';
  ops: RuntimeOpsConfig;
  marketing: RuntimeMarketingConfig;
  featureFlags: Record<string, FeatureDecision>;
};

export type IntegrationControl = {
  enabled: boolean;
  connection_status: 'connected' | 'disconnected' | 'error' | 'syncing';
  last_sync_at: string | null;
  last_error: string | null;
  error_logs: Array<{ at: string; message: string }>;
  scopes: string[];
  enabled_scopes: string[];
  retry_requested_at: string | null;
};

export type AdminControlPlaneSnapshot = {
  environment: ControlPlaneEnvironment;
  runtimeVersion: string;
  featureFlags: FeatureFlagRecord[];
  marketingConfig: MarketingConfigRecord[];
  systemSettings: SystemSettingRecord[];
  integrations: Array<{
    key: string;
    value: IntegrationControl;
  }>;
  jobs: AdminJobRecord[];
  audit: AuditLogRecord[];
  health: {
    databaseLatencyMs: number;
    apiHealthy: boolean;
    queue: {
      queued: number;
      running: number;
      failed: number;
      succeededLast24h: number;
    };
  };
};

export type FeatureFlagContext = {
  userId?: string | null;
  orgId?: string | null;
  anonymousId?: string | null;
};
