import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Archive, Pencil, Trash2 } from "lucide-react";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fetchSystemState } from "@/lib/system-state/server";
import {
  deleteBehaviourSupportPlan,
  updateBehaviourSupportPlan,
} from "@/app/app/actions/behaviour-support-plans";
import { ConfirmActionButton } from "@/components/care/confirm-action-button";

export const metadata = {
  title: "Behaviour Support Plan | FormaOS",
};

const PLAN_TYPE_LABELS: Record<string, string> = {
  interim: "Interim (≤1 month)",
  comprehensive: "Comprehensive (≤6 months)",
};

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function BehaviourSupportPlanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const state = await fetchSystemState();
  if (!state) redirect("/auth/signin");

  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: plan } = await supabase
    .from("org_behaviour_support_plans")
    .select(
      `id, plan_type, status, first_restrictive_practice_at, drafted_at,
       authorised_at, effective_from, expires_at, reviewed_at,
       authorising_body, authorisation_reference, sbs_provider_name,
       sbs_provider_registration_id, notes, participant_id, created_at, updated_at`,
    )
    .eq("id", id)
    .eq("organization_id", state.organization.id)
    .maybeSingle();

  if (!plan) notFound();

  let participantLabel: string | null = null;
  if (plan.participant_id) {
    const { data: p } = await supabase
      .from("org_patients")
      .select("full_name")
      .eq("id", plan.participant_id)
      .eq("organization_id", state.organization.id)
      .maybeSingle();
    participantLabel = (p as { full_name?: string } | null)?.full_name ?? null;
  }

  // System-state UserRole flattens compliance_admin → admin at the system-state
  // layer; RLS enforces the finer-grained owner/admin/compliance_admin check.
  const canEdit = state.role === "owner" || state.role === "admin";
  const isWithdrawn = plan.status === "withdrawn";

  // Withdrawing keeps the authorisation record intact, which the Restrictive
  // Practices Rules require; deletion is the last resort.
  const withdrawAction = async () => {
    "use server";
    const fd = new FormData();
    fd.set("plan_id", plan.id);
    fd.set("plan_type", plan.plan_type);
    fd.set("status", "withdrawn");
    for (const [field, value] of [
      ["participant_id", plan.participant_id],
      ["first_restrictive_practice_at", plan.first_restrictive_practice_at],
      ["authorised_at", plan.authorised_at],
      ["effective_from", plan.effective_from],
      ["expires_at", plan.expires_at],
      ["reviewed_at", plan.reviewed_at],
      ["authorising_body", plan.authorising_body],
      ["authorisation_reference", plan.authorisation_reference],
      ["sbs_provider_name", plan.sbs_provider_name],
      ["sbs_provider_registration_id", plan.sbs_provider_registration_id],
      ["notes", plan.notes],
    ] as [string, string | null][]) {
      if (value) fd.set(field, value);
    }
    await updateBehaviourSupportPlan(fd);
  };

  const deleteAction = async (fd: FormData) => {
    "use server";
    await deleteBehaviourSupportPlan(fd);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 p-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/app/behaviour-support-plans"
            className="rounded-lg p-2 transition-colors hover:bg-muted"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="page-title">
              {participantLabel ?? "Unassigned participant"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {PLAN_TYPE_LABELS[plan.plan_type] ?? plan.plan_type} ·{" "}
              <span className="capitalize">{plan.status}</span>
            </p>
          </div>
        </div>
        {canEdit && (
          <div className="flex items-center gap-2">
            <Link
              href={`/app/behaviour-support-plans/${plan.id}/edit`}
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm hover:bg-muted"
              data-testid="bsp-edit-btn"
            >
              <Pencil className="h-3.5 w-3.5" /> Edit
            </Link>
            {!isWithdrawn && (
              <ConfirmActionButton
                action={withdrawAction}
                label="Withdraw"
                icon={<Archive className="h-3.5 w-3.5" />}
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm hover:bg-muted"
                title="Withdraw this behaviour support plan?"
                description="The plan is marked withdrawn and stops counting as current, but the authorisation record and its dates stay on file for audit."
                confirmLabel="Withdraw plan"
                tone="primary"
              />
            )}
            <ConfirmActionButton
              action={deleteAction}
              fields={{ plan_id: plan.id }}
              label="Delete"
              icon={<Trash2 className="h-3.5 w-3.5" />}
              testId="bsp-delete-btn"
              className="inline-flex items-center gap-1.5 rounded-md border border-destructive/40 px-3 py-2 text-sm text-destructive hover:bg-destructive/10"
              title="Permanently delete this plan?"
              description="This erases the record of a restrictive practice authorisation, which the NDIS Restrictive Practices Rules require you to keep. Withdraw the plan instead unless it was created in error."
              confirmLabel="Delete permanently"
            />
          </div>
        )}
      </div>

      <section className="rounded-xl border border-border p-6 space-y-3">
        <h2 className="text-lg font-semibold">Lifecycle</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <Row label="First restrictive practice" value={formatDate(plan.first_restrictive_practice_at)} />
          <Row label="Drafted" value={formatDate(plan.drafted_at)} />
          <Row label="Authorised" value={formatDate(plan.authorised_at)} />
          <Row label="Effective from" value={formatDate(plan.effective_from)} />
          <Row label="Expires" value={formatDate(plan.expires_at)} />
          <Row label="Last reviewed" value={formatDate(plan.reviewed_at)} />
        </div>
      </section>

      <section className="rounded-xl border border-border p-6 space-y-3">
        <h2 className="text-lg font-semibold">Authorisation + provider</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <Row label="Authorising body" value={plan.authorising_body ?? "—"} />
          <Row label="Authorisation reference" value={plan.authorisation_reference ?? "—"} />
          <Row label="SBS provider" value={plan.sbs_provider_name ?? "—"} />
          <Row label="Provider registration ID" value={plan.sbs_provider_registration_id ?? "—"} />
        </div>
      </section>

      {plan.notes && (
        <section className="rounded-xl border border-border p-6 space-y-2">
          <h2 className="text-lg font-semibold">Notes</h2>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{plan.notes}</p>
        </section>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
