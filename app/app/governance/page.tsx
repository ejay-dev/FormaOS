import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createGovernanceExportAction } from './actions';
import { generateExportToken } from '@/lib/security/export-tokens';
import { FileDown, Package, CalendarDays, ShieldCheck, Clock } from 'lucide-react';

export const dynamic = 'force-dynamic';

type JobRow = {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number | null;
  created_at: string;
  completed_at: string | null;
  file_size: number | null;
  error_message: string | null;
  options: any;
};

function fmtBytes(bytes: number | null) {
  if (!bytes || bytes <= 0) return 'N/A';
  const units = ['B', 'KB', 'MB', 'GB'];
  let v = bytes;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i += 1;
  }
  return `${Math.round(v * 10) / 10} ${units[i]}`;
}

export default async function GovernancePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: membership } = await supabase
    .from('org_members')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .maybeSingle();

  const orgId = (membership as any)?.organization_id as string | undefined;
  const role = (membership as any)?.role as string | undefined;

  if (!orgId || !role) return null;

  const isAdmin = role === 'owner' || role === 'admin';
  if (!isAdmin) {
    return (
      <div className="space-y-4 pb-24">
        <h1 className="text-3xl font-black text-slate-100 tracking-tight">
          Governance Packs
        </h1>
        <p className="text-sm text-slate-400">
          Admin access is required to generate enterprise governance exports.
        </p>
        <Link href="/app" className="text-sm text-cyan-300 hover:underline">
          ← Back to app
        </Link>
      </div>
    );
  }

  const { data: jobs } = await supabase
    .from('enterprise_export_jobs')
    .select('id, status, progress, created_at, completed_at, file_size, error_message, options')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })
    .limit(20);

  const rows = (jobs ?? []) as JobRow[];

  async function createAction(kind: 'proof_packet_14d' | 'monthly_exec_pack' | 'audit_ready_bundle') {
    'use server';
    await createGovernanceExportAction(kind);
  }

  return (
    <div className="space-y-8 pb-24 animate-in fade-in duration-500">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-black text-slate-100 tracking-tight">
          Governance Packs
        </h1>
        <p className="text-sm text-slate-400">
          Packaged, audit-ready exports for enterprise procurement, board reporting,
          and auditor review. Exports are access-controlled and traceable.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-3">
        <form action={createAction.bind(null, 'proof_packet_14d')}>
          <button
            type="submit"
            className="w-full rounded-2xl border border-white/10 bg-white/5 p-6 text-left hover:bg-white/8 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Package className="h-5 w-5 text-cyan-300" />
              <div className="text-sm font-bold text-slate-100">14-Day Proof Packet</div>
            </div>
            <p className="mt-2 text-xs text-slate-400">
              Generate a 14-day procurement proof bundle (ZIP) including a trust
              packet PDF and time-scoped audit signals.
            </p>
          </button>
        </form>

        <form action={createAction.bind(null, 'monthly_exec_pack')}>
          <button
            type="submit"
            className="w-full rounded-2xl border border-white/10 bg-white/5 p-6 text-left hover:bg-white/8 transition-colors"
          >
            <div className="flex items-center gap-3">
              <CalendarDays className="h-5 w-5 text-emerald-300" />
              <div className="text-sm font-bold text-slate-100">Monthly Executive Pack</div>
            </div>
            <p className="mt-2 text-xs text-slate-400">
              Monthly export bundle (ZIP) designed for governance cadence and board
              updates.
            </p>
          </button>
        </form>

        <form action={createAction.bind(null, 'audit_ready_bundle')}>
          <button
            type="submit"
            className="w-full rounded-2xl border border-white/10 bg-white/5 p-6 text-left hover:bg-white/8 transition-colors"
          >
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-amber-300" />
              <div className="text-sm font-bold text-slate-100">Audit-Ready Bundle</div>
            </div>
            <p className="mt-2 text-xs text-slate-400">
              Full audit-ready export bundle (ZIP) for auditor handover.
            </p>
          </button>
        </form>
      </div>

      <section className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
        <div className="flex items-center gap-2 border-b border-white/10 px-6 py-4">
          <Clock className="h-4 w-4 text-slate-300" />
          <h2 className="text-sm font-semibold text-slate-100">Recent Exports</h2>
        </div>

        {rows.length === 0 ? (
          <div className="px-6 py-6 text-sm text-slate-400">No exports yet.</div>
        ) : (
          <div className="divide-y divide-white/10">
            {rows.map((j) => {
              const bundleType = j.options?.bundleType ?? 'enterprise_full';
              const token = generateExportToken(j.id, orgId, 1);
              const downloadHref = `/api/exports/enterprise/${j.id}?token=${encodeURIComponent(token)}`;
              const done = j.status === 'completed';
              return (
                <div key={j.id} className="flex flex-col gap-2 px-6 py-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="text-sm font-semibold text-slate-100">
                      {bundleType}
                    </div>
                    <div className="mt-1 text-xs text-slate-400">
                      Created: {new Date(j.created_at).toLocaleString()}
                      {j.completed_at ? ` · Completed: ${new Date(j.completed_at).toLocaleString()}` : ''}
                      {j.file_size ? ` · Size: ${fmtBytes(j.file_size)}` : ''}
                    </div>
                    {j.status === 'failed' && j.error_message ? (
                      <div className="mt-1 text-xs text-rose-300">
                        Error: {j.error_message}
                      </div>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-xs text-slate-400">
                      {j.status}
                      {typeof j.progress === 'number' ? ` · ${j.progress}%` : ''}
                    </div>
                    <a
                      href={downloadHref}
                      className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold border ${
                        done
                          ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/15'
                          : 'pointer-events-none border-white/10 bg-white/5 text-slate-500'
                      }`}
                      aria-disabled={!done}
                    >
                      <FileDown className="h-4 w-4" />
                      Download
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <div className="text-xs text-slate-500">
        Note: Downloads require an active session and admin access. The download
        link is signed and short-lived.
      </div>
    </div>
  );
}
