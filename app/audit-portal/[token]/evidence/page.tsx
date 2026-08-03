import { validateAuditorToken, logAuditorActivity } from '@/lib/auditor/portal';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { FileText } from 'lucide-react';
import { AccessUnavailable } from '../AccessUnavailable';

/**
 * org_evidence.freshness_status defaults to 'current' in the database, so a
 * null reads as current here the same way it does in the coverage calculator.
 */
const FRESHNESS: Record<string, { label: string; className: string }> = {
  current: { label: 'Current', className: 'text-success' },
  expiring_soon: { label: 'Expiring soon', className: 'text-warning' },
  expired: { label: 'Expired', className: 'text-destructive' },
  needs_review: { label: 'Needs review', className: 'text-warning' },
};

export default async function AuditPortalEvidence({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const tokenData = await validateAuditorToken(token);
  if (!tokenData) return <AccessUnavailable />;

  const db = createSupabaseAdminClient();
  const orgId = tokenData.org_id;

  await logAuditorActivity(tokenData.id, orgId, 'viewed_evidence');

  const { data: evidence, error } = await db
    .from('org_evidence')
    .select(
      'id, title, file_name, file_type, freshness_status, valid_until, created_at',
    )
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false });

  const items = evidence ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Evidence</h1>
          <p className="text-sm text-muted-foreground">
            {items.length} evidence items
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                Evidence
              </th>
              <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                Type
              </th>
              <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                Freshness
              </th>
              <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                Valid Until
              </th>
              <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                Date
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.map((item) => {
              const freshness =
                FRESHNESS[item.freshness_status ?? 'current'] ??
                FRESHNESS.current;
              return (
                <tr key={item.id} className="hover:bg-muted/20">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <p className="font-medium">
                        {item.title ?? item.file_name}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {item.file_type ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={freshness.className}>
                      {freshness.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {item.valid_until
                      ? new Date(item.valid_until).toLocaleDateString()
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(item.created_at).toLocaleDateString()}
                  </td>
                </tr>
              );
            })}
            {items.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-12 text-center text-muted-foreground"
                >
                  {error
                    ? 'Evidence could not be loaded. Try again shortly.'
                    : 'No evidence has been recorded for this organisation yet.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
