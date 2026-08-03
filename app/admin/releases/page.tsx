import { getAdminFetchConfig } from '@/app/admin/lib';
import { Tag, Lock, Unlock, Flag } from 'lucide-react';
import type { ProductRelease } from '@/config/release';
import { ReleaseActions } from './release-actions';

async function fetchReleases() {
  const { base, headers } = await getAdminFetchConfig();
  const res = await fetch(`${base}/api/admin/releases`, {
    cache: 'no-store',
    headers,
  });
  if (!res.ok) return null;
  return res.json();
}

const STATUS_STYLES: Record<string, string> = {
  stable: 'bg-success/10 text-success border-success/20',
  draft: 'bg-info/10 text-info border-info/20',
  deprecated: 'bg-warning/10 text-warning border-warning/20',
  archived: 'bg-muted text-muted-foreground border-border',
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_STYLES[status] ?? STATUS_STYLES.archived}`}
    >
      {status}
    </span>
  );
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-AU', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default async function AdminReleasesPage() {
  const data = await fetchReleases();
  const releases: ProductRelease[] = data?.releases ?? [];
  const activeRelease = releases.find((r) => r.release_status === 'stable');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Releases</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Product versions and what shipped in each one
        </p>
      </div>

      {/* Active Release Banner */}
      {activeRelease && (
        <div className="rounded-lg border border-success/20 bg-success/10 p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success/10">
                <Tag className="h-6 w-6 text-success" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-foreground">
                    FormaOS {activeRelease.release_name}
                  </h2>
                  <StatusBadge status={activeRelease.release_status} />
                  {activeRelease.is_locked && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-warning">
                      <Lock className="h-3.5 w-3.5" />
                      Locked
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  v{activeRelease.version_code} · Released{' '}
                  {formatDate(activeRelease.release_date)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Feature flags</p>
              <p className="text-lg font-bold text-success">
                {Object.keys(activeRelease.feature_flags ?? {}).length}
              </p>
            </div>
          </div>
          {activeRelease.release_notes && (
            <p className="mt-4 text-sm text-muted-foreground border-t border-success/20 pt-4">
              {activeRelease.release_notes}
            </p>
          )}
        </div>
      )}

      {/* Client-side actions: create + manage */}
      <ReleaseActions releases={releases} />

      {/* Release History */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">
          All releases
        </h2>
        {releases.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-8 text-center">
            <Tag className="h-8 w-8 opacity-20 mx-auto mb-2 text-muted-foreground" />
            <p className="text-muted-foreground">No releases found</p>
            <p className="text-xs text-muted-foreground mt-1">
              Create your first release using the form above
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {releases.map((release) => {
              const flagCount = Object.keys(
                release.feature_flags ?? {},
              ).length;
              const enabledFlags = Object.values(
                release.feature_flags ?? {},
              ).filter(Boolean).length;

              return (
                <div
                  key={release.id}
                  className="rounded-lg border border-border bg-card p-5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-semibold text-foreground">
                            FormaOS {release.release_name}
                          </h3>
                          <span className="text-sm text-muted-foreground font-mono">
                            v{release.version_code}
                          </span>
                          <StatusBadge status={release.release_status} />
                          {release.is_locked ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-warning">
                              <Lock className="h-3.5 w-3.5" />
                              Locked
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                              <Unlock className="h-3.5 w-3.5" />
                              Unlocked
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                          <span>
                            Created {formatDate(release.created_at)}
                          </span>
                          {release.release_date && (
                            <span>
                              Released {formatDate(release.release_date)}
                            </span>
                          )}
                          {release.schema_version && (
                            <span>
                              Schema: {release.schema_version}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {flagCount > 0 && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Flag className="h-3.5 w-3.5" />
                          <span>
                            {enabledFlags}/{flagCount} flags
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Feature Flags Detail */}
                  {flagCount > 0 && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(release.feature_flags ?? {}).map(
                          ([key, enabled]) => (
                            <span
                              key={key}
                              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono ${
                                enabled
                                  ? 'bg-success/10 text-success'
                                  : 'bg-muted text-muted-foreground'
                              }`}
                            >
                              {key}: {enabled ? 'on' : 'off'}
                            </span>
                          ),
                        )}
                      </div>
                    </div>
                  )}

                  {/* Release Notes */}
                  {release.release_notes && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {release.release_notes}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
