import { getAdminFetchConfig } from "@/app/admin/lib";
import { Clock, AlertTriangle, CheckCircle, Lock, Zap } from "lucide-react";

type Trial = {
  id: string;
  organization_id: string;
  organization_name: string;
  trial_ends_at: string;
  status: "active" | "expiring" | "expired";
  owner_email: string;
};

async function fetchTrials() {
  const { base, headers } = await getAdminFetchConfig();
  const res = await fetch(`${base}/api/admin/trials`, {
    cache: "no-store",
    headers,
  });
  if (!res.ok) return null;
  return res.json();
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function getDaysRemaining(dateStr: string): number {
  const now = new Date();
  const trialEnd = new Date(dateStr);
  const diffMs = trialEnd.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

function getStatusBadge(status: string, daysRemaining: number) {
  if (status === "expired") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium bg-red-500/10 text-red-300">
        <AlertTriangle className="h-3 w-3" />
        Expired
      </span>
    );
  }
  if (daysRemaining <= 3 && daysRemaining > 0) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium bg-amber-500/10 text-amber-300">
        <Clock className="h-3 w-3" />
        Expiring Soon
      </span>
    );
  }
  if (daysRemaining > 0) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium bg-emerald-500/10 text-emerald-300">
        <CheckCircle className="h-3 w-3" />
        Active
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium bg-red-500/10 text-red-300">
      <AlertTriangle className="h-3 w-3" />
      Expired
    </span>
  );
}

export default async function AdminTrialsPage() {
  const data = await fetchTrials();
  const trials: Trial[] = data?.trials ?? [];

  const now = new Date();
  const activeTrials = trials.filter((t) => new Date(t.trial_ends_at) > now);
  const expiringTrials = activeTrials.filter(
    (t) => getDaysRemaining(t.trial_ends_at) <= 3
  );
  const expiredTrials = trials.filter((t) => new Date(t.trial_ends_at) <= now);

  const categorizedTrials = {
    active: activeTrials.filter((t) => getDaysRemaining(t.trial_ends_at) > 3),
    expiring: expiringTrials,
    expired: expiredTrials,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-100">Trial Management</h1>
        <p className="mt-2 text-sm text-slate-400">
          Manage trial lifecycles, extensions, and expirations
        </p>
      </div>

      {/* Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Active Trials</p>
              <p className="text-2xl font-bold text-slate-100">
                {categorizedTrials.active.length}
              </p>
            </div>
            <CheckCircle className="h-6 w-6 text-emerald-500/50" />
          </div>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Expiring Soon</p>
              <p className="text-2xl font-bold text-slate-100">
                {categorizedTrials.expiring.length}
              </p>
            </div>
            <Clock className="h-6 w-6 text-amber-500/50" />
          </div>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Expired</p>
              <p className="text-2xl font-bold text-slate-100">
                {categorizedTrials.expired.length}
              </p>
            </div>
            <AlertTriangle className="h-6 w-6 text-red-500/50" />
          </div>
        </div>
      </div>

      {/* Active Trials */}
      <section className="rounded-lg border border-slate-800 bg-slate-900/50 p-6">
        <h2 className="text-lg font-semibold text-slate-100 mb-4">
          Active Trials
        </h2>
        {categorizedTrials.active.length > 0 ? (
          <div className="space-y-3">
            {categorizedTrials.active.map((trial) => (
              <div
                key={trial.id}
                className="flex items-center justify-between p-4 rounded-lg border border-slate-800/50 bg-slate-800/20 hover:bg-slate-800/40 transition-colors"
              >
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-100">
                    {trial.organization_name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {trial.owner_email}
                  </p>
                </div>
                <div className="text-right mr-4">
                  <p className="text-sm text-slate-300">
                    {getDaysRemaining(trial.trial_ends_at)} days remaining
                  </p>
                  <p className="text-xs text-slate-500">
                    Expires {formatDate(trial.trial_ends_at)}
                  </p>
                </div>
                <button className="px-3 py-2 rounded-lg bg-blue-600/20 text-blue-300 hover:bg-blue-600/30 text-sm font-medium transition-colors">
                  Extend
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500">
            <CheckCircle className="h-8 w-8 opacity-20 mx-auto mb-2" />
            <p>No active trials</p>
          </div>
        )}
      </section>

      {/* Expiring Soon */}
      <section className="rounded-lg border border-amber-800/30 bg-amber-900/10 p-6">
        <h2 className="text-lg font-semibold text-amber-200 mb-4">
          ⚠ Expiring Soon (≤3 Days)
        </h2>
        {categorizedTrials.expiring.length > 0 ? (
          <div className="space-y-3">
            {categorizedTrials.expiring.map((trial) => (
              <div
                key={trial.id}
                className="flex items-center justify-between p-4 rounded-lg border border-amber-800/30 bg-amber-900/20 hover:bg-amber-900/30 transition-colors"
              >
                <div className="flex-1">
                  <p className="text-sm font-semibold text-amber-100">
                    {trial.organization_name}
                  </p>
                  <p className="text-xs text-amber-200/70">
                    {trial.owner_email}
                  </p>
                </div>
                <div className="text-right mr-4">
                  <p className="text-sm text-amber-100 font-semibold">
                    {getDaysRemaining(trial.trial_ends_at)} days left
                  </p>
                  <p className="text-xs text-amber-200/50">
                    Expires {formatDate(trial.trial_ends_at)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button className="px-3 py-2 rounded-lg bg-blue-600/20 text-blue-300 hover:bg-blue-600/30 text-sm font-medium transition-colors">
                    Extend
                  </button>
                  <button className="px-3 py-2 rounded-lg bg-red-600/20 text-red-300 hover:bg-red-600/30 text-sm font-medium transition-colors">
                    Expire
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-amber-200/50">
            <Clock className="h-8 w-8 opacity-20 mx-auto mb-2" />
            <p>No trials expiring soon</p>
          </div>
        )}
      </section>

      {/* Expired Trials */}
      <section className="rounded-lg border border-red-800/30 bg-red-900/10 p-6">
        <h2 className="text-lg font-semibold text-red-200 mb-4">
          Expired Trials
        </h2>
        {categorizedTrials.expired.length > 0 ? (
          <div className="space-y-3">
            {categorizedTrials.expired.map((trial) => (
              <div
                key={trial.id}
                className="flex items-center justify-between p-4 rounded-lg border border-red-800/30 bg-red-900/20 hover:bg-red-900/30 transition-colors"
              >
                <div className="flex-1">
                  <p className="text-sm font-semibold text-red-100">
                    {trial.organization_name}
                  </p>
                  <p className="text-xs text-red-200/70">
                    {trial.owner_email}
                  </p>
                </div>
                <div className="text-right mr-4">
                  <p className="text-sm text-red-100">
                    Expired {Math.abs(getDaysRemaining(trial.trial_ends_at))} days ago
                  </p>
                  <p className="text-xs text-red-200/50">
                    {formatDate(trial.trial_ends_at)}
                  </p>
                </div>
                <button className="px-3 py-2 rounded-lg bg-blue-600/20 text-blue-300 hover:bg-blue-600/30 text-sm font-medium transition-colors">
                  Extend
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-red-200/50">
            <AlertTriangle className="h-8 w-8 opacity-20 mx-auto mb-2" />
            <p>No expired trials</p>
          </div>
        )}
      </section>
    </div>
  );
}
