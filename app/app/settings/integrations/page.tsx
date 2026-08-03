import Link from 'next/link';
import { PlugZap, Workflow } from 'lucide-react';
import { getIntegrationStatus, listConnectedIntegrations } from '@/lib/integrations/manager';
import { IntegrationCatalog, type IntegrationCatalogItem } from '@/components/integrations/integration-catalog';
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
    <div className="space-y-8 pb-24 max-w-6xl animate-in fade-in duration-700">
      <header className="flex flex-col gap-4">
        <Link
          href="/app/settings"
          className="text-xs font-semibold text-muted-foreground hover:text-foreground/90"
        >
          ← Back to Settings
        </Link>
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-300">
            <PlugZap className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Integration Control Plane
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              Connect customer-facing channels, issue trackers, and evidence repositories.
              Every integration on this page flows through the same delivery, audit, and health model
              as the new v1 API.
            </p>
          </div>
        </div>
      </header>

      <section className="grid gap-4 rounded-[2rem] border border-edge-2 bg-surface-1 p-6 md:grid-cols-3">
        <div className="rounded-2xl border border-edge-2 bg-background/50 p-4">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">
            Connected
          </p>
          <p className="mt-3 text-3xl font-black text-foreground">
            {items.filter((item) => item.connected).length}
          </p>
        </div>
        <div className="rounded-2xl border border-edge-2 bg-background/50 p-4">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">
            Healthy
          </p>
          <p className="mt-3 text-3xl font-black text-foreground">
            {items.filter((item) => item.health === 'healthy').length}
          </p>
        </div>
        <div className="rounded-2xl border border-edge-2 bg-background/50 p-4">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">
            Event Fanout
          </p>
          <div className="mt-3 flex items-center gap-2 text-foreground">
            <Workflow className="h-5 w-5 text-cyan-300" />
            <span className="text-sm font-semibold">
              Webhooks, notifications, and external systems share one delivery plane.
            </span>
          </div>
        </div>
      </section>

      <IntegrationCatalog items={items} />
    </div>
  );
}
