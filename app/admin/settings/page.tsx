import { AlertCircle, CheckCircle, ShieldCheck } from 'lucide-react';
import { requireFounderAccess } from '@/app/app/admin/access';
import {
  listPlatformAdminAssignments,
  listPlatformChangeApprovals,
  type PlatformAdminAssignment,
  type PlatformChangeApproval,
} from '@/lib/admin/governance';
import {
  ALL_PLATFORM_ADMIN_PERMISSIONS,
  PLATFORM_ADMIN_ROLE_PERMISSIONS,
  type PlatformAdminRole,
} from '@/lib/admin/rbac';
import {
  createPlatformApprovalAction,
  reviewPlatformApprovalAction,
  upsertPlatformAdminAssignmentAction,
} from './actions';

const ROLE_OPTIONS: PlatformAdminRole[] = [
  'platform_viewer',
  'platform_support',
  'platform_security',
  'platform_release_manager',
  'platform_operator',
  'platform_super_admin',
];

function titleize(value: string) {
  return value.replace(/_/g, ' ');
}

export default async function AdminSettingsPage() {
  await requireFounderAccess();

  const founderEmails = (process.env.FOUNDER_EMAILS ?? '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
  const founderIds = (process.env.FOUNDER_USER_IDS ?? '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
  const founderConfigured = founderEmails.length > 0 || founderIds.length > 0;
  const [assignments, approvals] = await Promise.all([
    listPlatformAdminAssignments(),
    listPlatformChangeApprovals(),
  ]);
  const pendingApprovals = approvals.filter(
    (approval: PlatformChangeApproval) => approval.status === 'pending',
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-100">Admin Settings</h1>
        <p className="mt-2 text-sm text-slate-400">
          Founder-only governance for delegated access and approval control.
        </p>
      </div>

      <section className="grid gap-4 xl:grid-cols-3">
        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-6">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-emerald-400" />
            <div>
              <p className="text-sm font-medium text-slate-100">
                Founder Access
              </p>
              <p className="text-xs text-slate-500">
                {founderConfigured
                  ? `${founderEmails.length} founder email(s), ${founderIds.length} founder ID(s)`
                  : 'Not configured'}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-6">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-cyan-300" />
            <div>
              <p className="text-sm font-medium text-slate-100">
                Delegated Admins
              </p>
              <p className="text-xs text-slate-500">
                {assignments.filter(
                  (assignment: PlatformAdminAssignment) => assignment.is_active,
                ).length}{' '}
                active assignments
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-amber-400" />
            <div>
              <p className="text-sm font-medium text-slate-100">
                Pending Approvals
              </p>
              <p className="text-xs text-slate-500">
                {pendingApprovals.length} changes awaiting founder review
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-6">
          <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-6">
            <h2 className="mb-4 text-lg font-semibold text-slate-100">
              Grant Or Update Delegated Admin
            </h2>
            <form action={upsertPlatformAdminAssignmentAction} className="space-y-3">
              <input
                name="userId"
                placeholder="Supabase user ID"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                required
              />
              <input
                name="email"
                placeholder="Email (optional)"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
              />
              <select
                name="roleKey"
                defaultValue="platform_support"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
              >
                {ROLE_OPTIONS.map((role) => (
                  <option key={role} value={role}>
                    {titleize(role)}
                  </option>
                ))}
              </select>
              <input
                name="customPermissions"
                placeholder="Optional extra permissions, comma separated"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
              />
              <textarea
                name="reason"
                placeholder="Why this admin needs access"
                className="min-h-28 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                required
              />
              <label className="flex items-center gap-2 text-sm text-slate-400">
                <input type="checkbox" name="isActive" defaultChecked />
                Assignment active
              </label>
              <button className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950">
                Save assignment
              </button>
            </form>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-6">
            <h2 className="mb-4 text-lg font-semibold text-slate-100">
              Create Pre-Approval
            </h2>
            <form action={createPlatformApprovalAction} className="space-y-3">
              <input
                name="requestedForUserId"
                placeholder="Requested for user ID"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                required
              />
              <input
                name="action"
                placeholder="Action slug, e.g. release_updated"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                required
              />
              <input
                name="targetType"
                placeholder="Target type"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                required
              />
              <input
                name="targetId"
                placeholder="Target ID or *"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
              />
              <input
                name="expiresInHours"
                type="number"
                min="1"
                max="168"
                defaultValue="24"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
              />
              <textarea
                name="reason"
                placeholder="Why this approval exists"
                className="min-h-28 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                required
              />
              <button className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950">
                Create approval
              </button>
            </form>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-6">
            <h2 className="mb-4 text-lg font-semibold text-slate-100">
              Active Delegated Admins
            </h2>
            <div className="space-y-4">
              {assignments.map((assignment: PlatformAdminAssignment) => (
                <div
                  key={assignment.id}
                  className="rounded-lg border border-slate-800/70 bg-slate-950/70 p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-100">
                        {assignment.email ?? assignment.user_id}
                      </p>
                      <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">
                        {titleize(assignment.role_key)}
                      </p>
                      <p className="mt-2 text-xs text-slate-500">
                        {assignment.reason}
                      </p>
                    </div>
                    <form action={upsertPlatformAdminAssignmentAction} className="space-y-2">
                      <input type="hidden" name="userId" value={assignment.user_id} />
                      <input type="hidden" name="email" value={assignment.email ?? ''} />
                      <input type="hidden" name="roleKey" value={assignment.role_key} />
                      <input type="hidden" name="reason" value={`Deactivate delegated access for ${assignment.user_id}`} />
                      <input type="hidden" name="isActive" value="false" />
                      <button className="rounded-lg border border-rose-400/40 px-3 py-1.5 text-xs font-semibold text-rose-200">
                        Deactivate
                      </button>
                    </form>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-400">
                    {assignment.permissions.map((permission: string) => (
                      <span
                        key={permission}
                        className="rounded-full border border-slate-700 px-2 py-1"
                      >
                        {permission}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
              {assignments.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No delegated admins configured yet.
                </p>
              ) : null}
            </div>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-6">
            <h2 className="mb-4 text-lg font-semibold text-slate-100">
              Approval Queue
            </h2>
            <div className="space-y-4">
              {approvals.map((approval: PlatformChangeApproval) => (
                <div
                  key={approval.id}
                  className="rounded-lg border border-slate-800/70 bg-slate-950/70 p-4"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-100">
                        {approval.action} · {approval.target_type}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        for {approval.requested_for_user_id}
                        {approval.target_id ? ` · target ${approval.target_id}` : ''}
                      </p>
                      <p className="mt-2 text-xs text-slate-400">
                        {approval.reason}
                      </p>
                    </div>
                    <span className="rounded-full border border-slate-700 px-2 py-1 text-[11px] uppercase tracking-wide text-slate-300">
                      {approval.status}
                    </span>
                  </div>
                  {approval.status === 'pending' ? (
                    <div className="mt-3 flex gap-2">
                      <form action={reviewPlatformApprovalAction}>
                        <input type="hidden" name="approvalId" value={approval.id} />
                        <input type="hidden" name="status" value="approved" />
                        <button className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-slate-950">
                          Approve
                        </button>
                      </form>
                      <form action={reviewPlatformApprovalAction}>
                        <input type="hidden" name="approvalId" value={approval.id} />
                        <input type="hidden" name="status" value="rejected" />
                        <button className="rounded-lg border border-rose-400/40 px-3 py-1.5 text-xs font-semibold text-rose-200">
                          Reject
                        </button>
                      </form>
                    </div>
                  ) : null}
                </div>
              ))}
              {approvals.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No approval records yet.
                </p>
              ) : null}
            </div>
          </div>

          <div className="rounded-lg border border-amber-800/30 bg-amber-900/10 p-6">
            <h3 className="mb-3 text-sm font-semibold text-amber-200">
              Guardrails
            </h3>
            <div className="space-y-2 text-xs text-amber-100/80">
              <p>
                Founder access is still controlled by server-side{' '}
                <code className="rounded bg-slate-900 px-1.5 py-0.5">
                  FOUNDER_EMAILS
                </code>{' '}
                and{' '}
                <code className="rounded bg-slate-900 px-1.5 py-0.5">
                  FOUNDER_USER_IDS
                </code>
                .
              </p>
              <p>
                Delegated admins inherit role defaults plus any explicitly added
                permissions.
              </p>
              <p>
                High-risk mutations now require both a reason and, for delegated
                admins, a matching approval record.
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-6">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-300">
              Role Baselines
            </h3>
            <div className="space-y-3 text-xs text-slate-400">
              {ROLE_OPTIONS.map((role) => (
                <div key={role} className="rounded-lg border border-slate-800/70 p-3">
                  <p className="font-medium text-slate-100">{titleize(role)}</p>
                  <p className="mt-2">
                    {(PLATFORM_ADMIN_ROLE_PERMISSIONS[role] ?? []).join(', ') ||
                      ALL_PLATFORM_ADMIN_PERMISSIONS.join(', ')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
