import { createSupabaseServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import {
  Building2,
  Fingerprint,
  CreditCard,
  ShieldCheck,
  UserCircle,
  Globe,
  Lock,
  AlertOctagon,
  Activity, // Upgrade: Icon for status
} from 'lucide-react';

// ✅ Verify this path matches your project structure
import { updateOrganization } from '@/app/app/actions/org';
import { ExpiryAlertWidget } from '@/components/dashboard/expiry-alert-widget';
import { SaveButton } from '@/components/ui/submit-button';
import { AppearanceSettings } from '@/components/settings/appearance-settings';

/**
 * ✅ GOVERNANCE UPDATE ACTION (UPGRADED)
 * Now handles the DB update AND writes to the Audit Trail simultaneously.
 */
async function handleUpdateOrg(formData: FormData) {
  'use server';

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 1. Extract Data
  const orgId = formData.get('orgId') as string;
  const name = formData.get('name') as string;
  const domain = formData.get('domain') as string;
  const registrationNumber = formData.get('registrationNumber') as string;

  if (!user || !orgId) return;

  const { data: membership, error: membershipError } = await supabase
    .from('org_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (membershipError || !membership?.organization_id) return;
  if (membership.organization_id !== orgId) {
    throw new Error('Organization mismatch');
  }

  await updateOrganization({ name, domain, registrationNumber });

  // 3. Refresh UI
  revalidatePath('/app/settings');
  revalidatePath('/app/audit');
}

export default async function SettingsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // 1. Fetch Membership + Joined Org details (Optimized Query)
  const { data: membership } = await supabase
    .from('org_members')
    .select(
      `
      role, 
      organization_id,
      organizations:organization_id (*)
    `,
    )
    .eq('user_id', user.id)
    .maybeSingle();

  // 2. DATA EXTRACTION & TYPE GUARD
  // Handle case where join returns array or object
  // @ts-ignore
  const activeOrganization = Array.isArray(membership?.organizations)
    ? membership.organizations[0]
    : membership?.organizations;

  // 3. HARD ALERT: Configuration Error UI
  if (!membership || !activeOrganization) {
    return (
      <div className="flex items-center justify-center p-12 min-h-[60vh]">
        <div className="max-w-2xl bg-white/5 rounded-[2.5rem] border border-white/10 p-12 shadow-2xl text-center animate-in fade-in zoom-in duration-500">
          <div className="h-20 w-20 bg-rose-500/10 rounded-[1.5rem] flex items-center justify-center mx-auto mb-8 border border-rose-400/30 shadow-inner">
            <ShieldCheck className="h-10 w-10 text-rose-300" />
          </div>
          <h1 className="text-2xl font-black text-slate-100 tracking-tight flex items-center justify-center gap-3">
            Configuration Access Denied
          </h1>
          <p className="text-slate-400 mt-4 text-sm font-medium leading-relaxed max-w-lg mx-auto">
            We could not verify your organization details. This usually
            indicates a <strong>Row-Level Security (RLS)</strong> policy
            restriction or a missing membership record.
          </p>
          <div className="mt-10 pt-8 border-t border-white/10 flex flex-col gap-3">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left ml-1">
              Diagnostic Identity
            </p>
            <code className="text-[10px] font-mono bg-white/10 text-emerald-400 p-4 rounded-xl break-all select-all text-left shadow-lg">
              UID: {user.id}
            </code>
          </div>
        </div>
      </div>
    );
  }

  const isAdmin = membership.role === 'admin' || membership.role === 'owner';

  // ✅ UPGRADE: Fetch "At Risk" documents from the new view
  const { data: atRiskDocs } = await supabase
    .from('at_risk_credentials')
    .select('*')
    .eq('organization_id', activeOrganization.id)
    .limit(3);

  return (
    <div
      className="space-y-10 pb-24 max-w-6xl animate-in fade-in duration-700"
      data-tour="settings-header"
    >
      {/* HEADER SECTION */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-100 tracking-tighter">
            Organization Governance
          </h1>
          <p className="text-slate-400 mt-2 font-medium tracking-tight max-w-xl">
            Manage workspace identity, domain binding, and security
            infrastructure.
          </p>
        </div>
        <div className="hidden md:flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/10 shadow-sm">
          <Activity className="h-4 w-4 text-emerald-500" />
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700">
            System Healthy
          </span>
        </div>
      </header>

      <form action={handleUpdateOrg}>
        {/* CRITICAL FIX: Hidden Input for ID so the server knows WHAT to update */}
        <input type="hidden" name="orgId" value={activeOrganization.id} />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* LEFT COLUMN: Main Workspace Identity */}
          <div className="xl:col-span-2 space-y-8">
            <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-10 shadow-sm space-y-10 relative overflow-hidden">
              <div className="flex items-center gap-6 border-b border-white/10 pb-8">
                <div className="h-20 w-20 rounded-[1.5rem] bg-white/10 text-slate-100 flex items-center justify-center shadow-2xl shadow-black/40">
                  <Building2 className="h-9 w-9" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-100 tracking-tight">
                    {activeOrganization.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <p className="text-[10px] font-black text-emerald-300 uppercase tracking-widest">
                      Node Fully Operational
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">
                    Legal Entity Name
                  </label>
                  <input
                    name="name"
                    defaultValue={activeOrganization.name}
                    disabled={!isAdmin}
                    className="w-full p-5 rounded-2xl border border-white/10 bg-white/10 focus:bg-white/5 focus:outline-white/20 text-sm font-bold transition-all disabled:opacity-60 shadow-inner"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">
                    Registration (ABN/ACN)
                  </label>
                  <input
                    name="registrationNumber"
                    defaultValue={activeOrganization.registration_number || ''}
                    placeholder="e.g. 12 345 678 901"
                    disabled={!isAdmin}
                    className="w-full p-5 rounded-2xl border border-white/10 bg-white/10 focus:bg-white/5 focus:outline-white/20 text-sm font-bold transition-all disabled:opacity-60 shadow-inner"
                  />
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">
                  Authorized Email Domain
                </label>
                <div className="relative group">
                  <Globe className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-slate-100 transition-colors" />
                  <input
                    name="domain"
                    placeholder="company.com"
                    defaultValue={activeOrganization.domain || ''}
                    disabled={!isAdmin}
                    className="w-full pl-14 pr-4 py-5 rounded-2xl border border-white/10 bg-white/10 focus:bg-white/5 focus:outline-white/20 text-sm font-bold transition-all disabled:opacity-60 shadow-inner"
                  />
                </div>
              </div>
            </div>

            {/* Subscription & Billing Tier */}
            <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6 group hover:border-white/10 transition-all duration-500">
              <div className="flex items-center gap-6">
                <div className="h-14 w-14 rounded-2xl bg-purple-500/10 text-purple-300 flex items-center justify-center border border-purple-400/30 shadow-sm group-hover:bg-purple-600 group-hover:text-slate-100 transition-all duration-300">
                  <CreditCard className="h-7 w-7" />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <span className="text-base font-black text-slate-100 tracking-tight">
                      Enterprise Pilot
                    </span>
                    <span className="px-2.5 py-1 bg-emerald-400/10 text-emerald-700 text-[9px] font-black uppercase rounded-full tracking-widest border border-emerald-400/30 shadow-sm">
                      Active
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold mt-1.5 uppercase tracking-widest">
                    Full Evidence Vault & Governance Enabled
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="px-8 py-4 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all active:scale-95 whitespace-nowrap"
              >
                Manage Node
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN: Security Node Sidebar */}
          <div className="space-y-6">
            {/* Identity Card (Black) */}
            <div className="bg-white/10 rounded-[2.5rem] p-10 text-slate-100 space-y-10 shadow-2xl relative overflow-hidden group">
              {/* Background Blur Effect */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-3xl -mr-24 -mt-24 group-hover:bg-white/10 transition-all duration-1000" />

              <div className="flex items-center gap-3 relative z-10">
                <Fingerprint className="h-6 w-6 text-blue-400" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  Security Identity
                </h3>
              </div>

              <div className="space-y-2 relative z-10">
                <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em]">
                  Workspace GUID
                </p>
                <p className="text-xs font-mono text-slate-100 break-all select-all bg-white/10 p-3 rounded-lg border border-white/5">
                  {activeOrganization.id}
                </p>
              </div>

              <div className="pt-6 border-t border-white/10 space-y-4 relative z-10">
                <div className="flex items-start gap-4">
                  <Lock className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-slate-400 leading-relaxed font-bold uppercase tracking-widest">
                    Isolation enforced via Hardware-Level Row Security.
                  </p>
                </div>
              </div>

              {isAdmin && <SaveButton />}
            </div>

            {/* Access Level Indicator */}
            <div className="bg-white/5 border border-white/10 rounded-[2.25rem] p-8 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-5">
                <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center text-slate-400 border border-white/10">
                  <UserCircle className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em]">
                    Authorized As
                  </p>
                  <p className="text-sm font-black text-slate-100 capitalize tracking-tight mt-0.5">
                    {membership.role}
                  </p>
                </div>
              </div>
              <ShieldCheck className="h-6 w-6 text-emerald-500" />
            </div>

            {/* Expiry Widget (Dynamic) */}
            <ExpiryAlertWidget atRiskDocs={atRiskDocs || []} />

            {/* Danger Zone */}
            <div className="bg-rose-500/10 border border-rose-400/30 rounded-[2.25rem] p-8 space-y-6 opacity-70 hover:opacity-100 transition-all">
              <div className="flex items-center gap-3 text-rose-300">
                <AlertOctagon className="h-5 w-5" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">
                  Danger Zone
                </h3>
              </div>
              <p className="text-[10px] text-red-800 leading-relaxed font-bold uppercase tracking-widest">
                Deleting this organization will permanently erase the
                un-editable audit history. This action is irreversible.
              </p>
              <button
                disabled
                className="w-full py-4 bg-white/5 border border-red-200 text-red-400 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] cursor-not-allowed shadow-sm"
              >
                Destroy Node
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Appearance / Theme Settings */}
      <AppearanceSettings />
    </div>
  );
}
