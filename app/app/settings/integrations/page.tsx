import { getIntegrationStatus, listConnectedIntegrations } from '@/lib/integrations/manager';
import { IntegrationCatalog, type IntegrationCatalogItem } from '@/components/integrations/integration-catalog';
import {
  SettingsPageHeader,
  SettingsPageShell,
} from '@/components/settings/settings-page-header';
import { fetchSystemState } from '@/lib/system-state/server';
import { redirect } from 'next/navigation';

// Credential-bearing keys across every provider in FIELD_MAP
// (components/integrations/integration-config-dialog.tsx).
const SECRET_CONFIG_KEYS = new Set([
  'webhook_url',
  'access_token',
  'refresh_token',
  'api_key',
]);

// IntegrationCatalogItem is spread onto a client component, so anything
// left on it is serialised into the RSC payload and readable in the
// browser. The dialog only needs to know whether a secret is set.
function redactIntegrationConfig(
  config: Record<string, unknown> | null | undefined,
): Record<string, unknown> | null {
  if (!config || typeof config !== 'object') return null;
  const redacted: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(config)) {
    redacted[key] = SECRET_CONFIG_KEYS.has(key) && value ? '***' : value;
  }
  return redacted;
}

export default async function IntegrationSettingsPage() {
  const systemState = await fetchSystemState();
  if (!systemState?.organization.id) {
    redirect('/workspace-recovery?from=settings-integrations');
  }

  const orgId = systemState.organization.id;
  const [status, connected] = await Promise.all([
    getIntegrationStatus(orgId),
    listConnectedIntegrations(orgId),
  ]);

  const connectedRows = connected as Array<{
    id: string;
    provider: string;
    config: Record<string, unknown> | null;
  }>;

  const connectedByProvider = new Map<string, (typeof connectedRows)[number]>(
    connectedRows.map((item) => [item.provider, item]),
  );

  const items: IntegrationCatalogItem[] = status.map((item) => {
    const connectedRow = connectedByProvider.get(item.id);
    return {
      ...item,
      connectedId: connectedRow?.id ?? null,
      config: redactIntegrationConfig(
        (connectedRow?.config as Record<string, unknown> | null) ?? item.config,
      ),
    };
  });

  return (
    <SettingsPageShell>
      <SettingsPageHeader
        title="Integrations"
        description="Connect messaging channels, issue trackers, and evidence repositories."
      />

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Connected</p>
          <p className="mt-2 text-3xl font-semibold text-foreground">
            {items.filter((item) => item.connected).length}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Healthy</p>
          <p className="mt-2 text-3xl font-semibold text-foreground">
            {items.filter((item) => item.health === 'healthy').length}
          </p>
        </div>
      </section>

      <IntegrationCatalog items={items} />
    </SettingsPageShell>
  );
}
