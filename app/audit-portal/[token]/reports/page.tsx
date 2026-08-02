import { validateAuditorToken, logAuditorActivity } from '@/lib/auditor/portal';
import { FileText, Download } from 'lucide-react';
import { AccessUnavailable } from '../AccessUnavailable';
import { REPORT_DETAILS, getAvailableReportTypes } from './available-reports';

export default async function AuditPortalReports({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const tokenData = await validateAuditorToken(token);
  if (!tokenData) return <AccessUnavailable />;

  await logAuditorActivity(tokenData.id, tokenData.org_id, 'viewed_report');

  const reportTypes = await getAvailableReportTypes(
    tokenData.org_id,
    tokenData.scopes,
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Reports</h1>
        <p className="text-sm text-muted-foreground">
          Generated from this organisation&apos;s current control and evidence
          data.
        </p>
      </div>

      {reportTypes.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
          No reports are available for the frameworks in your access scope. Ask
          your contact at the organisation if you expected one here.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {reportTypes.map((type) => {
            const report = REPORT_DETAILS[type];
            return (
              <div
                key={type}
                className="rounded-lg border border-border bg-card p-5"
              >
                <div className="flex items-start gap-3">
                  <FileText className="mt-0.5 h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <h2 className="font-semibold">{report.name}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {report.description}
                    </p>
                    <a
                      href={`/audit-portal/${token}/reports/download?type=${type}`}
                      className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download PDF
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
