import { redirect } from 'next/navigation';
import Link from 'next/link';
import { fetchSystemState } from '@/lib/system-state/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { resolveActiveMembership } from '@/lib/auth/membership-cache';
import {
  RecordCard,
  RecordList,
  EmptyRecordState,
} from '@/components/mobile/record-card';
import {
  DollarSign,
  FileCheck,
  Clock,
  XCircle,
  Download,
  RefreshCw,
  CheckCircle2,
  Send,
} from 'lucide-react';
import {
  markDraftsReady,
  markSubmitted,
  markPaid,
  rejectClaim,
} from './actions';

const NOTICE_MESSAGES: Record<string, string> = {
  marked_ready: 'Validated drafts and moved the eligible ones to Ready.',
  submitted: 'Claim marked as submitted.',
  paid: 'Claim marked as paid.',
  rejected: 'Claim marked as rejected.',
};

const ERROR_MESSAGES: Record<string, string> = {
  no_claims: 'No ready claim items are available to export yet.',
  no_drafts: 'There are no draft items to validate.',
  validation_failed:
    'Export blocked: one or more ready items failed validation. Fix them before exporting.',
  forbidden: 'Only an owner or admin can mark claims paid or rejected.',
  payment_ref_required: 'A payment reference is required to mark a claim paid.',
  reason_required: 'A rejection reason is required.',
  active_org: 'Select an active organisation before claiming.',
  membership: 'No organisation membership found.',
  bad_request: 'That action could not be completed.',
  update_failed: 'The claim could not be updated. Please try again.',
};

export const metadata = { title: 'NDIS Claiming | FormaOS' };

