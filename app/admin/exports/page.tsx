import { getAdminFetchConfig } from '@/app/admin/lib';
import { ExternalLink, FileArchive, AlertTriangle } from 'lucide-react';

type ExportJob = {
  id: string;
  organizationId: string;
  organizationName: string | null;
  type: 'compliance' | 'report';
  label: string;
  status: string;
  progress: number;
  fileUrl: string | null;
  fileSize: number | null;
  errorMessage: string | null;
  createdAt: string | null;
  completedAt: string | null;
};

export default async function AdminExportsPage() {
  const { base, headers } = await getAdminFetchConfig();
  const res = await fetch(`${base}/api/admin/exports`, {
    headers,
    cache: 'no-store',
  });

  const data = res.ok ? await res.json() : { jobs: [] };
  const jobs: ExportJob[] = data.jobs ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-slate-800/60 p-2">
          <FileArchive className="h-5 w-5 text-sky-300" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-slate-100">Exports</h1>
          <p className="text-xs text-slate-400">
            Recent evidence packs and certification reports.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/50">
        <div className="overflow-x-auto">
          <table className="min-w-[900px] w-full text-left text-sm">
            <thead className="border-b border-slate-800 text-slate-400">
              <tr>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Organization</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Created</th>
                <th className="px-6 py-4">Completed</th>
                <th className="px-6 py-4">File</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {jobs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-slate-400">
                    No exports found.
                  </td>
                </tr>
              ) : (
                jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-900/60">
                    <td className="px-6 py-4">
                      <div className="font-medium">{job.label}</div>
                      <div className="text-[10px] text-slate-500 uppercase">
                        {job.type}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-100">
                        {job.organizationName ?? 'Unknown Org'}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {job.organizationId?.split('-')[0]}...
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="capitalize">{job.status}</span>
                        {job.status === 'failed' && (
                          <AlertTriangle className="h-4 w-4 text-rose-400" />
                        )}
                      </div>
                      {job.status === 'processing' ? (
                        <div className="mt-1 text-[10px] text-slate-500">
                          {job.progress ?? 0}% complete
                        </div>
                      ) : null}
                      {job.errorMessage ? (
                        <div className="mt-1 text-[10px] text-rose-300">
                          {job.errorMessage}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      {job.createdAt
                        ? new Date(job.createdAt).toLocaleString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '—'}
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      {job.completedAt
                        ? new Date(job.completedAt).toLocaleString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '—'}
                    </td>
                    <td className="px-6 py-4">
                      {job.fileUrl ? (
                        <a
                          href={job.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-sky-300 hover:text-sky-200 text-xs"
                        >
                          Open
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-slate-500 text-xs">—</span>
                      )}
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

