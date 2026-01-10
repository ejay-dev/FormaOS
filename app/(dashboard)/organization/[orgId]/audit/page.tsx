import { getAuditLogs } from "@/lib/data/audit-logs";

interface PageProps {
  params: {
    orgId: string;
  };
}

export default async function AuditPage({ params }: PageProps) {
  const logs = await getAuditLogs(params.orgId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-100">
          Audit Trail
        </h1>
        <p className="text-slate-400">
          Immutable record of all sensitive actions in this organization.
        </p>
      </div>

      <div className="rounded-md border border-white/10 bg-white/5">
        <div className="relative w-full overflow-auto">
          <table className="w-full caption-bottom text-sm text-left">
            <thead className="border-b border-white/10">
              <tr className="border-b border-white/10 transition-colors hover:bg-[#05080f]">
                <th className="h-12 px-4 align-middle font-medium text-slate-400">
                  Action
                </th>
                <th className="h-12 px-4 align-middle font-medium text-slate-400">
                  Resource
                </th>
                <th className="h-12 px-4 align-middle font-medium text-slate-400">
                  Date
                </th>
                <th className="h-12 px-4 align-middle font-medium text-slate-400">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-slate-400">
                    No audit records found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr
                    key={log.id}
                    className="border-b border-white/10 transition-colors hover:bg-[#05080f]"
                  >
                    <td className="p-4 align-middle font-medium">
                      <span className="inline-flex items-center rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-200">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-4 align-middle font-mono text-xs text-slate-400">
                      {log.target_resource}
                    </td>
                    <td className="p-4 align-middle text-slate-300">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="p-4 align-middle text-slate-400">
                      <pre className="text-xs whitespace-pre-wrap">
                        {JSON.stringify(log.metadata, null, 2)}
                      </pre>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
