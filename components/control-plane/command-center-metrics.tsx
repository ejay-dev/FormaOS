'use client';

import { ShieldAlert, Sparkles, ToggleLeft, ToggleRight } from 'lucide-react';
import type { CommandCenterMetricsProps } from './command-center-types';
import { toLocalInput } from './command-center-types';

export function CommandCenterMetrics({
  maintenanceMode,
  readOnlyMode,
  marketingRuntime,
  featureFlags,
  flagDraft,
  pendingAction,
  onUpdateOpsToggle,
  onUpdateMarketingBoolean,
  onSetFlagDraft,
  onSubmitFeatureFlag,
  onPerformAction,
}: CommandCenterMetricsProps) {
  return (
    <>
      <section className="sticky top-20 z-20 rounded-xl border border-rose-800/40 bg-rose-950/25 p-4 backdrop-blur">
        <div className="mb-3 flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-rose-300" />
          <h2 className="text-sm font-semibold text-rose-100">
            Pinned Kill Switches
          </h2>
        </div>
        <div className="grid gap-2 md:grid-cols-3">
          <button
            type="button"
            title="Immediately pauses customer operations during maintenance."
            onClick={() =>
              onUpdateOpsToggle('maintenance_mode', !maintenanceMode, true)
            }
            className={`rounded border px-3 py-2 text-left text-xs ${
              maintenanceMode
                ? 'border-amber-600/50 bg-amber-900/30 text-amber-100'
                : 'border-slate-700 bg-slate-900/60 text-foreground/90 hover:bg-slate-800'
            }`}
          >
            <div className="font-medium">Maintenance mode</div>
            <div className="mt-1 text-[11px] opacity-90">
              {maintenanceMode ? 'Enabled' : 'Disabled'}
            </div>
          </button>

          <button
            type="button"
            title="Forces read-only behavior for non-admin writes."
            onClick={() =>
              onUpdateOpsToggle('read_only_mode', !readOnlyMode, true)
            }
            className={`rounded border px-3 py-2 text-left text-xs ${
              readOnlyMode
                ? 'border-cyan-600/50 bg-cyan-900/30 text-cyan-100'
                : 'border-slate-700 bg-slate-900/60 text-foreground/90 hover:bg-slate-800'
            }`}
          >
            <div className="font-medium">Read-only mode</div>
            <div className="mt-1 text-[11px] opacity-90">
              {readOnlyMode ? 'Enabled' : 'Disabled'}
            </div>
          </button>

          <button
            type="button"
            title="Disables expensive visual effects on marketing pages."
            onClick={() =>
              onUpdateMarketingBoolean(
                'home.runtime',
                'expensive_effects_enabled',
                !marketingRuntime.runtime.expensiveEffectsEnabled,
                {
                  label: 'Undo disable heavy effects toggle',
                  action: 'set_marketing_config',
                  payload: {
                    section: 'home.runtime',
                    configKey: 'expensive_effects_enabled',
                    value: marketingRuntime.runtime.expensiveEffectsEnabled,
                  },
                },
              )
            }
            className={`rounded border px-3 py-2 text-left text-xs ${
              marketingRuntime.runtime.expensiveEffectsEnabled
                ? 'border-emerald-600/50 bg-emerald-900/30 text-emerald-100'
                : 'border-rose-600/50 bg-rose-900/30 text-rose-100'
            }`}
          >
            <div className="font-medium">Disable heavy effects</div>
            <div className="mt-1 text-[11px] opacity-90">
              {marketingRuntime.runtime.expensiveEffectsEnabled
                ? 'Effects enabled'
                : 'Effects disabled'}
            </div>
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-cyan-300" />
          <h2 className="text-lg font-semibold text-foreground">
            Feature Flags & Experiments
          </h2>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <input
            value={flagDraft.flagKey}
            onChange={(event) =>
              onSetFlagDraft((prev) => ({
                ...prev,
                flagKey: event.target.value,
              }))
            }
            placeholder="flag key (e.g. marketing_new_hero)"
            className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-foreground"
          />
          <select
            value={flagDraft.scopeType}
            onChange={(event) =>
              onSetFlagDraft((prev) => ({
                ...prev,
                scopeType: event.target.value as
                  | 'global'
                  | 'organization'
                  | 'user',
              }))
            }
            className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-foreground"
          >
            <option value="global">Global</option>
            <option value="organization">Organization</option>
            <option value="user">User</option>
          </select>
          <input
            value={flagDraft.scopeId}
            onChange={(event) =>
              onSetFlagDraft((prev) => ({
                ...prev,
                scopeId: event.target.value,
              }))
            }
            disabled={flagDraft.scopeType === 'global'}
            placeholder={
              flagDraft.scopeType === 'global'
                ? 'N/A for global'
                : 'org/user id'
            }
            className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-foreground disabled:opacity-50"
          />
          <input
            value={flagDraft.description}
            onChange={(event) =>
              onSetFlagDraft((prev) => ({
                ...prev,
                description: event.target.value,
              }))
            }
            placeholder="description"
            className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-foreground md:col-span-2"
          />
          <input
            type="number"
            min={0}
            max={100}
            value={flagDraft.rolloutPercentage}
            onChange={(event) =>
              onSetFlagDraft((prev) => ({
                ...prev,
                rolloutPercentage: Number(event.target.value || 0),
              }))
            }
            placeholder="rollout %"
            className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-foreground"
          />
          <textarea
            value={flagDraft.variantsText}
            onChange={(event) =>
              onSetFlagDraft((prev) => ({
                ...prev,
                variantsText: event.target.value,
              }))
            }
            placeholder='{"control": 50, "variant": 50}'
            className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-foreground md:col-span-2"
          />
          <input
            value={flagDraft.defaultVariant}
            onChange={(event) =>
              onSetFlagDraft((prev) => ({
                ...prev,
                defaultVariant: event.target.value,
              }))
            }
            placeholder="default variant"
            className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-foreground"
          />
          <label className="flex items-center gap-2 text-sm text-foreground/70">
            <input
              type="checkbox"
              checked={flagDraft.enabled}
              onChange={(event) =>
                onSetFlagDraft((prev) => ({
                  ...prev,
                  enabled: event.target.checked,
                }))
              }
            />
            Enabled
          </label>
          <label className="flex items-center gap-2 text-sm text-foreground/70">
            <input
              type="checkbox"
              checked={flagDraft.killSwitch}
              onChange={(event) =>
                onSetFlagDraft((prev) => ({
                  ...prev,
                  killSwitch: event.target.checked,
                }))
              }
            />
            Kill switch
          </label>
          <label className="flex items-center gap-2 text-sm text-foreground/70">
            <input
              type="checkbox"
              checked={flagDraft.isPublic}
              onChange={(event) =>
                onSetFlagDraft((prev) => ({
                  ...prev,
                  isPublic: event.target.checked,
                }))
              }
            />
            Public runtime
          </label>
          <input
            type="datetime-local"
            value={flagDraft.startAt}
            onChange={(event) =>
              onSetFlagDraft((prev) => ({
                ...prev,
                startAt: event.target.value,
              }))
            }
            className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-foreground"
          />
          <input
            type="datetime-local"
            value={flagDraft.endAt}
            onChange={(event) =>
              onSetFlagDraft((prev) => ({ ...prev, endAt: event.target.value }))
            }
            className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-foreground"
          />
          <button
            type="button"
            disabled={pendingAction !== null}
            onClick={() => void onSubmitFeatureFlag()}
            className="rounded bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-500 disabled:opacity-60"
          >
            Save Flag
          </button>
        </div>

        <div className="mt-5 space-y-2">
          {featureFlags.map((flag) => {
            const onToggle = !flag.enabled;
            return (
              <div
                key={flag.id}
                className="rounded-lg border border-slate-800 bg-slate-950/40 p-3"
              >
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="rounded border border-slate-700 px-2 py-0.5 text-foreground/90">
                    {flag.flag_key}
                  </span>
                  <span>{flag.scope_type}</span>
                  {flag.scope_id ? <span>• {flag.scope_id}</span> : null}
                  <span>• rollout {flag.rollout_percentage}%</span>
                  {flag.start_at || flag.end_at ? (
                    <span>
                      • window {toLocalInput(flag.start_at)} →{' '}
                      {toLocalInput(flag.end_at)}
                    </span>
                  ) : null}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    title="Toggle enable/disable"
                    onClick={() => {
                      void onPerformAction(
                        'set_feature_flag',
                        {
                          flagKey: flag.flag_key,
                          scopeType: flag.scope_type,
                          scopeId: flag.scope_id,
                          enabled: onToggle,
                          killSwitch: flag.kill_switch,
                          rolloutPercentage: flag.rollout_percentage,
                          variants: flag.variants,
                          defaultVariant: flag.default_variant,
                          description: flag.description,
                          isPublic: flag.is_public,
                          startAt: flag.start_at,
                          endAt: flag.end_at,
                        },
                        {
                          undo: {
                            label: `Undo ${flag.flag_key}`,
                            action: 'set_feature_flag',
                            payload: {
                              flagKey: flag.flag_key,
                              scopeType: flag.scope_type,
                              scopeId: flag.scope_id,
                              enabled: flag.enabled,
                              killSwitch: flag.kill_switch,
                              rolloutPercentage: flag.rollout_percentage,
                              variants: flag.variants,
                              defaultVariant: flag.default_variant,
                              description: flag.description,
                              isPublic: flag.is_public,
                              startAt: flag.start_at,
                              endAt: flag.end_at,
                            },
                          },
                          successMessage: `${flag.flag_key} ${onToggle ? 'enabled' : 'disabled'}`,
                        },
                      );
                    }}
                    className="inline-flex items-center gap-1 rounded border border-slate-700 px-2 py-1 text-xs text-foreground/90 hover:bg-slate-800"
                  >
                    {flag.enabled ? (
                      <ToggleRight className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <ToggleLeft className="h-4 w-4 text-muted-foreground/60" />
                    )}
                    {flag.enabled ? 'Enabled' : 'Disabled'}
                  </button>

                  <button
                    type="button"
                    title="Emergency kill-switch"
                    onClick={() => {
                      void onPerformAction(
                        'set_feature_flag',
                        {
                          flagKey: flag.flag_key,
                          scopeType: flag.scope_type,
                          scopeId: flag.scope_id,
                          enabled: flag.enabled,
                          killSwitch: !flag.kill_switch,
                          rolloutPercentage: flag.rollout_percentage,
                          variants: flag.variants,
                          defaultVariant: flag.default_variant,
                          description: flag.description,
                          isPublic: flag.is_public,
                          startAt: flag.start_at,
                          endAt: flag.end_at,
                        },
                        {
                          confirmText: !flag.kill_switch
                            ? `Enable kill-switch for ${flag.flag_key}?`
                            : undefined,
                          undo: {
                            label: `Undo kill-switch for ${flag.flag_key}`,
                            action: 'set_feature_flag',
                            payload: {
                              flagKey: flag.flag_key,
                              scopeType: flag.scope_type,
                              scopeId: flag.scope_id,
                              enabled: flag.enabled,
                              killSwitch: flag.kill_switch,
                              rolloutPercentage: flag.rollout_percentage,
                              variants: flag.variants,
                              defaultVariant: flag.default_variant,
                              description: flag.description,
                              isPublic: flag.is_public,
                              startAt: flag.start_at,
                              endAt: flag.end_at,
                            },
                          },
                          successMessage: `${flag.flag_key} kill-switch ${
                            !flag.kill_switch ? 'enabled' : 'disabled'
                          }`,
                        },
                      );
                    }}
                    className={`inline-flex items-center gap-1 rounded border px-2 py-1 text-xs ${
                      flag.kill_switch
                        ? 'border-rose-700/50 bg-rose-900/20 text-rose-200'
                        : 'border-slate-700 text-foreground/70 hover:bg-slate-800'
                    }`}
                  >
                    <ShieldAlert className="h-3.5 w-3.5" />
                    Kill switch
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
