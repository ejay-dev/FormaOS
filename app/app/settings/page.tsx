import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BellRing,
  Bot,
  Building2,
  CreditCard,
  FileClock,
  Globe,
  PlugZap,
  ShieldCheck,
  UserCog,
  type LucideIcon,
} from 'lucide-react';

import { updateOrganization } from '@/app/app/actions/org';
import { AppearanceSettings } from '@/components/settings/appearance-settings';
import { PlainEnglishToggle } from '@/components/settings/plain-english-toggle';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { getBranding, getDefaultFeatures, getFeatureToggles } from '@/lib/settings/settings-engine';
import { roleRequiresMFA } from '@/lib/security/mfa-enforcement';
import { getDirectorySyncStatus } from '@/lib/sso/directory-sync';
import { getOrgSsoConfig } from '@/lib/sso/org-sso';
import { fetchSystemState } from '@/lib/system-state/server';
import { PLAN_CATALOG } from '@/lib/plans';
import { getIntegrationStatus } from '@/lib/integrations/manager';
import { listAuditorAccess } from '@/lib/auditor/portal';
import { PageHero, type PageHeroMetric } from '@/components/ui/page-hero';

type OrganizationRow = {
  id: string;
  name: string;
  industry: string | null;
  team_size: string | null;
  plan_key: string | null;
  frameworks: string[] | null;
  onboarding_completed: boolean | null;
};

type MembershipRow = {
  role: string | null;
  mfa_required: boolean | null;
};

type UserSecurityRow = {
  two_factor_enabled: boolean | null;
};

type NotificationChannelRow = {
  channel_type: string;
  verified: boolean;
};

type NotificationPreferenceRow = {
  channel: string;
  enabled: boolean;
  digest_frequency: string | null;
  quiet_hours: Record<string, unknown> | null;
};

type EmailPreferenceRow = {
  enabled: boolean | null;
  frequency: string | null;
  enabled_events: unknown;
};

type ExecutiveDigestConfig = {
  enabled?: boolean;
  frequency?: string;
  recipients?: string[];
};

type SettingsArea = {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  summary: Array<{
    label: string;
    value: string;
    tone?: 'default' | 'positive' | 'warning' | 'danger';
  }>;
  links?: Array<{ href: string; label: string }>;
};

async function saveWorkspaceProfileAction(formData: FormData) {
  'use server';

  await updateOrganization({
    name: String(formData.get('name') ?? '').trim(),
    industry: String(formData.get('industry') ?? '').trim() || undefined,
    teamSize: String(formData.get('teamSize') ?? '').trim() || undefined,
  });
}

function formatPlanName(planKey: string | null | undefined) {
  if (!planKey) return 'Evaluation access';
  return PLAN_CATALOG[planKey as keyof typeof PLAN_CATALOG]?.name ?? 'Plan';
}

