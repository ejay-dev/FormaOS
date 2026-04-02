import { redirect } from 'next/navigation';
import { fetchSystemState } from '@/lib/system-state/server';
import {
  getOrgIntegrations,
  INTEGRATION_CATALOG,
} from '@/lib/integrations/integration-engine';
import { Plug, CheckCircle2, XCircle, Activity } from 'lucide-react';

export const metadata = { title: 'Integrations Marketplace | FormaOS' };

export default async function IntegrationMarketplacePage() {
  const state = await fetchSystemState();
  if (!state) redirect('/signin');

  const connected = await getOrgIntegrations(state.organization.id);
  const connectedProviders = new Set(connected.map((c) => c.provider));

  const catalog = Object.entries(INTEGRATION_CATALOG).map(([key, info]) => {
    const conn = connected.find((c) => c.provider === key);
    return {
      key,
      ...info,
      connected: connectedProviders.has(key),
      status: conn?.status,
      lastSynced: conn?.last_synced_at,
    };
  });

  const activeCount = connected.filter((c) => c.status === 'active').length;
  const errorCount = connected.filter((c) => c.status === 'error').length;

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Plug className="h-5 w-5" /> Integration Marketplace
        </h1>
        <p className="text-sm text-muted-foreground">
          Connect FormaOS with your existing tools and workflows
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <CheckCircle2 className="h-4 w-4" />{' '}
            <span className="text-xs">Active</span>
          </div>
          <p className="text-2xl font-bold text-green-600">{activeCount}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <XCircle className="h-4 w-4" />{' '}
            <span className="text-xs">Errors</span>
          </div>
          <p className="text-2xl font-bold text-red-600">{errorCount}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Activity className="h-4 w-4" />{' '}
            <span className="text-xs">Available</span>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {Object.keys(INTEGRATION_CATALOG).length}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {catalog.map((item) => (
          <div
            key={item.key}
            className="rounded-lg border border-border bg-card p-4 flex flex-col"
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">{item.icon}</span>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-foreground">
                  {item.name}
                </h4>
                <span className="text-[10px] text-muted-foreground capitalize">
                  {item.category.replace('_', ' ')}
                </span>
              </div>
              {item.connected && (
                <span
                  className={`flex items-center gap-1 px-2 py-0.5 text-xs rounded ${
                    item.status === 'active'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : item.status === 'error'
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                  }`}
                >
                  {item.status}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground flex-1 mb-3">
              {item.description}
            </p>
            {item.lastSynced && (
              <p className="text-[10px] text-muted-foreground mb-2">
                Last synced: {new Date(item.lastSynced).toLocaleString()}
              </p>
            )}
            <a
              href={
                item.connected
                  ? `/app/settings/integrations/${item.key}`
                  : `/app/settings/integrations/${item.key}/connect`
              }
              className={`block w-full py-2 text-xs font-medium rounded text-center ${
                item.connected
                  ? 'border border-border text-foreground hover:bg-muted'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90'
              }`}
            >
              {item.connected ? 'Configure' : 'Connect'}
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
