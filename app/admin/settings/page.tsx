import { CheckCircle, AlertCircle } from "lucide-react";

export default function AdminSettingsPage() {
  const founderEmails = (process.env.FOUNDER_EMAILS ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
  const founderIds = (process.env.FOUNDER_USER_IDS ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
  const founderConfigured = founderEmails.length > 0 || founderIds.length > 0;
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-100">Admin Settings</h1>
        <p className="mt-2 text-sm text-slate-400">
          Platform configuration and access controls
        </p>
      </div>

      {/* Current Configuration */}
      <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-6">
        <h2 className="text-lg font-semibold text-slate-100 mb-4">
          Current Configuration
        </h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg border border-slate-800/50 bg-slate-800/20">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-emerald-400" />
              <div>
                <p className="text-sm font-medium text-slate-100">Founder Access</p>
                <p className="text-xs text-slate-500">
                  {founderConfigured
                    ? `${founderEmails.length} founder email(s), ${founderIds.length} founder ID(s)`
                    : "Not configured"}
                </p>
              </div>
            </div>
            <span
              className={`text-xs px-2 py-1 rounded ${
                founderConfigured
                  ? "bg-emerald-500/10 text-emerald-300"
                  : "bg-amber-500/10 text-amber-300"
              }`}
            >
              {founderConfigured ? "Active" : "Action Required"}
            </span>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border border-slate-800/50 bg-slate-800/20">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-emerald-400" />
              <div>
                <p className="text-sm font-medium text-slate-100">OAuth Provider</p>
                <p className="text-xs text-slate-500">Google via Supabase</p>
              </div>
            </div>
            <span className="text-xs bg-emerald-500/10 text-emerald-300 px-2 py-1 rounded">
              Configured
            </span>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border border-slate-800/50 bg-slate-800/20">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-emerald-400" />
              <div>
                <p className="text-sm font-medium text-slate-100">
                  Service Role Key
                </p>
                <p className="text-xs text-slate-500">Cross-org visibility enabled</p>
              </div>
            </div>
            <span className="text-xs bg-emerald-500/10 text-emerald-300 px-2 py-1 rounded">
              Active
            </span>
          </div>
        </div>
      </div>

      {/* Environment Variables */}
      <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-6">
        <h2 className="text-lg font-semibold text-slate-100 mb-4">
          Environment Variables
        </h2>
        <div className="space-y-3 text-sm">
          <div className="p-4 rounded-lg border border-slate-800/50 bg-slate-800/20 font-mono text-xs">
            <p className="text-slate-400">
              FOUNDER_EMAILS / FOUNDER_USER_IDS are server-side only and intentionally redacted in UI.
            </p>
          </div>
          <p className="text-slate-500">
            Founder access is controlled by server-side <code className="bg-slate-800 px-1.5 py-0.5 rounded text-xs">FOUNDER_EMAILS</code> and <code className="bg-slate-800 px-1.5 py-0.5 rounded text-xs">FOUNDER_USER_IDS</code>.
          </p>
        </div>
      </div>

      {/* Access Control */}
      <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-6">
        <h2 className="text-lg font-semibold text-slate-100 mb-4">
          Access Control
        </h2>
        <div className="space-y-3 text-sm text-slate-400">
          <p>
            • Admin console routes are guarded by
            <code className="bg-slate-800 px-2 py-1 rounded text-xs ml-1">
              requireFounderAccess()
            </code>
          </p>
          <p>
            • All admin API endpoints verify founder status before responding
          </p>
          <p>
            • Unauthorized access attempts are logged in audit trail
          </p>
          <p>
            • Session is managed via Supabase OAuth provider
          </p>
        </div>
      </div>

      {/* Security Notes */}
      <div className="rounded-lg border border-amber-800/30 bg-amber-900/10 p-6">
        <div className="flex gap-4">
          <AlertCircle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-amber-200 mb-2">
              Security Reminders
            </h3>
            <ul className="space-y-1 text-xs text-amber-100/80">
              <li>• Never share founder credentials</li>
              <li>• Admin actions are fully audited</li>
              <li>• Session tokens expire for security</li>
              <li>• Use VPN for production admin access</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
