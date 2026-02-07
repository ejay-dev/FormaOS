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
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-12 text-center animate-in fade-in zoom-in duration-500">
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
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-12 text-center animate-in fade-in zoom-in duration-500">
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
    <div className="space-y-8 pb-24 max-w-[1600px] animate-in fade-in duration-700">
      {/* HEADER */}
      <header className="flex flex-col gap-8 border-b border-neutral-200 pb-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">
              <LayoutGrid className="h-3 w-3" />
              <span>{orgName || 'Organization'}</span>
              <ChevronRight className="h-3 w-3" />
              <span className="text-neutral-900">Governance Log</span>
            </div>

            <div className="flex items-center gap-5">
              <div className="h-14 w-14 rounded-[1.25rem] bg-neutral-900 text-white flex items-center justify-center shadow-lg shadow-neutral-200">
                <History className="h-7 w-7" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-neutral-900 tracking-tight">
                  System Audit Trail
                </h1>
                <p className="text-neutral-500 mt-1 font-medium tracking-tight max-w-xl leading-relaxed text-sm">
                  Immutable record of governance actions. This log satisfies ISO
                  27001 non-repudiation requirements.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-start md:items-end gap-3">
            <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100 shadow-sm">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em]">
                {verifiedCount} Verified Events
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* TABLE */}
      <div className="bg-white border border-neutral-200 rounded-[2.5rem] shadow-sm overflow-hidden min-h-[400px]">
        {auditEvents.length === 0 ? (
          <div className="p-20 text-center space-y-6 flex flex-col items-center justify-center h-full">
            <History className="h-10 w-10 text-neutral-200" />
            <div>
              <h3 className="text-lg font-black text-neutral-900">
                Ledger Empty
              </h3>
              <p className="text-neutral-500 text-sm mt-1 max-w-xs mx-auto">
                No governance actions have been recorded for this node yet.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-neutral-50/80 border-b border-neutral-100 sticky top-0 backdrop-blur-md">
                <tr className="text-[10px] font-black uppercase text-neutral-400 tracking-[0.2em]">
                  <th className="px-8 py-6">Actor</th>
                  <th className="px-8 py-6">Event Type</th>
                  <th className="px-8 py-6">Target Resource</th>
                  <th className="px-8 py-6 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50">
                {auditEvents.map((log: any) => (
                  <tr
                    key={log.id}
                    className="group hover:bg-neutral-50/50 transition-colors"
                  >
                    <td className="px-8 py-5">
                      <p className="text-[10px] font-black text-neutral-900 uppercase tracking-widest">
                        {log.actor_id === user.id
                          ? 'You'
                          : `User ${log.actor_id?.slice(0, 4)}`}
                      </p>
                    </td>
                    <td className="px-8 py-5">
                      <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-neutral-900 text-white text-[9px] font-black uppercase tracking-[0.15em]">
                        {String(log.action || 'UNKNOWN').replaceAll('_', ' ')}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-xs font-bold">
                        {getResourceLabel(log)}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="text-xs font-bold">
                        {new Date(log.created_at).toLocaleDateString()}
                      </div>
                      <div className="text-[10px] text-neutral-400 font-mono">
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
  );
}
