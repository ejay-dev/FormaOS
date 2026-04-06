import { createSupabaseServerClient } from '@/lib/supabase/server';
import {
  History,
  ShieldCheck,
  ChevronRight,
  AlertTriangle,
  LayoutGrid,
} from 'lucide-react';
import { redirect } from 'next/navigation';

/**
 * ✅ HELPER: Extract meaningful labels from the JSON details blob
 */
function getResourceLabel(log: any) {
  const d = log?.details || {};
  if (log.target_resource) return String(log.target_resource);
  if (d.target_resource) return String(d.target_resource);
  if (d.resource_name) return String(d.resource_name);
  if (d.document_type) return `${String(d.document_type)} Document`;
  if (d.email) return `User: ${d.email}`;
  return 'General Resource';
}

export default async function AuditTrailPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/signin');

  /**
   * 🔒 STEP 1: Fetch membership WITHOUT joins (RLS-safe)
   */
  const { data: membership, error: membershipError } = await supabase
    .from('org_members')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .maybeSingle();

  if (membershipError || !membership) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 sm:p-8 md:p-12 text-center animate-in fade-in zoom-in duration-500">
        <div className="bg-red-50 h-20 w-20 rounded-3xl flex items-center justify-center mb-6 border border-red-100 shadow-sm">
          <AlertTriangle className="h-10 w-10 text-red-600" />
        </div>
        <h1 className="text-2xl font-black text-neutral-900 tracking-tight">
          Access Restricted
        </h1>
        <p className="text-neutral-500 mt-3 font-medium max-w-md mx-auto leading-relaxed">
          No active organization membership found. If you just created a
          workspace, the link might still be propagating.
        </p>
        <div className="mt-8 bg-neutral-900 text-white px-6 py-4 rounded-xl font-mono text-xs">
          Diagnostic ID: {user.id}
        </div>
      </div>
    );
  }

  /**
   * 🔒 STEP 2: Role Gate
   */
  if (membership.role !== 'admin' && membership.role !== 'manager') {
    redirect('/app');
  }

  /**
   * 🔒 STEP 3: Fetch organization separately (no recursion)
   */
  const { data: organization, error: orgError } = await supabase
    .from('organizations')
    .select('id, name')
    .eq('id', membership.organization_id)
    .maybeSingle();

  if (orgError || !organization) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 sm:p-8 md:p-12 text-center animate-in fade-in zoom-in duration-500">
        <div className="bg-red-50 h-20 w-20 rounded-3xl flex items-center justify-center mb-6 border border-red-100 shadow-sm">
          <AlertTriangle className="h-10 w-10 text-red-600" />
        </div>
        <h1 className="text-2xl font-black text-neutral-900 tracking-tight">
          Configuration Error
        </h1>
        <p className="text-neutral-500 mt-3 font-medium max-w-md mx-auto leading-relaxed">
          We could not verify your organization details. This usually indicates
          an RLS restriction or a deleted workspace.
        </p>
      </div>
    );
  }

  /**
   * 🔒 STEP 4: Fetch audit logs by organization_id
   */
  const { data: logs } = await supabase
    .from('org_audit_logs')
    .select('*')
    .eq('organization_id', organization.id)
    .order('created_at', { ascending: false })
    .limit(5);

  const auditEvents = logs || [];
  const verifiedCount = auditEvents.length;
  const orgName = organization.name;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Audit Trail</h1>
          <p className="page-description">
            Immutable governance log — ISO 27001 non-repudiation
          </p>
        </div>
        <span className="status-pill status-pill-green">
          <ShieldCheck className="h-3 w-3" />
          {verifiedCount} Events
        </span>
      </div>

      <div className="page-content space-y-4">
      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        {auditEvents.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <History className="h-8 w-8 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No governance actions recorded yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-sm font-medium">Actor</th>
                  <th className="px-4 py-3 text-sm font-medium">Event</th>
                  <th className="px-4 py-3 text-sm font-medium">Target</th>
                  <th className="px-4 py-3 text-sm font-medium text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {auditEvents.map((log: any) => (
                  <tr
                    key={log.id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium">
                        {log.actor_id === user.id
                          ? 'You'
                          : `User ${log.actor_id?.slice(0, 4)}`}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="status-pill status-pill-blue">
                        {String(log.action || 'UNKNOWN').replaceAll('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm">
                        {getResourceLabel(log)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="text-xs font-mono text-muted-foreground">
                        {new Date(log.created_at).toLocaleDateString()}{' '}
                        {new Date(log.created_at).toLocaleTimeString()}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
