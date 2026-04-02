import { validateAuditorToken, logAuditorActivity } from '@/lib/auditor/portal';
import { redirect } from 'next/navigation';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { Shield, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

export default async function AuditPortalControls({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const tokenData = await validateAuditorToken(token);
  if (!tokenData) redirect('/');

  const db = createSupabaseAdminClient();
  const orgId = tokenData.org_id;

  await logAuditorActivity(tokenData.id, orgId, 'viewed_control');

  const { data: controls } = await db
    .from('org_controls')
    .select('id, code, title, description, status, priority, framework_id')
    .eq('organization_id', orgId)
    .order('code', { ascending: true });

  const items = controls ?? [];
  const satisfied = items.filter(
    (c) => c.status === 'satisfied' || c.status === 'implemented',
  ).length;
  const gaps = items.filter(
    (c) => c.status === 'not_started' || c.status === 'gap',
  ).length;

  const statusIcon: Record<string, typeof CheckCircle2> = {
    satisfied: CheckCircle2,
    implemented: CheckCircle2,
    gap: XCircle,
    not_started: XCircle,
    in_progress: AlertCircle,
    partial: AlertCircle,
  };

  const statusColor: Record<string, string> = {
    satisfied: 'text-green-500',
    implemented: 'text-green-500',
    gap: 'text-red-500',
    not_started: 'text-red-500',
    in_progress: 'text-yellow-500',
    partial: 'text-orange-500',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Control Browser</h1>
          <p className="text-sm text-muted-foreground">
            {items.length} controls • {satisfied} satisfied • {gaps} gaps
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                Code
              </th>
              <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                Control
              </th>
              <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                Status
              </th>
              <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                Priority
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.map((control) => {
              const Icon = statusIcon[control.status ?? ''] ?? Shield;
              const color =
                statusColor[control.status ?? ''] ?? 'text-muted-foreground';
              return (
                <tr key={control.id} className="hover:bg-muted/20">
                  <td className="px-4 py-3 font-mono text-xs">
                    {control.code ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{control.title}</p>
                    {control.description && (
                      <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                        {control.description}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`flex items-center gap-1 ${color}`}>
                      <Icon className="h-3.5 w-3.5" />
                      {(control.status ?? 'unknown').replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {control.priority ?? '—'}
                  </td>
                </tr>
              );
            })}
            {items.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-12 text-center text-muted-foreground"
                >
                  No controls available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
