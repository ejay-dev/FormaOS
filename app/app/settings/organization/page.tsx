import { redirect } from 'next/navigation';
import { fetchSystemState } from '@/lib/system-state/server';
import {
  getBranding,
  getFeatureToggles,
  getDefaultFeatures,
} from '@/lib/settings/settings-engine';
import { Settings, Palette, ToggleRight, Shield } from 'lucide-react';

export const metadata = { title: 'Organization Settings | FormaOS' };

export default async function OrgSettingsPage() {
  const state = await fetchSystemState();
  if (!state) redirect('/signin');

  const [branding, toggles] = await Promise.all([
    getBranding(state.organization.id),
    getFeatureToggles(state.organization.id),
  ]);

  const defaults = getDefaultFeatures();
  const featureList = Object.entries(defaults).map(([key, def]) => ({
    key,
    label: def.label,
    description: def.description,
    enabled: toggles[key] ?? def.default,
  }));

  const enabledCount = featureList.filter((f) => f.enabled).length;

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Settings className="h-5 w-5" /> Organization Settings
        </h1>
        <p className="text-sm text-muted-foreground">
          Customize branding, manage features, and configure your workspace
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Shield className="h-4 w-4" /> <span className="text-xs">Plan</span>
          </div>
          <p className="text-lg font-bold text-foreground capitalize">
            {state.organization.plan || 'starter'}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <ToggleRight className="h-4 w-4" />{' '}
            <span className="text-xs">Features Enabled</span>
          </div>
          <p className="text-lg font-bold text-foreground">
            {enabledCount} / {featureList.length}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Palette className="h-4 w-4" />{' '}
            <span className="text-xs">Branding</span>
          </div>
          <p className="text-lg font-bold text-foreground">
            {branding ? 'Customized' : 'Default'}
          </p>
        </div>
      </div>

      {/* Navigation Cards to Sub-Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <a
          href="/app/settings/roles"
          className="rounded-lg border border-border bg-card p-4 hover:bg-muted/30 block"
        >
          <h3 className="text-sm font-semibold text-foreground mb-1">
            Roles & Permissions
          </h3>
          <p className="text-xs text-muted-foreground">
            Manage default and custom roles, fine-tune access controls
          </p>
        </a>
        <a
          href="/app/settings/retention"
          className="rounded-lg border border-border bg-card p-4 hover:bg-muted/30 block"
        >
          <h3 className="text-sm font-semibold text-foreground mb-1">
            Document Retention
          </h3>
          <p className="text-xs text-muted-foreground">
            Configure retention policies, legal holds, and lifecycle management
          </p>
        </a>
        <a
          href="/app/team/org-chart"
          className="rounded-lg border border-border bg-card p-4 hover:bg-muted/30 block"
        >
          <h3 className="text-sm font-semibold text-foreground mb-1">
            Team & Org Chart
          </h3>
          <p className="text-xs text-muted-foreground">
            Visual team structure, member management, and reporting lines
          </p>
        </a>
        <a
          href="/app/billing"
          className="rounded-lg border border-border bg-card p-4 hover:bg-muted/30 block"
        >
          <h3 className="text-sm font-semibold text-foreground mb-1">
            Billing & Subscription
          </h3>
          <p className="text-xs text-muted-foreground">
            Manage plan, payment methods, and usage
          </p>
        </a>
      </div>

      {/* Feature Toggles Section */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <ToggleRight className="h-4 w-4" /> Feature Modules
        </h2>
        <div className="space-y-2">
          {featureList.map((f) => (
            <div
              key={f.key}
              className="flex items-center justify-between p-3 rounded-lg border border-border bg-card"
            >
              <div>
                <p className="text-sm font-medium text-foreground">{f.label}</p>
                <p className="text-xs text-muted-foreground">{f.description}</p>
              </div>
              <div
                className={`w-10 h-5 rounded-full ${f.enabled ? 'bg-primary' : 'bg-muted'} relative`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                    f.enabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Branding Preview */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Palette className="h-4 w-4" /> Branding
        </h2>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Primary:</span>
              <div
                className="w-6 h-6 rounded border"
                style={{
                  backgroundColor: branding?.primary_color || '#6366f1',
                }}
              />
              <span className="text-xs text-muted-foreground">
                {branding?.primary_color || '#6366f1'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Secondary:</span>
              <div
                className="w-6 h-6 rounded border"
                style={{
                  backgroundColor: branding?.secondary_color || '#8b5cf6',
                }}
              />
              <span className="text-xs text-muted-foreground">
                {branding?.secondary_color || '#8b5cf6'}
              </span>
            </div>
          </div>
          {branding?.custom_domain && (
            <p className="text-xs text-muted-foreground">
              Custom domain:{' '}
              <span className="font-mono">{branding.custom_domain}</span>
            </p>
          )}
          {branding?.login_message && (
            <p className="text-xs text-muted-foreground mt-1">
              Login message: {branding.login_message}
            </p>
          )}
          {!branding && (
            <p className="text-xs text-muted-foreground">
              Using default branding. Customize colors, logo, and domain.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
