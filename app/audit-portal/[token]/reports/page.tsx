import { validateAuditorToken, logAuditorActivity } from '@/lib/auditor/portal';
import { redirect } from 'next/navigation';
import { FileText, Download } from 'lucide-react';

export default async function AuditPortalReports({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const tokenData = await validateAuditorToken(token);
  if (!tokenData) redirect('/');

  await logAuditorActivity(tokenData.id, tokenData.org_id, 'viewed_report');

  const reports = [
    {
      name: 'SOC 2 Readiness Report',
      type: 'soc2',
      description: 'Type II readiness assessment with control status',
    },
    {
      name: 'ISO 27001 Compliance Snapshot',
      type: 'iso27001',
      description: 'Statement of Applicability coverage',
    },
    {
      name: 'Evidence Coverage Summary',
      type: 'coverage',
      description: 'Evidence coverage per control domain',
    },
    {
      name: 'Gap Analysis',
      type: 'gap',
      description: 'Controls without adequate evidence',
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Available Reports</h1>
        <p className="text-sm text-muted-foreground">
          Download audit-ready compliance reports.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {reports.map((report) => (
          <div
            key={report.type}
            className="rounded-lg border border-border bg-card p-5"
          >
            <div className="flex items-start gap-3">
              <FileText className="mt-0.5 h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <h3 className="font-semibold">{report.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {report.description}
                </p>
                <a
                  href={`/api/reports/export?type=${report.type}&format=pdf&mode=sync`}
                  className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download PDF
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
