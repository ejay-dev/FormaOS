'use client';

import { Sparkles, ToggleLeft, ToggleRight } from 'lucide-react';
import type { CommandCenterMarketingProps } from './command-center-types';

export function CommandCenterMarketing({
  marketingForm,
  marketingRuntime,
  marketingBaseline,
  marketingDirty,
  pendingAction,
  onSetMarketingForm,
  onSaveMarketingForm,
  onPerformAction,
}: CommandCenterMarketingProps) {
  return (
    <section className="rounded-xl border border-border bg-card p-6">
      <div className="mb-4 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-lg font-semibold text-foreground">
          Marketing site controls
        </h2>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-sm text-foreground/70">
          Hero badge
          <input
            value={marketingForm.badgeText}
            onChange={(event) =>
              onSetMarketingForm((prev) => ({
                ...prev,
                badgeText: event.target.value,
              }))
            }
            className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-sm text-foreground"
          />
        </label>

        <label className="text-sm text-foreground/70">
          Hero headline (primary)
          <input
            value={marketingForm.headlinePrimary}
            onChange={(event) =>
              onSetMarketingForm((prev) => ({
                ...prev,
                headlinePrimary: event.target.value,
              }))
            }
            className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-sm text-foreground"
          />
        </label>

        <label className="text-sm text-foreground/70">
          Hero headline (accent)
          <input
            value={marketingForm.headlineAccent}
            onChange={(event) =>
              onSetMarketingForm((prev) => ({
                ...prev,
                headlineAccent: event.target.value,
              }))
            }
            className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-sm text-foreground"
          />
        </label>

        <label className="text-sm text-foreground/70">
          Hero subheadline
          <textarea
            value={marketingForm.subheadline}
            onChange={(event) =>
              onSetMarketingForm((prev) => ({
                ...prev,
                subheadline: event.target.value,
              }))
            }
            className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-sm text-foreground"
          />
        </label>

        <label className="text-sm text-foreground/70">
          Primary CTA label
          <input
            value={marketingForm.primaryCtaLabel}
            onChange={(event) =>
              onSetMarketingForm((prev) => ({
                ...prev,
                primaryCtaLabel: event.target.value,
              }))
            }
            className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-sm text-foreground"
          />
        </label>
        <label className="text-sm text-foreground/70">
          Primary CTA link
          <input
            value={marketingForm.primaryCtaHref}
            onChange={(event) =>
              onSetMarketingForm((prev) => ({
                ...prev,
                primaryCtaHref: event.target.value,
              }))
            }
            className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-sm text-foreground"
          />
        </label>

        <label className="text-sm text-foreground/70">
          Secondary CTA label
          <input
            value={marketingForm.secondaryCtaLabel}
            onChange={(event) =>
              onSetMarketingForm((prev) => ({
                ...prev,
                secondaryCtaLabel: event.target.value,
              }))
            }
            className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-sm text-foreground"
          />
        </label>
        <label className="text-sm text-foreground/70">
          Secondary CTA link
          <input
            value={marketingForm.secondaryCtaHref}
            onChange={(event) =>
              onSetMarketingForm((prev) => ({
                ...prev,
                secondaryCtaHref: event.target.value,
              }))
            }
            className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-sm text-foreground"
          />
        </label>

        <label className="text-sm text-foreground/70">
          Theme variant
          <input
            value={marketingForm.themeVariant}
            onChange={(event) =>
              onSetMarketingForm((prev) => ({
                ...prev,
                themeVariant: event.target.value,
              }))
            }
            className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-sm text-foreground"
          />
        </label>
        <label className="text-sm text-foreground/70">
          Background variant
          <input
            value={marketingForm.backgroundVariant}
            onChange={(event) =>
              onSetMarketingForm((prev) => ({
                ...prev,
                backgroundVariant: event.target.value,
              }))
            }
            className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-sm text-foreground"
          />
        </label>

        <label className="text-sm text-foreground/70">
          Active showcase module
          <select
            value={marketingForm.activeShowcaseModule}
            onChange={(event) =>
              onSetMarketingForm((prev) => ({
                ...prev,
                activeShowcaseModule: event.target.value,
              }))
            }
            className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-sm text-foreground"
          >
            {Object.keys(marketingRuntime.runtime.showcaseModules).map(
              (key) => (
                <option key={key} value={key}>
                  {key}
                </option>
              ),
            )}
          </select>
        </label>

        <div className="md:col-span-2 flex flex-wrap items-center justify-end gap-2 rounded border border-border bg-background/50 p-3">
          <button
            type="button"
            disabled={!marketingDirty || pendingAction !== null}
            onClick={() => onSetMarketingForm(marketingBaseline)}
            className="rounded border border-border px-3 py-1.5 text-xs text-foreground/90 hover:bg-muted disabled:opacity-50"
          >
            Revert
          </button>
          <button
            type="button"
            disabled={!marketingDirty || pendingAction !== null}
            onClick={() => void onSaveMarketingForm()}
            className="rounded bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            Apply / Save
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <div className="rounded border border-border bg-background/50 p-3">
          <p className="text-sm text-foreground">Section visibility</p>
          <div className="mt-2 grid gap-1">
            {Object.entries(marketingRuntime.runtime.sectionVisibility).map(
              ([section, visible]) => (
                <button
                  key={section}
                  type="button"
                  onClick={() => {
                    const next = {
                      ...marketingRuntime.runtime.sectionVisibility,
                      [section]: !visible,
                    };
                    void onPerformAction(
                      'set_marketing_config',
                      {
                        section: 'home.runtime',
                        configKey: 'section_visibility',
                        value: next,
                      },
                      {
                        undo: {
                          label: `Undo section visibility for ${section}`,
                          action: 'set_marketing_config',
                          payload: {
                            section: 'home.runtime',
                            configKey: 'section_visibility',
                            value: marketingRuntime.runtime.sectionVisibility,
                          },
                        },
                        successMessage: `${section} ${!visible ? 'shown' : 'hidden'}`,
                      },
                    );
                  }}
                  className="flex items-center justify-between rounded border border-border px-2 py-1 text-xs text-foreground/90 hover:bg-muted"
                >
                  <span>{section}</span>
                  {visible ? (
                    <ToggleRight className="h-3.5 w-3.5 text-success" />
                  ) : (
                    <ToggleLeft className="h-3.5 w-3.5 text-muted-foreground/60" />
                  )}
                </button>
              ),
            )}
          </div>
        </div>

        <div className="rounded border border-border bg-background/50 p-3">
          <p className="text-sm text-foreground">Showcase modules</p>
          <div className="mt-2 grid gap-1">
            {Object.entries(marketingRuntime.runtime.showcaseModules).map(
              ([moduleKey, enabled]) => (
                <button
                  key={moduleKey}
                  type="button"
                  onClick={() => {
                    const next = {
                      ...marketingRuntime.runtime.showcaseModules,
                      [moduleKey]: !enabled,
                    };
                    void onPerformAction(
                      'set_marketing_config',
                      {
                        section: 'home.runtime',
                        configKey: 'showcase_modules',
                        value: next,
                      },
                      {
                        undo: {
                          label: `Undo showcase module toggle for ${moduleKey}`,
                          action: 'set_marketing_config',
                          payload: {
                            section: 'home.runtime',
                            configKey: 'showcase_modules',
                            value: marketingRuntime.runtime.showcaseModules,
                          },
                        },
                        successMessage: `${moduleKey} ${!enabled ? 'enabled' : 'disabled'}`,
                      },
                    );
                  }}
                  className="flex items-center justify-between rounded border border-border px-2 py-1 text-xs text-foreground/90 hover:bg-muted"
                >
                  <span>{moduleKey}</span>
                  {enabled ? (
                    <ToggleRight className="h-3.5 w-3.5 text-success" />
                  ) : (
                    <ToggleLeft className="h-3.5 w-3.5 text-muted-foreground/60" />
                  )}
                </button>
              ),
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
