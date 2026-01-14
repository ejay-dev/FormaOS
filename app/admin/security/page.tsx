import { getAdminFetchConfig } from "@/app/admin/lib";
import {
  AlertTriangle,
  Shield,
  Lock,
  LogIn,
  Users,
  Activity,
} from "lucide-react";

type SecurityEvent = {
  id: string;
  event_type: string;
  severity: "low" | "medium" | "high" | "critical";
  user_email?: string;
  organization_id?: string;
  description: string;
  timestamp: string;
  ip_address?: string;
};

async function fetchSecurity() {
  const { base, headers } = await getAdminFetchConfig();
  const res = await fetch(`${base}/api/admin/security`, {
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
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function getSeverityBadge(severity: string) {
  switch (severity) {
    case "critical":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-red-500/10 text-red-300">
          <AlertTriangle className="h-3 w-3" />
          Critical
        </span>
      );
    case "high":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-orange-500/10 text-orange-300">
          <AlertTriangle className="h-3 w-3" />
          High
        </span>
      );
    case "medium":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-amber-500/10 text-amber-300">
          Alert
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-slate-600/10 text-slate-300">
          Info
        </span>
      );
  }
}

export default async function AdminSecurityPage() {
  const data = await fetchSecurity();
  const events: SecurityEvent[] = data?.events ?? [];

  const criticalEvents = events.filter(
    (e) => e.severity === "critical" || e.severity === "high"
  );
  const recentEvents = events.slice(0, 20);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-100">Security</h1>
        <p className="mt-2 text-sm text-slate-400">
          Monitor authentication, access control, and suspicious activity
        </p>
      </div>

      {/* Alert Banner */}
      {criticalEvents.length > 0 && (
        <div className="rounded-lg border border-red-800/30 bg-red-900/10 p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-red-400 flex-shrink-0" />
            <div>
              <p className="font-semibold text-red-200">
                {criticalEvents.length} Critical Event
                {criticalEvents.length !== 1 ? "s" : ""}
              </p>
              <p className="text-sm text-red-200/70">
                Requires immediate attention
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Security Metrics */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-100">
              Login Attempts
            </h3>
            <LogIn className="h-5 w-5 text-blue-500/50" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-400">Last 24h</span>
              <span className="font-semibold text-slate-100">
                {events.filter((e) => e.event_type === "login").length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Failed Attempts</span>
              <span className="font-semibold text-amber-300">
                {events.filter((e) => e.event_type === "login_failed").length}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-100">
              Access Changes
            </h3>
            <Users className="h-5 w-5 text-emerald-500/50" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-400">Role Changes</span>
              <span className="font-semibold text-slate-100">
                {events.filter((e) => e.event_type === "role_change").length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Permission Updates</span>
              <span className="font-semibold text-slate-100">
                {events.filter((e) => e.event_type === "permission_update").length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* OAuth Providers */}
      <section className="rounded-lg border border-slate-800 bg-slate-900/50 p-6">
        <h2 className="text-lg font-semibold text-slate-100 mb-4">
          OAuth Providers
        </h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg border border-slate-800/50 bg-slate-800/20">
            <div className="flex items-center gap-3">
              <Lock className="h-5 w-5 text-slate-500" />
              <div>
                <p className="text-sm font-medium text-slate-100">Google</p>
                <p className="text-xs text-slate-500">OAuth 2.0</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-emerald-500/10 text-emerald-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Connected
            </span>
          </div>
        </div>
      </section>

      {/* Recent Security Events */}
      <section className="rounded-lg border border-slate-800 bg-slate-900/50 p-6">
        <h2 className="text-lg font-semibold text-slate-100 mb-4">
          Recent Events
        </h2>
        <div className="space-y-2">
          {recentEvents.length > 0 ? (
            recentEvents.map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between p-3 rounded-lg border border-slate-800/50 bg-slate-800/20 hover:bg-slate-800/40 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <Activity className="h-4 w-4 text-slate-500 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-slate-200 truncate">
                        {event.description}
                      </p>
                      {event.user_email && (
                        <p className="text-xs text-slate-500">
                          {event.user_email}
                          {event.ip_address && ` • ${event.ip_address}`}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 ml-4">
                  {getSeverityBadge(event.severity)}
                  <span className="text-xs text-slate-500 whitespace-nowrap">
                    {formatDate(event.timestamp)}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-slate-500">
              <Shield className="h-8 w-8 opacity-20 mx-auto mb-2" />
              <p>No security events</p>
            </div>
          )}
        </div>
      </section>

      {/* Security Recommendations */}
      <div className="rounded-lg border border-blue-800/30 bg-blue-900/10 p-6">
        <h3 className="text-lg font-semibold text-blue-200 mb-4">
          Security Best Practices
        </h3>
        <ul className="space-y-2 text-sm text-blue-100/80">
          <li>✓ Monitor login attempts regularly</li>
          <li>✓ Review role changes for unauthorized access</li>
          <li>✓ Enforce strong password policies</li>
          <li>✓ Enable MFA for all admin accounts</li>
          <li>✓ Use VPN for platform administration</li>
          <li>✓ Review audit logs weekly</li>
        </ul>
      </div>
    </div>
  );
}
