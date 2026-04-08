'use client';

import { RefreshCcw, ToggleLeft, ToggleRight, Wrench } from 'lucide-react';
import type { CommandCenterIntegrationsProps } from './command-center-types';

export function CommandCenterIntegrations({
  integrations,
  onUpdateIntegration,
  onRequestIntegrationRetry,
}: CommandCenterIntegrationsProps) {
  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
      <div className="mb-4 flex items-center gap-2">
        <Wrench className="h-4 w-4 text-amber-300" />
        <h2 className="text-lg font-semibold text-foreground">
          Integrations Control
        </h2>
      </div>

      <div className="space-y-3">
        {integrations.map((integration) => (
          <div
            key={integration.key}
            className="rounded-lg border border-slate-800 bg-slate-950/40 p-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-foreground">
                  {integration.key}
                </p>
                <p className="text-xs text-muted-foreground/60">
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
                    onUpdateIntegration(integration.key, {
                      enabled: !integration.value.enabled,
                    })
                  }
                  className="inline-flex items-center gap-1 rounded border border-slate-700 px-2 py-1 text-xs text-foreground/90 hover:bg-slate-800"
                >
                  {integration.value.enabled ? (
                    <ToggleRight className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <ToggleLeft className="h-4 w-4 text-muted-foreground/60" />
                  )}
                  {integration.value.enabled ? 'Enabled' : 'Disabled'}
                </button>
                <button
                  type="button"
                  onClick={() => onRequestIntegrationRetry(integration.key)}
                  className="inline-flex items-center gap-1 rounded border border-slate-700 px-2 py-1 text-xs text-foreground/90 hover:bg-slate-800"
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
                const enabled =
                  integration.value.enabled_scopes.includes(scope);
                return (
                  <button
                    key={scope}
                    type="button"
                    title="Toggle OAuth scope"
                    onClick={() => {
                      const nextEnabledScopes = enabled
                        ? integration.value.enabled_scopes.filter(
                            (entry) => entry !== scope,
                          )
                        : [...integration.value.enabled_scopes, scope];

                      onUpdateIntegration(integration.key, {
                        enabled_scopes: nextEnabledScopes,
                      });
                    }}
                    className={`rounded border px-2 py-0.5 text-[11px] ${
                      enabled
                        ? 'border-emerald-700/50 bg-emerald-900/20 text-emerald-200'
                        : 'border-slate-700 text-muted-foreground'
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
  );
}