export default async function NdisClaimingPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const state = await fetchSystemState();
  if (!state) redirect('/auth/signin');

  const membership = await resolveActiveMembership();
  const role = membership.kind === 'ok' ? membership.role : null;
  const isManager = role === 'owner' || role === 'admin';

  const db = await createSupabaseServerClient();

  // Get summary stats
  const now = new Date();
  const _periodStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    1,
  ).toISOString();
  const _periodEnd = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
    23,
    59,
    59,
  ).toISOString();

  const { data: lineItems } = await db
    .from('org_ndis_line_items')
    .select('*, org_patients(full_name)')
    .eq('org_id', state.organization.id)
    .order('created_at', { ascending: false })
    .limit(100);

  const items = lineItems ?? [];
  const totalDraft = items
    .filter((i) => i.status === 'draft')
    .reduce((s, i) => s + Number(i.total_amount), 0);
  const totalReady = items
    .filter((i) => i.status === 'ready')
    .reduce((s, i) => s + Number(i.total_amount), 0);
  const totalSubmitted = items
    .filter((i) => i.status === 'submitted')
    .reduce((s, i) => s + Number(i.total_amount), 0);
  const totalPaid = items
    .filter((i) => i.status === 'paid')
    .reduce((s, i) => s + Number(i.total_amount), 0);
  const totalRejected = items
    .filter((i) => i.status === 'rejected')
    .reduce((s, i) => s + Number(i.total_amount), 0);

  const generatedCount = Number(resolvedSearchParams.generated ?? 0);
  const failedCount = Number(resolvedSearchParams.failed ?? 0);
  const errorCode =
    typeof resolvedSearchParams.error === 'string'
      ? resolvedSearchParams.error
      : null;
  const noticeCode =
    typeof resolvedSearchParams.notice === 'string'
      ? resolvedSearchParams.notice
      : null;
  const noticeInvalid = Number(resolvedSearchParams.invalid ?? 0);
  const exportInvalid =
    errorCode === 'validation_failed'
      ? Number(resolvedSearchParams.invalid ?? 0)
      : 0;
  const hasDrafts = items.some((i) => i.status === 'draft');

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    ready: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    submitted:
      'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
    paid: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    rejected: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      {(generatedCount > 0 || failedCount > 0) && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
          Generated {generatedCount} claim item{generatedCount === 1 ? '' : 's'}
          {failedCount > 0 ? `, ${failedCount} failed` : ''}.
        </div>
      )}

      {noticeCode && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
          {NOTICE_MESSAGES[noticeCode] ?? 'Done.'}
          {noticeCode === 'marked_ready' && noticeInvalid > 0
            ? ` ${noticeInvalid} item${noticeInvalid === 1 ? '' : 's'} failed validation and stayed in Draft.`
            : ''}
        </div>
      )}

      {errorCode && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-700 dark:text-rose-300">
          {ERROR_MESSAGES[errorCode] ??
            'The NDIS claiming action could not be completed. Please try again.'}
          {errorCode === 'validation_failed' && exportInvalid > 0
            ? ` (${exportInvalid} item${exportInvalid === 1 ? '' : 's'})`
            : ''}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">NDIS Claiming</h1>
          <p className="text-sm text-muted-foreground">
            Generate claims from completed visits, validate, and export for the
            NDIS portal.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <form action="/api/ndis-claiming/generate" method="POST">
            <button className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted">
              <RefreshCw className="h-4 w-4" /> Generate from Visits
            </button>
          </form>
          {hasDrafts && (
            <form action={markDraftsReady}>
              <button className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted">
                <CheckCircle2 className="h-4 w-4" /> Validate &amp; Mark Ready
              </button>
            </form>
          )}
          <Link
            href="/api/ndis-claiming/export"
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:bg-primary/90"
          >
            <Download className="h-4 w-4" /> Export Ready Claims
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        <SummaryCard
          icon={Clock}
          label="Draft"
          amount={totalDraft}
          color="text-gray-500"
        />
        <SummaryCard
          icon={FileCheck}
          label="Ready"
          amount={totalReady}
          color="text-blue-500"
        />
        <SummaryCard
          icon={DollarSign}
          label="Submitted"
          amount={totalSubmitted}
          color="text-yellow-500"
        />
        <SummaryCard
          icon={DollarSign}
          label="Paid"
          amount={totalPaid}
          color="text-green-500"
        />
        <SummaryCard
          icon={XCircle}
          label="Rejected"
          amount={totalRejected}
          color="text-red-500"
        />
      </div>

      {/* Line Items — mobile card list (md:hidden) */}
      <section className="md:hidden space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Line items
        </h2>
        {items.length === 0 ? (
          <EmptyRecordState
            title="No line items yet"
            description="Generate claims from completed visits to populate this list."
          />
        ) : (
          <RecordList>
            {items.map((item) => {
              const patient = item.org_patients;
              const patientName = patient?.full_name ?? '—';
              return (
                <RecordCard
                  key={item.id}
                  title={patientName}
                  subtitle={
                    <span className="truncate">
                      {item.support_item_name}
                    </span>
                  }
                  status={
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${statusColors[item.status]}`}
                    >
                      {item.status}
                    </span>
                  }
                  meta={[
                    {
                      label: 'Total',
                      value: `$${Number(item.total_amount).toFixed(2)}`,
                    },
                    { label: 'Qty', value: String(item.quantity) },
                    {
                      label: 'Rate',
                      value: `$${Number(item.unit_price).toFixed(2)}`,
                    },
                    {
                      label: 'Date',
                      value: new Date(item.created_at).toLocaleDateString(),
                    },
                  ]}
                  actions={<RowActions item={item} isManager={isManager} />}
                />
              );
            })}
          </RecordList>
        )}
      </section>

      {/* Line Items Table — desktop only */}
      <div className="hidden md:block rounded-lg border border-border bg-card overflow-hidden">
        <div className="border-b border-border px-4 py-3">
          <h2 className="font-semibold">Line Items</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                  Participant
                </th>
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                  Support Item
                </th>
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                  Category
                </th>
                <th className="px-4 py-2 text-right font-medium text-muted-foreground">
                  Qty
                </th>
                <th className="px-4 py-2 text-right font-medium text-muted-foreground">
                  Unit Price
                </th>
                <th className="px-4 py-2 text-right font-medium text-muted-foreground">
                  Total
                </th>
                <th className="px-4 py-2 text-center font-medium text-muted-foreground">
                  Status
                </th>
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                  Date
                </th>
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((item) => {
                const patient = item.org_patients;
                return (
                  <tr key={item.id} className="hover:bg-muted/30">
                    <td className="px-4 py-2.5 font-medium">
                      {patient?.full_name ?? '—'}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="truncate max-w-[200px]">
                        {item.support_item_name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {item.support_item_number}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 capitalize text-muted-foreground">
                      {item.support_category.replace(/_/g, ' ')}
                    </td>
                    <td className="px-4 py-2.5 text-right">{item.quantity}</td>
                    <td className="px-4 py-2.5 text-right">
                      ${Number(item.unit_price).toFixed(2)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-medium">
                      ${Number(item.total_amount).toFixed(2)}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[item.status]}`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">
                      {new Date(item.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2.5">
                      <RowActions item={item} isManager={isManager} />
                    </td>
                  </tr>
                );
              })}
              {items.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-12 text-center text-muted-foreground"
                  >
                    No line items yet. Generate claims from completed visits.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function RowActions({
  item,
  isManager,
}: {
  item: {
    id: string;
    status: string;
    payment_reference?: string | null;
    rejection_reason?: string | null;
  };
  isManager: boolean;
}) {
  switch (item.status) {
    case 'ready':
      return (
        <form action={markSubmitted}>
          <input type="hidden" name="id" value={item.id} />
          <button className="inline-flex items-center gap-1 rounded border border-border px-2 py-1 text-xs hover:bg-muted">
            <Send className="h-3 w-3" /> Mark Submitted
          </button>
        </form>
      );
    case 'submitted':
      if (!isManager) {
        return (
          <span className="text-xs text-muted-foreground">
            Awaiting owner/admin
          </span>
        );
      }
      return (
        <div className="flex flex-col gap-1.5">
          <form action={markPaid} className="flex items-center gap-1">
            <input type="hidden" name="id" value={item.id} />
            <input
              name="payment_reference"
              required
              placeholder="Payment ref"
              aria-label="Payment reference"
              className="w-28 rounded border border-border bg-background px-2 py-1 text-xs"
            />
            <button className="rounded bg-green-600 px-2 py-1 text-xs font-medium text-white hover:bg-green-700">
              Paid
            </button>
          </form>
          <form action={rejectClaim} className="flex items-center gap-1">
            <input type="hidden" name="id" value={item.id} />
            <input
              name="rejection_reason"
              required
              placeholder="Reason"
              aria-label="Rejection reason"
              className="w-28 rounded border border-border bg-background px-2 py-1 text-xs"
            />
            <button className="rounded border border-rose-400 px-2 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950">
              Reject
            </button>
          </form>
        </div>
      );
    case 'paid':
      return (
        <span className="text-xs text-muted-foreground">
          Ref: {item.payment_reference ?? '—'}
        </span>
      );
    case 'rejected':
      return (
        <span
          className="text-xs text-rose-600"
          title={item.rejection_reason ?? undefined}
        >
          {item.rejection_reason
            ? `Rejected: ${item.rejection_reason}`
            : 'Rejected'}
        </span>
      );
    case 'draft':
    default:
      return (
        <span className="text-xs text-muted-foreground">
          Validate &amp; Mark Ready
        </span>
      );
  }
}

function SummaryCard({
  icon: Icon,
  label,
  amount,
  color,
}: {
  icon: typeof DollarSign;
  label: string;
  amount: number;
  color: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <Icon className={`h-5 w-5 ${color}`} />
      <p className="mt-2 text-xl font-semibold">${amount.toFixed(2)}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
