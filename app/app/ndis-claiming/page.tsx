import { redirect } from 'next/navigation';
import { fetchSystemState } from '@/lib/system-state/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import {
  DollarSign,
  FileCheck,
  Clock,
  XCircle,
  Download,
  RefreshCw,
} from 'lucide-react';

export const metadata = { title: 'NDIS Claiming | FormaOS' };

export default async function NdisClaimingPage() {
  const state = await fetchSystemState();
  if (!state) redirect('/signin');

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
    .select('*, org_patients(first_name, last_name)')
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">NDIS Claiming</h1>
          <p className="text-sm text-muted-foreground">
            Generate claims from completed visits, validate, and export for the
            NDIS portal.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted">
            <RefreshCw className="h-4 w-4" /> Generate from Visits
          </button>
          <button className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:bg-primary/90">
            <Download className="h-4 w-4" /> Export Claim File
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-5">
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

      {/* Line Items Table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
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
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((item) => {
                const patient = item.org_patients;
                return (
                  <tr key={item.id} className="hover:bg-muted/30">
                    <td className="px-4 py-2.5 font-medium">
                      {patient
                        ? `${patient.first_name} ${patient.last_name}`
                        : '—'}
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
                  </tr>
                );
              })}
              {items.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
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
