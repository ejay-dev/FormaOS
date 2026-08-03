import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fetchSystemState } from "@/lib/system-state/server";
import { getOrgMemberIdentities } from "@/lib/team/member-identity";
import { updateVisitStatus } from "@/app/app/actions/care-operations";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  Clock,
  MapPin,
  PlayCircle,
  XCircle,
} from "lucide-react";

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "N/A";
  try {
    return new Date(value).toLocaleString("en-AU", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "N/A";
  }
}

type VisitRow = {
  id: string;
  visit_type: string | null;
  service_category: string | null;
  scheduled_start: string | null;
  scheduled_end: string | null;
  actual_start: string | null;
  actual_end: string | null;
  status: string;
  location_type: string | null;
  address: string | null;
  notes: string | null;
  outcomes: string | null;
  cancellation_reason: string | null;
  billable: boolean | null;
  funding_source: string | null;
  created_at: string;
  staff_id: string | null;
  client: { id: string; full_name: string } | null;
};

export default async function VisitDetailPage({
  params,
}: {
  params?: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const visitId = resolvedParams?.id ?? "";
  if (!visitId) redirect("/app/visits");

  const systemState = await fetchSystemState();
  if (!systemState) redirect("/auth/signin");
  const orgId = systemState.organization.id;

  const supabase = await createSupabaseServerClient();
  const { data: visitData } = await supabase
    .from("org_visits")
    .select(
      `
      id,
      visit_type,
      service_category,
      scheduled_start,
      scheduled_end,
      actual_start,
      actual_end,
      status,
      location_type,
      address,
      notes,
      outcomes,
      cancellation_reason,
      billable,
      funding_source,
      created_at,
      staff_id,
      client:client_id(id, full_name)
    `,
    )
    .eq("organization_id", orgId)
    .eq("id", visitId)
    .maybeSingle();

  const visit = visitData as VisitRow | null;
  if (!visit) notFound();
  const resolvedVisitId = visit.id;

  const identities = await getOrgMemberIdentities();
  const staffName = visit.staff_id
    ? (identities[visit.staff_id]?.name ?? 'Unknown member')
    : 'Unassigned';

  const canStart = visit.status === "scheduled";
  const canComplete = visit.status === "in_progress";
  const canCancel = visit.status === "scheduled" || visit.status === "in_progress";

  async function startAction() {
    "use server";
    await updateVisitStatus(resolvedVisitId, "in_progress");
  }

  async function completeAction() {
    "use server";
    await updateVisitStatus(resolvedVisitId, "completed");
  }

  async function cancelAction(formData: FormData) {
    "use server";
    const reason = String(formData.get("cancellation_reason") ?? "").trim();
    if (!reason) return;
    await updateVisitStatus(resolvedVisitId, "cancelled", reason);
  }

  const clientName = visit.client?.full_name || "Unassigned client";
  const visitWhen = visit.scheduled_start
    ? formatDateTime(visit.scheduled_start)
    : "Unscheduled";

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Link
          href="/app/visits"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to visits
        </Link>
        <h1 className="page-title">
          {clientName} · {visitWhen}
        </h1>
        <p className="text-sm text-muted-foreground capitalize">
          {(visit.visit_type || "service").replace("_", " ")} visit
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Status</p>
          <p className="mt-1 text-2xl font-semibold capitalize">{visit.status.replace("_", " ")}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Client</p>
          <p className="mt-1 text-lg font-semibold">{visit.client?.full_name || "Unassigned"}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Type</p>
          <p className="mt-1 text-lg font-semibold capitalize">
            {(visit.visit_type || "service").replace("_", " ")}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Funding</p>
          <p className="mt-1 text-lg font-semibold capitalize">{visit.funding_source || "N/A"}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            <CalendarClock className="h-4 w-4" />
            Timeline
          </h2>
          <dl className="mt-4 grid gap-3 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Scheduled Start</dt>
              <dd>{formatDateTime(visit.scheduled_start)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Scheduled End</dt>
              <dd>{formatDateTime(visit.scheduled_end)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Actual Start</dt>
              <dd>{formatDateTime(visit.actual_start)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Actual End</dt>
              <dd>{formatDateTime(visit.actual_end)}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            <MapPin className="h-4 w-4" />
            Assignment
          </h2>
          <dl className="mt-4 grid gap-3 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Staff</dt>
              <dd>{staffName}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Service Category</dt>
              <dd className="capitalize">{(visit.service_category || "N/A").replace("_", " ")}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Location Type</dt>
              <dd className="capitalize">{(visit.location_type || "N/A").replace("_", " ")}</dd>
            </div>
            <div className="text-xs text-muted-foreground">
              {visit.address || "No address provided"}
            </div>
          </dl>
        </section>
      </div>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Visit Notes
        </h2>
        <p className="mt-3 whitespace-pre-wrap text-sm">{visit.notes || "No notes provided."}</p>
        {visit.outcomes ? (
          <div className="mt-4 rounded-lg border border-success/30 bg-success/10 p-3 text-sm">
            <div className="font-semibold text-success">Outcome</div>
            <div className="mt-1 text-foreground">{visit.outcomes}</div>
          </div>
        ) : null}
        {visit.cancellation_reason ? (
          <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm">
            <div className="font-semibold text-destructive">Cancellation reason</div>
            <div className="mt-1 text-foreground">{visit.cancellation_reason}</div>
          </div>
        ) : null}
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Status Actions
        </h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <form action={startAction}>
            <button
              type="submit"
              disabled={!canStart}
              className="inline-flex min-h-[44px] md:min-h-0 items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground hover:bg-muted disabled:opacity-40"
            >
              <PlayCircle className="h-4 w-4" />
              Start visit
            </button>
          </form>
          <form action={completeAction}>
            <button
              type="submit"
              disabled={!canComplete}
              className="inline-flex min-h-[44px] md:min-h-0 items-center gap-2 rounded-lg border border-success/40 bg-success/10 px-3 py-2 text-sm text-success hover:bg-success/15 disabled:opacity-40"
            >
              <CheckCircle2 className="h-4 w-4" />
              Mark completed
            </button>
          </form>
        </div>

        {canCancel ? (
          <details className="mt-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
            <summary className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-destructive">
              <XCircle className="h-4 w-4" />
              Cancel visit
            </summary>
            <form action={cancelAction} className="mt-3 space-y-2">
              <label
                htmlFor="visit-cancellation-reason"
                className="block text-xs font-medium text-muted-foreground"
              >
                Why is this visit not going ahead? Short-notice cancellations
                are billable under NDIS price limits, so record the reason
                before cancelling.
              </label>
              <textarea
                id="visit-cancellation-reason"
                name="cancellation_reason"
                rows={3}
                required
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
                placeholder="e.g. Participant unwell, called 7am to cancel"
              />
              <button
                type="submit"
                className="inline-flex min-h-[44px] md:min-h-0 items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/15"
              >
                Cancel visit and save reason
              </button>
            </form>
          </details>
        ) : null}
      </section>

      <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
        <div className="inline-flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Record created {formatDateTime(visit.created_at)}
        </div>
      </div>
    </div>
  );
}
