import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { MFAEnrollment } from '@/components/settings/mfa-enrollment';
import { roleRequiresMFA } from '@/lib/security/mfa-enforcement';
import { ShieldCheck } from 'lucide-react';

export default async function SecuritySettingsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: membership } = await supabase
    .from('org_members')
    .select('role, mfa_required')
    .eq('user_id', user.id)
    .maybeSingle();

  const { data: security } = await supabase
    .from('user_security')
    .select('two_factor_enabled')
    .eq('user_id', user.id)
    .maybeSingle();

  const required =
    membership?.mfa_required ??
    roleRequiresMFA(membership?.role ?? null);
  const enabled = security?.two_factor_enabled ?? false;

  return (
    <div className="space-y-8 pb-24 max-w-5xl animate-in fade-in duration-700">
      <header className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-300 flex items-center justify-center">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-100 tracking-tight">
              Security Controls
            </h1>
            <p className="text-sm text-slate-400">
              Configure enterprise authentication and access protections.
            </p>
          </div>
        </div>
        <Link
          href="/app/settings"
          className="text-xs font-semibold text-slate-400 hover:text-slate-200"
        >
          ← Back to Settings
        </Link>
      </header>

      <MFAEnrollment initialEnabled={enabled} required={Boolean(required)} />
    </div>
  );
}
