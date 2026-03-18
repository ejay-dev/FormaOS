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
  stable: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
  draft: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
  deprecated: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
  archived: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
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
        <h1 className="text-3xl font-bold text-slate-100">
          Release Management
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Enterprise product versioning and release lifecycle
        </p>
      </div>

      {/* Active Release Banner */}
      {activeRelease && (
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-500/10">
                <Tag className="h-6 w-6 text-emerald-400" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-slate-100">
                    FormaOS {activeRelease.release_name}
                  </h2>
                  <StatusBadge status={activeRelease.release_status} />
                  {activeRelease.is_locked && (
                    <Lock className="h-4 w-4 text-amber-400" />
                  )}
                </div>
                <p className="text-sm text-slate-400 mt-1">
                  v{activeRelease.version_code} · Released{' '}
                  {formatDate(activeRelease.release_date)} · Enterprise Release
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">Feature Flags</p>
              <p className="text-lg font-bold text-emerald-300">
                {Object.keys(activeRelease.feature_flags ?? {}).length}
              </p>
            </div>
          </div>
          {activeRelease.release_notes && (
            <p className="mt-4 text-sm text-slate-400 border-t border-emerald-500/10 pt-4">
              {activeRelease.release_notes}
            </p>
          )}
        </div>
      )}

      {/* Client-side actions: create + manage */}
      <ReleaseActions releases={releases} />

      {/* Release History */}
      <div>
        <h2 className="text-lg font-semibold text-slate-100 mb-4">
          All Releases
        </h2>
        {releases.length === 0 ? (
          <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-8 text-center">
            <Tag className="h-8 w-8 opacity-20 mx-auto mb-2 text-slate-500" />
            <p className="text-slate-400">No releases found</p>
            <p className="text-xs text-slate-500 mt-1">
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
                  className="rounded-lg border border-slate-800 bg-slate-900/50 p-5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-semibold text-slate-100">
                            FormaOS {release.release_name}
                          </h3>
                          <span className="text-sm text-slate-500 font-mono">
                            v{release.version_code}
                          </span>
                          <StatusBadge status={release.release_status} />
                          {release.is_locked ? (
                            <Lock className="h-3.5 w-3.5 text-amber-400" />
                          ) : (
                            <Unlock className="h-3.5 w-3.5 text-slate-600" />
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
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
                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
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
                    <div className="mt-3 pt-3 border-t border-slate-800">
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(release.feature_flags ?? {}).map(
                          ([key, enabled]) => (
                            <span
                              key={key}
                              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono ${
                                enabled
                                  ? 'bg-emerald-500/10 text-emerald-400'
                                  : 'bg-slate-800 text-slate-500'
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
                    <div className="mt-3 pt-3 border-t border-slate-800">
                      <p className="text-xs text-slate-500 line-clamp-2">
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
