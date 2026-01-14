import { getAdminFetchConfig } from "@/app/admin/lib";
import { Shield, User, Building2, Calendar } from "lucide-react";

type AuditEntry = {
  id: string;
  actor_user_id: string;
  action: string;
  target_type: string;
  target_id: string;
  metadata: Record<string, any> | null;
  created_at: string;
};

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString();
}

function getActionIcon(targetType: string) {
  switch (targetType) {
    case "organization": return <Building2 className="h-4 w-4 text-blue-400" />;
    case "user": return <User className="h-4 w-4 text-green-400" />;
    case "subscription": return <Shield className="h-4 w-4 text-purple-400" />;
    default: return <Calendar className="h-4 w-4 text-gray-400" />;
  }
}

async function fetchAuditLog(page?: string) {
  const { base, headers } = await getAdminFetchConfig();
  const params = new URLSearchParams();
  if (page) params.set("page", page);

  const res = await fetch(`${base}/api/admin/audit?${params.toString()}`, {
    cache: "no-store",
    headers,
  });
  if (!res.ok) return null;
  return res.json();
}

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string }>;
}) {
  const resolved = await searchParams;
  const data = await fetchAuditLog(resolved?.page);
  const entries: AuditEntry[] = data?.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-100">Audit Log</h1>
        <p className="mt-2 text-sm text-slate-400">
          Administrative actions and system events.
        </p>
      </div>

      {entries.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center">
          <Shield className="mx-auto h-12 w-12 text-slate-600 mb-4" />
          <h3 className="text-lg font-semibold text-slate-300 mb-2">No audit entries</h3>
          <p className="text-sm text-slate-500">
            Administrative actions will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="rounded-lg border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="mt-1">{getActionIcon(entry.target_type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-100">
                      {entry.action}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      <span className="font-mono">
                        {entry.target_type}:{entry.target_id.substring(0, 8)}...
                      </span>
                      {entry.metadata && Object.keys(entry.metadata).length > 0 && (
                        <span className="ml-2 text-slate-500">
                          • {JSON.stringify(entry.metadata)}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 mt-1 font-mono">
                      Actor: {entry.actor_user_id.substring(0, 8)}...
                    </div>
                  </div>
                </div>
                <div className="text-xs text-slate-500 ml-4 flex-shrink-0">
                  {formatDate(entry.created_at)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {data?.pagination && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-white/10 pt-4">
          <p className="text-sm text-slate-400">
            Page {data.pagination.page} of {data.pagination.totalPages} •{" "}
            {data.pagination.total} total entries
          </p>
          <div className="flex gap-2">
            {data.pagination.page > 1 && (
              <a
                href={`/admin/audit?page=${data.pagination.page - 1}`}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white/10 text-slate-300 hover:bg-white/20 transition-colors"
              >
                Previous
              </a>
            )}
            {data.pagination.page < data.pagination.totalPages && (
              <a
                href={`/admin/audit?page=${data.pagination.page + 1}`}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white/10 text-slate-300 hover:bg-white/20 transition-colors"
              >
                Next
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}