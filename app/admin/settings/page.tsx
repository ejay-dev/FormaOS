export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-100">Admin Settings</h1>
        <p className="mt-2 text-sm text-slate-400">Founder-only configuration notes.</p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-slate-300">
        <div className="text-xs uppercase tracking-[0.3em] text-slate-400">Environment</div>
        <ul className="mt-3 space-y-2">
          <li>Set `FOUNDER_EMAILS` to allow founder access.</li>
          <li>Optionally set `FOUNDER_USER_IDS` for ID-based access.</li>
          <li>Configure `SUPABASE_SERVICE_ROLE_KEY` for cross-org visibility.</li>
        </ul>
      </div>
    </div>
  );
}
