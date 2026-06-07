import { getAdminFetchConfig } from '@/app/admin/lib';
import { ExternalLink, FileArchive, AlertTriangle } from 'lucide-react';
import { ExportActionButtons } from '@/app/admin/components/export-action-buttons';

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
        <div className="rounded-xl bg-muted p-2">
          <FileArchive className="h-5 w-5 text-muted-foreground" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-foreground">Exports</h1>
          <p className="text-xs text-muted-foreground">
            Recent evidence packs and certification reports. Retry failed jobs or cancel stuck ones.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="min-w-[960px] w-full text-left text-sm">
            <thead className="border-b border-border text-muted-foreground">
              <tr>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Organization</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Created</th>
                <th className="px-6 py-4">Completed</th>
                <th className="px-6 py-4">File</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-foreground">
              {jobs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-muted-foreground">
                    No exports found.
                  </td>
                </tr>
              ) : (
                jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-muted">
                    <td className="px-6 py-4">
                      <div className="font-medium">{job.label}</div>
                      <div className="text-[10px] text-muted-foreground uppercase">
                        {job.type}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-foreground">
                        {job.organizationName ?? 'Unknown Org'}
                      </div>
                      <div className="text-[10px] text-muted-foreground font-mono">
                        {job.organizationId?.split('-')[0]}...
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="capitalize">{job.status}</span>
                        {job.status === 'failed' && (
                          <AlertTriangle className="h-4 w-4 text-destructive" />
                        )}
                      </div>
                      {job.status === 'processing' ? (
                        <div className="mt-1 text-[10px] text-muted-foreground">
                          {job.progress ?? 0}% complete
                        </div>
                      ) : null}
                      {job.errorMessage ? (
                        <div className="mt-1 text-[10px] text-destructive">
                          {job.errorMessage}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {job.createdAt
                        ? new Date(job.createdAt).toLocaleString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '—'}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
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
                          className="inline-flex items-center gap-1 text-primary hover:text-primary/80 text-xs"
                        >
                          Open
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <ExportActionButtons
                        jobId={job.id}
                        jobType={job.type}
                        status={job.status}
                      />
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
