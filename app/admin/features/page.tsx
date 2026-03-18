import { getAdminFetchConfig } from '@/app/admin/lib';
import { Zap, Lock, Unlock } from 'lucide-react';

type FeatureUsage = {
  key: string;
  name: string;
  description: string;
  enabled_count: number;
  disabled_count: number;
  total_orgs: number;
  global_limit: number | null;
};

async function fetchFeatures() {
  const { base, headers } = await getAdminFetchConfig();
  const res = await fetch(`${base}/api/admin/features`, {
    cache: 'no-store',
    headers,
  });
  if (!res.ok) return null;
  return res.json();
}

const FEATURE_ICONS: Record<string, string> = {
  audit_export: '📊',
  certifications: '🏆',
  framework_evaluations: '📋',
  reports: '📄',
  team_limit: '👥',
};

export default async function AdminFeaturesPage() {
  const data = await fetchFeatures();
  const features: FeatureUsage[] = data?.features ?? [];

  const totalOrgsWithEntitlements =
    features.length > 0 ? Math.max(...features.map((f) => f.total_orgs)) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-100">
          Feature Entitlements
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Real-time feature adoption across all organizations (from
          org_entitlements)
        </p>
      </div>

      {features.length === 0 ? (
        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-8 text-center">
          <Zap className="h-8 w-8 opacity-20 mx-auto mb-2 text-slate-500" />
          <p className="text-slate-400">No entitlement data yet</p>
          <p className="text-xs text-slate-500 mt-1">
            Entitlements are synced when organizations select a plan
          </p>
        </div>
      ) : (
        <>
          {/* Feature Cards Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const icon = FEATURE_ICONS[feature.key] ?? '⚡';
              const adoptionPct =
                feature.total_orgs > 0
                  ? Math.round(
                      (feature.enabled_count / feature.total_orgs) * 100,
                    )
                  : 0;

              return (
                <div
                  key={feature.key}
                  className="rounded-lg border border-slate-800 bg-slate-900/50 p-6 space-y-4"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-2xl mb-2">{icon}</div>
                      <h3 className="text-lg font-semibold text-slate-100">
                        {feature.name}
                      </h3>
                      {feature.description && (
                        <p className="text-xs text-slate-500 mt-1">
                          {feature.description}
                        </p>
                      )}
                    </div>
                    {feature.enabled_count > 0 ? (
                      <Unlock className="h-5 w-5 text-emerald-400" />
                    ) : (
                      <Lock className="h-5 w-5 text-slate-600" />
                    )}
                  </div>

                  {/* Adoption Bar */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-slate-400">Adoption</span>
                      <span className="text-xs font-semibold text-slate-100">
                        {adoptionPct}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 transition-all"
                        style={{ width: `${adoptionPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800">
                    <div>
                      <p className="text-xs text-slate-500">Enabled</p>
                      <p className="text-lg font-bold text-emerald-300">
                        {feature.enabled_count}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Disabled</p>
                      <p className="text-lg font-bold text-slate-400">
                        {feature.disabled_count}
                      </p>
                    </div>
                  </div>

                  {/* Limit Info */}
                  {feature.global_limit != null && (
                    <div className="pt-3 border-t border-slate-800">
                      <p className="text-xs text-slate-400">
                        Max Limit:{' '}
                        <span className="text-slate-100 font-mono">
                          {feature.global_limit}
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Summary */}
          <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-6">
            <h2 className="text-lg font-semibold text-slate-100 mb-4">
              Summary
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between p-3 rounded-lg border border-slate-800/50 bg-slate-800/20">
                <span className="text-slate-400">Feature Keys Tracked</span>
                <span className="font-semibold text-slate-100">
                  {features.length}
                </span>
              </div>
              <div className="flex justify-between p-3 rounded-lg border border-slate-800/50 bg-slate-800/20">
                <span className="text-slate-400">Orgs with Entitlements</span>
                <span className="font-semibold text-slate-100">
                  {totalOrgsWithEntitlements}
                </span>
              </div>
              <p className="text-slate-500 text-xs pt-2">
                💡 Entitlements are synced automatically when an organization
                selects or changes their plan. Manage plans from the Billing or
                Organizations pages.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
