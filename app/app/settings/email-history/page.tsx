import { getOrganizationEmailLogs } from "@/lib/data/emails";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

type EmailLog = {
  id: string;
  email_type: string;
  recipient_email: string;
  subject: string;
  status: string;
  error_message: string | null;
  created_at: string;
  resend_id: string | null;
  user_id: string | null;
};

export default async function EmailHistoryPage() {
  const supabase = await createSupabaseServerClient();
  
  // 1. Identify the organization
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/signin");

  const { data: membership } = await supabase
    .from("org_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .single();

  if (!membership) return (
    <div className="p-12 text-center text-slate-400">
      No organization membership found. Please contact your administrator.
    </div>
  );

  // 2. Fetch upgraded logs (now includes error_message and tracking IDs)
  const logs: EmailLog[] = await getOrganizationEmailLogs(membership.organization_id);

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <div className="mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Email Delivery History</h1>
          <p className="text-slate-400">
            A forensic record of all transactional communications sent to your team.
          </p>
        </div>
        <div className="text-xs text-slate-400 font-mono bg-white/10 px-3 py-1 rounded border">
          Org ID: {membership.organization_id.split('-')[0]}...
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto overscroll-x-contain">
        <table className="min-w-[640px] sm:min-w-[760px] w-full text-left text-sm">
          <thead className="bg-white/10 border-b border-white/10 text-slate-400 font-medium">
            <tr>
              <th className="px-4 sm:px-6 py-4">Recipient</th>
              <th className="px-4 sm:px-6 py-4">Type</th>
              <th className="px-4 sm:px-6 py-4">Subject</th>
              <th className="px-4 sm:px-6 py-4">Status & Logic</th>
              <th className="px-4 sm:px-6 py-4">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 sm:px-6 py-12 text-center text-slate-400 italic">
                  No emails have been sent yet.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-4 sm:px-6 py-4 font-medium text-slate-100">
                    <div className="flex flex-col">
                      <span>{log.recipient_email}</span>
                      <span className="text-xs text-slate-400 font-mono uppercase tracking-tighter">
                        Ref: {log.resend_id ? log.resend_id.split('-').pop() : 'N/A'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-4">
                    <span className="capitalize px-2 py-1 rounded bg-white/10 text-slate-400 text-xs font-semibold">
                      {log.email_type.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-slate-400">
                    {log.subject}
                  </td>
                  <td className="px-4 sm:px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium w-fit ${
                        log.status === 'sent' 
                          ? 'bg-green-50 text-green-700 border border-green-100' 
                          : 'bg-rose-500/10 text-red-700 border border-rose-400/30'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${log.status === 'sent' ? 'bg-green-600' : 'bg-red-600'}`} />
                        {log.status === 'sent' ? 'Delivered' : 'Failed'}
                      </span>
                      
                      {/* FORENSIC ERROR MESSAGE: Only shows if the email failed */}
                      {log.status === 'failed' && log.error_message && (
                        <span className="text-xs text-red-500 font-medium leading-tight max-w-[180px]">
                          Reason: {log.error_message}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-slate-400 tabular-nums">
                    {new Date(log.created_at).toLocaleString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>
      <div className="mt-4 text-xs text-slate-400 flex justify-between">
        <span>Showing last {logs.length} events</span>
        <span>FormaOS Compliance Engine v1.0</span>
      </div>
    </div>
  );
}
