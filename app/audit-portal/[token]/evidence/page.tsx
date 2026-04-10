import { validateAuditorToken, logAuditorActivity } from '@/lib/auditor/portal';
import { redirect } from 'next/navigation';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { FileText } from 'lucide-react';

export default async function AuditPortalEvidence({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const tokenData = await validateAuditorToken(token);
  if (!tokenData) redirect('/');

  const db = createSupabaseAdminClient();
  const orgId = tokenData.org_id;

  await logAuditorActivity(tokenData.id, orgId, 'viewed_evidence');

  const { data: evidence } = await db
    .from('org_evidence')
    .select(
      'id, title, description, status, file_type, freshness_status, valid_until, created_at, control_id',
    )
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false });

  const items = evidence ?? [];

  const statusColor: Record<string, string> = {
    current: 'text-green-500',
    expiring_soon: 'text-yellow-500',
    expired: 'text-red-500',
    needs_review: 'text-orange-500',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Evidence Browser</h1>
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
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-muted/20">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{item.title}</p>
                      {item.description && (
                        <p className="line-clamp-1 text-xs text-muted-foreground">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {item.file_type ?? '—'}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={
                      statusColor[item.freshness_status ?? 'current'] ??
                      'text-muted-foreground'
                    }
                  >
                    {(item.freshness_status ?? 'current').replace('_', ' ')}
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
            ))}
            {items.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-12 text-center text-muted-foreground"
                >
                  No evidence items available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