function titleCase(value: string | null | undefined) {
  if (!value) return 'Unknown';
  return value
    .replace(/_/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

export default async function SettingsPage() {
  const systemState = await fetchSystemState();
  if (!systemState) {
    redirect('/workspace-recovery?from=settings-page');
  }

  const admin = createSupabaseAdminClient();
  const orgId = systemState.organization.id;
  const userId = systemState.user.id;
  const canManageWorkspace =
    systemState.role === 'owner' || systemState.role === 'admin';

  const [
    organizationResult,
    membershipResult,
    userSecurityResult,
    memberCountResult,
    atRiskCountResult,
    customRolesCountResult,
    activePoliciesCountResult,
    activeHoldsCountResult,
    aiIndexResult,
    notificationChannelsResult,
    notificationPreferencesResult,
    emailPreferencesResult,
    executiveDigestResult,
    branding,
    featureToggles,
    integrationStatus,
    orgSso,
    directoryStatus,
    auditorAccess,
  ] = await Promise.all([
    admin
      .from('organizations')
      .select('id, name, industry, team_size, plan_key, frameworks, onboarding_completed')
      .eq('id', orgId)
      .maybeSingle(),
    admin
      .from('org_members')
      .select('role, mfa_required')
      .eq('organization_id', orgId)
      .eq('user_id', userId)
      .maybeSingle(),
    admin
      .from('user_security')
      .select('two_factor_enabled')
      .eq('user_id', userId)
      .maybeSingle(),
    admin
      .from('org_members')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId),
    admin
      .from('at_risk_credentials')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId),
    admin
      .from('custom_roles')
      .select('id', { count: 'exact', head: true })
      .eq('org_id', orgId),
    admin
      .from('retention_policies')
      .select('id', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .eq('is_active', true),
    admin
      .from('legal_holds')
      .select('id', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .eq('status', 'active'),
    admin.from('ai_index_status').select('status').eq('org_id', orgId),
    admin
      .from('notification_channels')
      .select('channel_type, verified')
      .eq('org_id', orgId)
      .eq('user_id', userId),
    admin
      .from('notification_preferences')
      .select('channel, enabled, digest_frequency, quiet_hours')
      .eq('org_id', orgId)
      .eq('user_id', userId),
    admin
      .from('email_preferences')
      .select('enabled, frequency, enabled_events')
      .eq('user_id', userId)
      .eq('organization_id', orgId)
      .maybeSingle(),
    admin
      .from('org_settings')
      .select('value')
      .eq('organization_id', orgId)
      .eq('key', 'executive_digest')
      .maybeSingle(),
    getBranding(orgId),
    getFeatureToggles(orgId),
    getIntegrationStatus(orgId),
    getOrgSsoConfig(orgId),
    getDirectorySyncStatus(orgId),
    listAuditorAccess(orgId),
  ]);

  const organization =
    (organizationResult.data as OrganizationRow | null) ?? {
      id: orgId,
      name: systemState.organization.name,
      industry: systemState.organization.industry,
      team_size: null,
      plan_key: systemState.subscription?.planKey ?? null,
      frameworks: null,
      onboarding_completed: systemState.organization.onboardingCompleted,
    };
  const membership = membershipResult.data as MembershipRow | null;
  const userSecurity = userSecurityResult.data as UserSecurityRow | null;
  const notificationChannels =
    (notificationChannelsResult.data as NotificationChannelRow[] | null) ?? [];
  const notificationPreferences =
    (notificationPreferencesResult.data as NotificationPreferenceRow[] | null) ??
    [];
  const emailPreferences =
    (emailPreferencesResult.data as EmailPreferenceRow | null) ?? null;
  const executiveDigest =
    (executiveDigestResult.data?.value as ExecutiveDigestConfig | null) ?? null;

  const memberCount = memberCountResult.count ?? 0;
  const atRiskCount = atRiskCountResult.count ?? 0;
  const customRoleCount = customRolesCountResult.count ?? 0;
  const activePoliciesCount = activePoliciesCountResult.count ?? 0;
  const activeHoldsCount = activeHoldsCountResult.count ?? 0;

  const featureDefaults = getDefaultFeatures();
  const featureEntries = Object.entries(featureDefaults).map(([key, definition]) => ({
    key,
    label: definition.label,
    enabled: featureToggles[key] ?? definition.default,
  }));
  const enabledFeatureCount = featureEntries.filter((feature) => feature.enabled).length;
  const enabledFeatureLabels = featureEntries
    .filter((feature) => feature.enabled)
    .slice(0, 3)
    .map((feature) => feature.label);

  const integratedCount = integrationStatus.filter((item) => item.connected).length;
  const healthyIntegrationCount = integrationStatus.filter(
    (item) => item.health === 'healthy',
  ).length;

  const aiRows = aiIndexResult.data ?? [];
  const aiIndexedCount = aiRows.filter((row) => row.status === 'indexed').length;
  const aiFailedCount = aiRows.filter((row) => row.status === 'failed').length;
  const aiPendingCount = aiRows.filter((row) => row.status === 'pending').length;

  const verifiedChannelCount = notificationChannels.filter(
    (channel) => channel.verified,
  ).length;
  const quietHoursRecord = notificationPreferences.find(
    (preference) =>
      preference.quiet_hours &&
      Object.keys(preference.quiet_hours).length > 0,
  )?.quiet_hours;
  const quietHoursEnabled =
    quietHoursRecord?.enabled === true ||
      quietHoursRecord?.enabled === 'true';
  const enabledEmailEvents = Array.isArray(emailPreferences?.enabled_events)
    ? (emailPreferences.enabled_events as unknown[]).filter(
        (event): event is string => typeof event === 'string',
      )
    : [];

  const mfaRequired =
    membership?.mfa_required ?? roleRequiresMFA(membership?.role ?? null);
  const mfaEnabled = userSecurity?.two_factor_enabled ?? false;
  const directoryProviderCount = directoryStatus.configs.length;
  const activeAuditorGrantCount = auditorAccess.filter(
    (grant) => grant.status === 'active',
  ).length;

  const planName = formatPlanName(systemState.subscription?.planKey ?? null);
  const planSummary = systemState.subscription?.trialActive
    ? `${systemState.subscription.trialDaysRemaining} day${systemState.subscription.trialDaysRemaining === 1 ? '' : 's'} left in trial`
    : titleCase(systemState.subscription?.status ?? systemState.organization.plan);

  const brandingCustomized = Boolean(
    branding?.logo_url ||
      branding?.custom_domain ||
      branding?.login_message ||
      branding?.email_footer ||
      branding?.primary_color ||
      branding?.secondary_color,
  );
  const executiveDigestEnabled = Boolean(executiveDigest?.enabled);
  const executiveDigestFrequency = executiveDigest?.frequency ?? 'weekly';
  const executiveDigestRecipientCount = executiveDigest?.recipients?.length ?? 0;
  const accountEmailDomain = systemState.user.email.split('@')[1] ?? 'Not available';
  const frameworkLabels = Array.isArray(organization.frameworks)
    ? organization.frameworks
        .filter(Boolean)
        .map((framework) => framework.toUpperCase())
    : [];
  const hasMissingIdentityData = !organization.industry || !organization.team_size;

  const healthState =
    atRiskCount > 0
      ? 'alerts'
      : hasMissingIdentityData
        ? 'review'
        : 'healthy';

  const settingsAreas: SettingsArea[] = [
    {
      title: 'Security & identity',
      description:
        'Multi-factor authentication, SAML SSO, and directory sync for your workspace.',
      href: '/app/settings/security',
      icon: ShieldCheck,
      summary: [
        {
          label: 'MFA',
          value: mfaEnabled ? 'Enabled' : mfaRequired ? 'Required' : 'Optional',
          tone: mfaEnabled ? 'positive' : mfaRequired ? 'warning' : 'default',
        },
        {
          label: 'SSO',
          value: orgSso?.enabled
            ? orgSso.enforceSso
              ? 'Enforced'
              : 'Enabled'
            : 'Off',
          tone: orgSso?.enabled ? 'positive' : 'default',
        },
        {
          label: 'Directory sync',
          value:
            directoryProviderCount > 0
              ? `${directoryProviderCount} configured`
              : 'Not configured',
          tone: directoryProviderCount > 0 ? 'positive' : 'default',
        },
      ],
    },
    {
      title: 'Communications',
      description:
        'Channel routing, quiet hours, the emails you receive, and the executive digest.',
      href: '/app/settings/notifications',
      icon: BellRing,
      summary: [
        {
          label: 'Channels',
          value:
            notificationChannels.length > 0
              ? `${notificationChannels.length} connected, ${verifiedChannelCount} verified`
              : 'None connected',
          tone: notificationChannels.length > 0 ? 'positive' : 'default',
        },
        {
          label: 'Quiet hours',
          value: quietHoursEnabled ? 'On' : 'Off',
          tone: quietHoursEnabled ? 'positive' : 'default',
        },
        {
          label: 'Email alerts',
          value:
            emailPreferences?.enabled === false
              ? 'Turned off'
              : enabledEmailEvents.includes('compliance_alert')
                ? 'On'
                : 'Default',
          tone: emailPreferences?.enabled === false ? 'warning' : 'default',
        },
        {
          label: 'Executive digest',
          value: executiveDigestEnabled
            ? `${titleCase(executiveDigestFrequency)} to ${executiveDigestRecipientCount} recipient${executiveDigestRecipientCount === 1 ? '' : 's'}`
            : 'Off',
          tone: executiveDigestEnabled ? 'positive' : 'default',
        },
      ],
      links: [
        { href: '/app/settings/email-history', label: 'Email history' },
        { href: '/app/settings/executive-digest', label: 'Executive digest' },
      ],
    },
    {
      title: 'Roles & external access',
      description:
        'Custom roles, permission shaping, and auditor portal grants.',
      href: '/app/settings/roles',
      icon: UserCog,
      summary: [
        {
          label: 'Custom roles',
          value: `${customRoleCount}`,
          tone: customRoleCount > 0 ? 'positive' : 'default',
        },
        {
          label: 'Auditor grants',
          value:
            activeAuditorGrantCount > 0
              ? `${activeAuditorGrantCount} active`
              : 'None active',
          tone: activeAuditorGrantCount > 0 ? 'positive' : 'default',
        },
        {
          label: 'Your access',
          value: titleCase(systemState.role),
        },
      ],
      links: [
        { href: '/app/settings/auditor-access', label: 'Auditor access' },
      ],
    },
    {
      title: 'Retention & governance',
      description:
        'Retention schedules, legal holds, and document lifecycle controls.',
      href: '/app/settings/retention',
      icon: FileClock,
      summary: [
        {
          label: 'Policies',
          value: `${activePoliciesCount} active`,
          tone: activePoliciesCount > 0 ? 'positive' : 'default',
        },
        {
          label: 'Legal holds',
          value:
            activeHoldsCount > 0 ? `${activeHoldsCount} active` : 'None active',
          tone: activeHoldsCount > 0 ? 'warning' : 'default',
        },
        {
          label: 'Credential alerts',
          value: atRiskCount > 0 ? `${atRiskCount}` : '0',
          tone: atRiskCount > 0 ? 'danger' : 'positive',
        },
      ],
    },
    {
      title: 'Integrations',
      description:
        'Connected channels, issue trackers, webhooks, and evidence connectors.',
      href: '/app/settings/integrations',
      icon: PlugZap,
      summary: [
        {
          label: 'Connected',
          value: `${integratedCount}`,
          tone: integratedCount > 0 ? 'positive' : 'default',
        },
        {
          label: 'Healthy',
          value: `${healthyIntegrationCount}`,
          tone: healthyIntegrationCount > 0 ? 'positive' : 'default',
        },
        {
          label: 'Modules enabled',
          value: `${enabledFeatureCount}/${featureEntries.length}`,
        },
      ],
    },
    {
      title: 'AI workspace',
      description:
        'Assistant usage, document indexing, and reindex controls for AI features.',
      href: '/app/settings/ai',
      icon: Bot,
      summary: [
        {
          label: 'Indexed docs',
          value: `${aiIndexedCount}`,
          tone: aiIndexedCount > 0 ? 'positive' : 'default',
        },
        {
          label: 'Failed docs',
          value: `${aiFailedCount}`,
          tone: aiFailedCount > 0 ? 'danger' : 'default',
        },
        {
          label: 'Pending docs',
          value: `${aiPendingCount}`,
          tone: aiPendingCount > 0 ? 'warning' : 'default',
        },
      ],
    },
    {
      title: 'Billing & plan',
      description:
        'Subscription tier, trial window, and commercial access limits.',
      href: '/app/billing',
      icon: CreditCard,
      summary: [
        { label: 'Plan', value: planName, tone: 'positive' },
        { label: 'Status', value: titleCase(planSummary) },
      ],
    },
  ];

  const heroMetrics: PageHeroMetric[] = [
    { label: 'Plan', value: planName, sub: planSummary },
    { label: 'Team', value: String(memberCount), sub: 'members' },
    {
      label: 'Modules',
      value: `${enabledFeatureCount}/${featureEntries.length}`,
      sub: enabledFeatureLabels.length > 0 ? 'enabled' : 'using defaults',
    },
    {
      label: 'Alerts',
      value: String(atRiskCount),
      sub:
        atRiskCount > 0
          ? 'credentials need review'
          : 'no active alerts',
      tone: atRiskCount > 0 ? 'warning' : 'success',
    },
  ];

  const healthLabel =
    healthState === 'healthy'
      ? 'Healthy'
      : healthState === 'review'
        ? 'Needs review'
        : 'Action required';
  const healthTone =
    healthState === 'healthy'
      ? 'bg-success/10 text-success border-success/20'
      : healthState === 'review'
        ? 'bg-warning/10 text-warning border-warning/20'
        : 'bg-destructive/10 text-destructive border-destructive/20';

  return (
    <div className="space-y-8 pb-24" data-tour="settings-header">
      <PageHero
        title="Workspace settings"
        subtitle="Manage organization identity, security, communications, governance, integrations, and personal preferences from one place."
        metrics={heroMetrics}
        actions={
          <>
            <span
              className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-semibold ${healthTone}`}
            >
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current" />
              {healthLabel}
            </span>
            <span className="inline-flex items-center rounded-md border border-border bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground">
              {titleCase(systemState.role)} access
            </span>
          </>
        }
      />

      {(hasMissingIdentityData || atRiskCount > 0) && (
        <section className="rounded-md border border-warning/20 bg-warning/10 px-4 py-3 text-sm text-warning">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-none" />
            <div className="space-y-1">
              {hasMissingIdentityData ? (
                <p>
                  Add an industry and a team size so workspace routing,
                  onboarding, and reporting stay aligned.
                </p>
              ) : null}
              {atRiskCount > 0 ? (
                <p>
                  {atRiskCount} credential alert
                  {atRiskCount === 1 ? '' : 's'} need review in your compliance
                  workspace.
                </p>
              ) : null}
            </div>
          </div>
        </section>
      )}

      {/* One column, no echo: the previous right rail (Security snapshot,
          Notification routing, Workspace operations) and the Communication
          defaults card repeated the exact live state already badged on the
          configuration-area cards, so the page rendered every value twice. */}
      <form
        action={saveWorkspaceProfileAction}
        className="rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight text-foreground">
                  Workspace profile
                </h2>
                <p className="text-sm text-muted-foreground">
                  Keep your legal identity, routing domain, and core workspace
                  metadata current.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <StatusBadge tone={brandingCustomized ? 'positive' : 'default'}>
              {brandingCustomized ? 'Branding customized' : 'Default branding'}
            </StatusBadge>
            <StatusBadge tone="default">
              {organization.onboarding_completed
                ? 'Onboarding complete'
                : 'Onboarding incomplete'}
            </StatusBadge>
          </div>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          <Field
            label="Legal entity name"
            name="name"
            defaultValue={organization.name}
            disabled={!canManageWorkspace}
            placeholder="FormaOS Pty Ltd"
          />
          <Field
            label="Industry"
            name="industry"
            defaultValue={organization.industry ?? ''}
            disabled={!canManageWorkspace}
            placeholder="healthcare"
          />
          <Field
            label="Team size"
            name="teamSize"
            defaultValue={organization.team_size ?? ''}
            disabled={!canManageWorkspace}
            placeholder="1-10"
          />
          <ReadOnlyField
            label="Workspace ID"
            value={organization.id}
            mono
          />
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <ReadOnlyField
            label="Account email domain"
            value={accountEmailDomain}
            icon={Globe}
          />
          <ReadOnlyField
            label="Current access"
            value={titleCase(systemState.role)}
          />
          <ReadOnlyField
            label="Plan key"
            value={organization.plan_key ?? systemState.organization.plan}
          />
          <ReadOnlyField
            label="Portal domain"
            value={branding?.custom_domain ?? 'Default FormaOS domain'}
          />
          <ReadOnlyField
            label="Branding"
            value={brandingCustomized ? 'Customised' : 'FormaOS default'}
          />
          <ReadOnlyField
            label="Frameworks"
            value={
              frameworkLabels.length > 0
                ? frameworkLabels.join(', ')
                : 'No frameworks selected'
            }
          />
        </div>

        <div className="mt-6 rounded-lg border border-border bg-background/40 p-4 text-sm text-muted-foreground">
          Organization profile changes are recorded to the audit trail and
          scoped to <span className="font-medium text-foreground">{organization.name}</span>.
        </div>

        <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <p className="text-sm text-muted-foreground">
            {canManageWorkspace
              ? 'Owners and admins can update these fields.'
              : 'You have read-only access to organization-wide settings.'}
          </p>
          {canManageWorkspace ? (
            <button
              type="submit"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Save changes
            </button>
          ) : null}
        </div>
      </form>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Configuration areas
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Every settings surface with the most important live state called
            out up front.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {settingsAreas.map((area) => (
            <SettingsAreaCard key={area.title} area={area} />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Feature modules
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Which parts of FormaOS are switched on for this workspace. Contact
            support to change them.
          </p>
        </div>
        <div className="divide-y divide-border rounded-xl border border-border bg-card">
          {featureEntries.map((feature) => (
            <div
              key={feature.key}
              className="flex items-center justify-between gap-4 px-5 py-3"
            >
              <p className="text-sm text-foreground">{feature.label}</p>
              <span
                className={`shrink-0 text-sm ${
                  feature.enabled ? 'text-success' : 'text-muted-foreground'
                }`}
              >
                {feature.enabled ? 'On' : 'Off'}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Personal scope in one asymmetric zone: appearance previews dominate,
          language + account/data sit in the slim rail beside them. */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,1fr)]">
        <AppearanceSettings />

        <div className="space-y-6">
          <PlainEnglishToggle />
          {/* Audit 2026-05-25 (GDPR): cross-link to /app/privacy so the
              compliance suite finds [data-testid="delete-account"] at the
              URL it probes. The actual delete + export flow lives on
              /app/privacy. */}
          <section className="rounded-lg border border-destructive/20 bg-card p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  Account &amp; data
                </h2>
                <p className="text-sm text-muted-foreground">
                  Export a copy of your data, or permanently delete your
                  account.
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/app/privacy#export"
                className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Export your data
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/app/privacy#delete"
                data-testid="delete-account"
                className="inline-flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Delete your account
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function SettingsAreaCard({ area }: { area: SettingsArea }) {
  const Icon = area.icon;

  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">{area.title}</h3>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {area.description}
            </p>
          </div>
        </div>
        <Link
          href={area.href}
          className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted/40"
        >
          Open
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {area.summary.map((item) => (
          <StatusBadge
            key={`${area.title}-${item.label}`}
            tone={item.tone ?? 'default'}
          >
            {item.label}: {item.value}
          </StatusBadge>
        ))}
      </div>

      {area.links && area.links.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-3">
          {area.links.map((link) => (
            <Link
              key={`${area.title}-${link.href}`}
              href={link.href}
              className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80"
            >
              {link.label}
              <ArrowRight className="h-4 w-4" />
            </Link>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function Field({
  label,
  name,
  defaultValue,
  disabled,
  placeholder,
  icon: Icon,
}: {
  label: string;
  name: string;
  defaultValue: string;
  disabled?: boolean;
  placeholder?: string;
  icon?: LucideIcon;
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <div className="relative">
        {Icon ? (
          <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        ) : null}
        <input
          name={name}
          defaultValue={defaultValue}
          disabled={disabled}
          placeholder={placeholder}
          className={`w-full rounded-md border border-border bg-background px-4 py-3 text-sm text-foreground shadow-sm transition focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-70 ${
            Icon ? 'pl-11' : ''
          }`}
        />
      </div>
    </label>
  );
}

function ReadOnlyField({
  label,
  value,
  mono = false,
  icon: Icon,
}: {
  label: string;
  value: string;
  mono?: boolean;
  icon?: LucideIcon;
}) {
  return (
    <div className="space-y-2">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <div
        className={`flex items-center gap-2 rounded-md border border-border bg-background/60 px-4 py-3 text-sm text-foreground ${
          mono ? 'font-mono text-xs break-all' : ''
        }`}
      >
        {Icon ? <Icon className="h-4 w-4 flex-none text-muted-foreground" /> : null}
        {value}
      </div>
    </div>
  );
}

function StatusBadge({
  children,
  tone = 'default',
}: {
  children: ReactNode;
  tone?: 'default' | 'positive' | 'warning' | 'danger';
}) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${
        tone === 'positive'
          ? 'border-success/20 bg-success/10 text-success'
          : tone === 'warning'
            ? 'border-warning/20 bg-warning/10 text-warning'
            : tone === 'danger'
              ? 'border-destructive/20 bg-destructive/10 text-destructive'
              : 'border-border bg-card text-muted-foreground'
      }`}
    >
      {children}
    </span>
  );
}
