'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ProductRelease } from '@/config/release';
import {
  suggestReleaseName,
  RELEASE_NAME_CANDIDATES,
} from '@/config/release';
import {
  Plus,
  ArrowUp,
  Archive,
  Lock,
  Unlock,
  AlertTriangle,
  Loader2,
} from 'lucide-react';

export function ReleaseActions({
  releases,
}: {
  releases: ProductRelease[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  // Create form state
  const highestMajor = Math.max(
    ...releases.map((r) => {
      const parts = r.version_code.split('.');
      return parseInt(parts[0], 10) || 0;
    }),
    0,
  );
  const suggestedMajor = highestMajor + 1;
  const [versionCode, setVersionCode] = useState(
    `${suggestedMajor}.0.0`,
  );
  const [releaseName, setReleaseName] = useState(
    suggestReleaseName(suggestedMajor),
  );
  const [releaseNotes, setReleaseNotes] = useState('');

  async function handleCreate() {
    setLoading('create');
    setError(null);
    try {
      const res = await fetch('/api/admin/releases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          version_code: versionCode,
          release_name: releaseName,
          release_notes: releaseNotes || null,
          feature_flags: {},
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to create release');
        return;
      }
      setShowCreate(false);
      setReleaseNotes('');
      router.refresh();
    } catch {
      setError('Network error');
    } finally {
      setLoading(null);
    }
  }

  async function handleAction(
    releaseId: string,
    action: string,
    body: Record<string, unknown>,
  ) {
    setLoading(`${action}-${releaseId}`);
    setError(null);
    try {
      const res = await fetch(`/api/admin/releases/${releaseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || `Failed to ${action} release`);
        return;
      }
      router.refresh();
    } catch {
      setError('Network error');
    } finally {
      setLoading(null);
    }
  }

  const isLoading = (key: string) => loading === key;

  return (
    <div className="space-y-4">
      {/* Error Banner */}
      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 flex items-center gap-3">
          <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
          <p className="text-sm text-destructive">{error}</p>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-xs text-destructive hover:text-destructive"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Create Release */}
      {!showCreate ? (
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-muted hover:bg-accent text-sm text-foreground transition-colors"
        >
          <Plus className="h-4 w-4" />
          Create New Draft Release
        </button>
      ) : (
        <div className="rounded-lg border border-info/20 bg-info/10 p-6 space-y-4">
          <h3 className="text-base font-semibold text-foreground">
            New Draft Release
          </h3>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="field-202" className="block text-xs text-muted-foreground mb-1.5">
                Version Code
              </label>
              <input
                type="text"
                value={versionCode}
                onChange={(e) => setVersionCode(e.target.value)}
                placeholder="X.Y.Z"
                className="w-full px-3 py-2 rounded-lg border border-border bg-muted text-foreground text-sm focus:outline-none focus:border-info/20"
              />
            </div>
            <div>
              <label htmlFor="field-201" className="block text-xs text-muted-foreground mb-1.5">
                Release Name
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={releaseName}
                  onChange={(e) => setReleaseName(e.target.value)}
                  placeholder="Prestige name"
                  className="flex-1 px-3 py-2 rounded-lg border border-border bg-muted text-foreground text-sm focus:outline-none focus:border-info/20"
                />
                <select
                  value={releaseName}
                  onChange={(e) => setReleaseName(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-border bg-muted text-foreground text-sm focus:outline-none focus:border-info/20"
                >
                  {RELEASE_NAME_CANDIDATES.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="field-200" className="block text-xs text-muted-foreground mb-1.5">
              Release Notes (Markdown)
            </label>
            <textarea
              value={releaseNotes}
              onChange={(e) => setReleaseNotes(e.target.value)}
              rows={3}
              placeholder="Describe this release..."
              className="w-full px-3 py-2 rounded-lg border border-border bg-muted text-foreground text-sm focus:outline-none focus:border-ring resize-y"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleCreate}
              disabled={loading !== null}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium transition-colors disabled:opacity-50"
            >
              {isLoading('create') ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Create Draft
            </button>
            <button
              onClick={() => setShowCreate(false)}
              className="px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Action Buttons per Release */}
      {releases.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="text-base font-semibold text-foreground mb-4">
            Release Actions
          </h3>
          <div className="space-y-3">
            {releases.map((release) => (
              <div
                key={release.id}
                className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">
                    FormaOS {release.release_name}
                  </span>
                  <span className="text-xs text-muted-foreground font-mono">
                    v{release.version_code}
                  </span>
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded ${
                      release.release_status === 'stable'
                        ? 'text-success'
                        : release.release_status === 'draft'
                          ? 'text-info'
                          : release.release_status === 'deprecated'
                            ? 'text-warning'
                            : 'text-muted-foreground'
                    }`}
                  >
                    {release.release_status}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {/* Promote to Stable (draft or deprecated) */}
                  {(release.release_status === 'draft' ||
                    release.release_status === 'deprecated') && (
                    <button
                      onClick={() =>
                        handleAction(release.id, 'promote', {
                          release_status: 'stable',
                        })
                      }
                      disabled={loading !== null}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-success/10 text-success text-xs font-medium hover:bg-success/10 transition-colors disabled:opacity-50"
                    >
                      {isLoading(`promote-${release.id}`) ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <ArrowUp className="h-3.5 w-3.5" />
                      )}
                      Promote
                    </button>
                  )}

                  {/* Deprecate (stable) */}
                  {release.release_status === 'stable' && (
                    <button
                      onClick={() =>
                        handleAction(release.id, 'deprecate', {
                          release_status: 'deprecated',
                        })
                      }
                      disabled={loading !== null}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-warning/10 text-warning text-xs font-medium hover:bg-warning/10 transition-colors disabled:opacity-50"
                    >
                      {isLoading(`deprecate-${release.id}`) ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <AlertTriangle className="h-3.5 w-3.5" />
                      )}
                      Deprecate
                    </button>
                  )}

                  {/* Archive (draft or deprecated) */}
                  {(release.release_status === 'draft' ||
                    release.release_status === 'deprecated') && (
                    <button
                      onClick={() =>
                        handleAction(release.id, 'archive', {
                          release_status: 'archived',
                        })
                      }
                      disabled={loading !== null}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/50 text-muted-foreground text-xs font-medium hover:bg-muted transition-colors disabled:opacity-50"
                    >
                      {isLoading(`archive-${release.id}`) ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Archive className="h-3.5 w-3.5" />
                      )}
                      Archive
                    </button>
                  )}

                  {/* Lock / Unlock */}
                  <button
                    onClick={() =>
                      handleAction(
                        release.id,
                        release.is_locked ? 'unlock' : 'lock',
                        { is_locked: !release.is_locked },
                      )
                    }
                    disabled={loading !== null}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${
                      release.is_locked
                        ? 'bg-warning/10 text-warning hover:bg-warning/10'
                        : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {isLoading(`lock-${release.id}`) ||
                    isLoading(`unlock-${release.id}`) ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : release.is_locked ? (
                      <Unlock className="h-3.5 w-3.5" />
                    ) : (
                      <Lock className="h-3.5 w-3.5" />
                    )}
                    {release.is_locked ? 'Unlock' : 'Lock'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
