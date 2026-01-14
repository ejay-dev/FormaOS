import { getAdminFetchConfig } from "@/app/admin/lib";
import { Zap, Lock, Unlock, Settings } from "lucide-react";

type FeatureFlag = {
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  global_limit?: number;
  current_usage?: number;
};

async function fetchFeatures() {
  const { base, headers } = await getAdminFetchConfig();
  const res = await fetch(`${base}/api/admin/features`, {
    cache: "no-store",
    headers,
  });
  if (!res.ok) return null;
  return res.json();
}

const FEATURE_DESCRIPTIONS: Record<string, string> = {
  audit_export: "Export audit logs as CSV for external compliance",
  certifications: "Display security certifications and compliance badges",
  framework_evaluations: "Enable framework evaluation workflows",
  reports: "Generate and download custom reports",
  limits: "Enforce resource limits per organization",
};

export default async function AdminFeaturesPage() {
  const data = await fetchFeatures();
  const features: FeatureFlag[] = data?.features ?? [];

  const featureCards = [
    {
      key: "audit_export",
      name: "Audit Export",
      icon: "📊",
    },
    {
      key: "certifications",
      name: "Certifications",
      icon: "🏆",
    },
    {
      key: "framework_evaluations",
      name: "Framework Evaluations",
      icon: "📋",
    },
    {
      key: "reports",
      name: "Reports",
      icon: "📄",
    },
    {
      key: "limits",
      name: "Resource Limits",
      icon: "⚡",
    },
  ];

  const featureMap = new Map(features.map((f) => [f.key, f]));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-100">Feature Flags</h1>
        <p className="mt-2 text-sm text-slate-400">
          Enable/disable platform features globally and set usage limits
        </p>
      </div>

      {/* Feature Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {featureCards.map((card) => {
          const feature = featureMap.get(card.key);
          const isEnabled = feature?.enabled ?? false;

          return (
            <div
              key={card.key}
              className="rounded-lg border border-slate-800 bg-slate-900/50 p-6 space-y-4"
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-2xl mb-2">{card.icon}</div>
                  <h3 className="text-lg font-semibold text-slate-100">
                    {card.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {FEATURE_DESCRIPTIONS[card.key]}
                  </p>
                </div>
                {isEnabled ? (
                  <Unlock className="h-5 w-5 text-emerald-400" />
                ) : (
                  <Lock className="h-5 w-5 text-slate-600" />
                )}
              </div>

              {/* Status Badge */}
              <div>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium ${
                    isEnabled
                      ? "bg-emerald-500/10 text-emerald-300"
                      : "bg-slate-600/10 text-slate-400"
                  }`}
                >
                  <span className="h-2 w-2 rounded-full bg-current" />
                  {isEnabled ? "Enabled" : "Disabled"}
                </span>
              </div>

              {/* Limit Controls (if applicable) */}
              {feature?.global_limit !== undefined && (
                <div className="pt-3 border-t border-slate-800">
                  <p className="text-xs text-slate-400 mb-2">Global Limit</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={feature.global_limit}
                      className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-slate-600 focus:outline-none"
                      disabled
                    />
                    <span className="text-xs text-slate-500">
                      {feature.current_usage ?? 0} used
                    </span>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-3 border-t border-slate-800">
                <button
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isEnabled
                      ? "bg-red-600/20 text-red-300 hover:bg-red-600/30"
                      : "bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30"
                  }`}
                >
                  {isEnabled ? "Disable" : "Enable"}
                </button>
                <button className="px-3 py-2 rounded-lg bg-slate-700/20 text-slate-300 hover:bg-slate-700/30 text-sm font-medium transition-colors">
                  <Settings className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Settings Information */}
      <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-6">
        <h2 className="text-lg font-semibold text-slate-100 mb-4">
          Global Settings
        </h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between p-3 rounded-lg border border-slate-800/50 bg-slate-800/20">
            <span className="text-slate-400">Features Enabled</span>
            <span className="font-semibold text-slate-100">
              {features.filter((f) => f.enabled).length} / {features.length}
            </span>
          </div>
          <div className="flex justify-between p-3 rounded-lg border border-slate-800/50 bg-slate-800/20">
            <span className="text-slate-400">Features with Limits</span>
            <span className="font-semibold text-slate-100">
              {features.filter((f) => f.global_limit !== undefined).length}
            </span>
          </div>
          <p className="text-slate-500 text-xs pt-2">
            💡 Feature flags control what capabilities are available to all organizations. Changes take effect immediately across the platform.
          </p>
        </div>
      </div>
    </div>
  );
}
