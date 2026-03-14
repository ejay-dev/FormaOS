'use client';

import { useState } from 'react';

type Props = {
  orgId: string;
  featureKey: string;
  enabled: boolean;
  limitValue: number | null;
};

export function EntitlementOverrideRow({
  orgId,
  featureKey,
  enabled: initialEnabled,
  limitValue: initialLimitValue,
}: Props) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [limitValue, setLimitValue] = useState(
    initialLimitValue == null ? '' : String(initialLimitValue),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function saveOverride() {
    const reason = window.prompt(`Reason for changing ${featureKey}`);
    if (!reason) return;

    setLoading(true);
    setError(null);
    try {
      const limit = limitValue.trim() ? Number(limitValue) : null;
      const res = await fetch(`/api/admin/orgs/${orgId}/entitlements`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-reason': reason,
        },
        body: JSON.stringify({
          featureKey,
          enabled,
          limitValue: Number.isFinite(limit as number) ? limit : null,
          reason,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? 'Failed to save override');
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save override');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-foreground">{featureKey}</p>
          <p className="text-xs text-muted-foreground">
            Manual entitlement override for this organization.
          </p>
        </div>
        <label className="flex items-center gap-2 text-xs text-foreground">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(event) => setEnabled(event.target.checked)}
            disabled={loading}
          />
          Enabled
        </label>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input
          type="number"
          value={limitValue}
          onChange={(event) => setLimitValue(event.target.value)}
          placeholder="Limit"
          className="w-24 rounded border border-border bg-background px-2 py-1 text-xs text-foreground"
          disabled={loading}
        />
        <button
          type="button"
          onClick={() => void saveOverride()}
          disabled={loading}
          className="rounded border border-border px-2 py-1 text-xs text-foreground hover:bg-muted disabled:opacity-50"
        >
          {loading ? 'Saving…' : 'Save'}
        </button>
      </div>
      {error ? <p className="mt-2 text-[11px] text-rose-300">{error}</p> : null}
    </div>
  );
}
