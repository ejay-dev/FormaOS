import { validateAuditorToken, logAuditorActivity } from '@/lib/auditor/portal';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { MinusCircle, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { AccessUnavailable } from '../AccessUnavailable';
import {
  CONTROL_STATUS_LABELS,
  controlStatusGroup,
  type ControlStatusGroup,
} from '../control-status';

const STATUS_ICON: Record<ControlStatusGroup, typeof CheckCircle2> = {
  met: CheckCircle2,
  partial: AlertCircle,
  not_met: XCircle,
  not_applicable: MinusCircle,
  unassessed: MinusCircle,
  unknown: MinusCircle,
};

export default async function AuditPortalControls({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const tokenData = await validateAuditorToken(token);
  if (!tokenData) return <AccessUnavailable />;

  const db = createSupabaseAdminClient();
  const orgId = tokenData.org_id;

  await logAuditorActivity(tokenData.id, orgId, 'viewed_control');

  // org_controls also carries framework-level evaluation runs, whose
  // control_key ("framework:SOC2:<timestamp>") matches no framework control
  // and therefore resolves to a null code. Those are evaluation history, not
  // controls, and must not be counted or listed as such.
  const { data: controls, error } = await db
    .from('org_controls')
    .select('id, code, title, status, required')
    .eq('organization_id', orgId)
    .not('code', 'is', null)
    .order('code', { ascending: true });

  const items = controls ?? [];
  const met = items.filter(
    (c) => controlStatusGroup(c.status) === 'met',
  ).length;
  const notMet = items.filter(
    (c) => controlStatusGroup(c.status) === 'not_met',
  ).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Controls</h1>
          <p className="text-sm text-muted-foreground">
            {items.length} controls • {met} met • {notMet} not met
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
                Required
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.map((control) => {
              const group = controlStatusGroup(control.status);
              const status = CONTROL_STATUS_LABELS[group];
              const Icon = STATUS_ICON[group];
              return (
                <tr key={control.id} className="hover:bg-muted/20">
                  <td className="px-4 py-3 font-mono text-xs">
                    {control.code ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">
                      {control.title ?? control.code}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`flex items-center gap-1 ${status.className}`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {status.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {control.required === true
                      ? 'Required'
                      : control.required === false
                        ? 'Optional'
                        : '—'}
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
                  {error
                    ? 'Control data could not be loaded. Try again shortly.'
                    : 'No controls have been assessed for this organisation yet.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
