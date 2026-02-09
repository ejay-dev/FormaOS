import { getAdminFetchConfig } from "@/app/admin/lib";
import { TrendingUp, Users, Building2, CreditCard, Zap, Activity } from "lucide-react";

type OverviewData = {
  totalOrgs: number;
  activeByPlan: Record<string, number>;
  trialsActive: number;
  trialsExpiring: number;
  mrrCents: number;
  failedPayments: number;
  orgsByDay: Array<{ date: string; count: number }>;
};

async function fetchOverview() {
  const { base, headers } = await getAdminFetchConfig();
  const res = await fetch(`${base}/api/admin/overview`, { 
    cache: "no-store", 
    headers 
  });
  if (!res.ok) return null;
  return res.json();
}

function KPICard({
  icon: Icon,
  label,
  value,
  detail,
  color,
}: {
  icon: any;
  label: string;
  value: string | number;
  detail?: string;
  color: "blue" | "green" | "purple" | "amber";
}) {
  const colorMap = {
    blue: "from-blue-500/10 to-blue-600/5 border-blue-400/20 text-blue-300",
    green: "from-emerald-500/10 to-emerald-600/5 border-emerald-400/20 text-emerald-300",
    purple: "from-purple-500/10 to-purple-600/5 border-purple-400/20 text-purple-300",
    amber: "from-amber-500/10 to-amber-600/5 border-amber-400/20 text-amber-300",
  };

  return (
    <div
      className={`rounded-lg border bg-gradient-to-br ${colorMap[color]} p-6 space-y-2`}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-400">{label}</span>
        <Icon className="h-5 w-5 opacity-50" />
      </div>
      <div className="text-3xl font-bold text-slate-100">{value}</div>
      {detail && <div className="text-xs text-slate-400">{detail}</div>}
    </div>
  );
}

export default async function AdminDashboard() {
  const data: OverviewData | null = await fetchOverview();

  if (!data) {
    return (
      <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-8 text-center">
        <p className="text-slate-400">Unable to load dashboard data</p>
      </div>
    );
  }

  const formatCurrency = (cents: number) =>
    new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: "AUD",
      minimumFractionDigits: 0,
    }).format(cents / 100);

  const basicCount = data.activeByPlan["basic"] || 0;
  const proCount = data.activeByPlan["pro"] || 0;
  const enterpriseCount = data.activeByPlan["enterprise"] || 0;
  const maxOrgCount = Math.max(...data.orgsByDay.map((d: { count: number }) => d.count), 1);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-100">Platform Overview</h1>
        <p className="mt-2 text-sm text-slate-400">
          Real-time operational metrics for FormaOS
        </p>
      </div>

      {/* KPI Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <KPICard
          icon={Building2}
          label="Total Organizations"
          value={data.totalOrgs}
          detail="Active tenants on platform"
          color="blue"
        />
        <KPICard
          icon={Users}
          label="Active Trials"
          value={data.trialsActive}
          detail={
            data.trialsExpiring > 0
              ? `${data.trialsExpiring} expiring soon`
              : "All stable"
          }
          color="amber"
        />
        <KPICard
          icon={CreditCard}
          label="Monthly Recurring"
          value={formatCurrency(data.mrrCents)}
          detail={`${basicCount + proCount + enterpriseCount} paid subscriptions`}
          color="green"
        />
        <KPICard
          icon={Zap}
          label="Starter Plan"
          value={basicCount}
          detail="Organizations on Basic tier"
          color="purple"
        />
        <KPICard
          icon={TrendingUp}
          label="Pro Plan"
          value={proCount}
          detail="Organizations on Pro tier"
          color="green"
        />
        <KPICard
          icon={Activity}
          label="Failed Payments"
          value={data.failedPayments}
          detail={
            data.failedPayments > 0
              ? "Action required"
              : "All payments current"
          }
          color={data.failedPayments > 0 ? "amber" : "blue"}
        />
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-6">
          <h2 className="text-lg font-semibold text-slate-100 mb-4">
            Organization Growth
          </h2>
          <div className="h-48 flex items-end gap-2 overflow-hidden">
            {data.orgsByDay.map((day, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center">
                <div
                  className="w-full bg-blue-500/40 hover:bg-blue-500/60 rounded-t transition-colors"
                  style={{
                    height: `${Math.max(Math.round((day.count / maxOrgCount) * 140), 4)}px`,
                  }}
                />
                <span className="text-[10px] text-slate-500 mt-2">
                  {new Date(day.date + "T00:00:00").toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-6">
          <h2 className="text-lg font-semibold text-slate-100 mb-4">
            Plan Distribution
          </h2>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">Starter</span>
                <span className="text-sm font-semibold text-slate-100">
                  {basicCount}
                </span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500"
                  style={{
                    width: `${
                      ((basicCount) / Math.max(data.totalOrgs, 1)) * 100
                    }%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">Pro</span>
                <span className="text-sm font-semibold text-slate-100">
                  {proCount}
                </span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500"
                  style={{
                    width: `${
                      ((proCount) / Math.max(data.totalOrgs, 1)) * 100
                    }%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">Enterprise</span>
                <span className="text-sm font-semibold text-slate-100">
                  {enterpriseCount}
                </span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500"
                  style={{
                    width: `${
                      ((enterpriseCount) / Math.max(data.totalOrgs, 1)) * 100
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
