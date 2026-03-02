import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fetchSystemState } from "@/lib/system-state/server";
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
  client: { id: string; full_name: string } | null;
  staff: { id: string; email: string | null } | null;
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
      client:client_id(id, full_name),
      staff:staff_id(id, email)
    `,
    )
    .eq("organization_id", orgId)
    .eq("id", visitId)
    .maybeSingle();

  const visit = visitData as VisitRow | null;
  if (!visit) notFound();
  const resolvedVisitId = visit.id;

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

  async function cancelAction() {
    "use server";
    await updateVisitStatus(resolvedVisitId, "cancelled");
  }

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
        <h1 className="text-3xl font-black tracking-tight">Visit Detail</h1>
        <p className="text-sm text-muted-foreground">
          Operational details, timeline, and status controls.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Status</p>
          <p className="mt-1 text-2xl font-black capitalize">{visit.status.replace("_", " ")}</p>
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
              <dd>{visit.staff?.email || "Unassigned"}</dd>
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
          <div className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm">
            <div className="font-semibold text-emerald-200">Outcome</div>
            <div className="mt-1 text-emerald-100">{visit.outcomes}</div>
          </div>
        ) : null}
        {visit.cancellation_reason ? (
          <div className="mt-4 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm">
            <div className="font-semibold text-rose-200">Cancellation Reason</div>
            <div className="mt-1 text-rose-100">{visit.cancellation_reason}</div>
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
              className="inline-flex items-center gap-2 rounded-lg border border-blue-500/40 bg-blue-500/10 px-3 py-2 text-sm text-blue-100 disabled:opacity-40"
            >
              <PlayCircle className="h-4 w-4" />
              Start Visit
            </button>
          </form>
          <form action={completeAction}>
            <button
              type="submit"
              disabled={!canComplete}
              className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100 disabled:opacity-40"
            >
              <CheckCircle2 className="h-4 w-4" />
              Mark Completed
            </button>
          </form>
          <form action={cancelAction}>
            <button
              type="submit"
              disabled={!canCancel}
              className="inline-flex items-center gap-2 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-100 disabled:opacity-40"
            >
              <XCircle className="h-4 w-4" />
              Cancel Visit
            </button>
          </form>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Current status transitions: scheduled → in progress → completed.
        </p>
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
