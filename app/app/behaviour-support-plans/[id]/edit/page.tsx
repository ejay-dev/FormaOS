import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fetchSystemState } from "@/lib/system-state/server";
import { updateBehaviourSupportPlan } from "@/app/app/actions/behaviour-support-plans";

export const metadata = {
  title: "Edit Behaviour Support Plan | FormaOS",
};

const PLAN_STATUSES = [
  "draft",
  "submitted",
  "authorised",
  "active",
  "expired",
  "withdrawn",
] as const;

function toDateInputValue(value: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export default async function EditBehaviourSupportPlanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const state = await fetchSystemState();
  if (!state) redirect("/auth/signin");

  const canEdit = state.role === "owner" || state.role === "admin";

  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: plan } = await supabase
    .from("org_behaviour_support_plans")
    .select(
      `id, participant_id, plan_type, status, first_restrictive_practice_at,
       authorised_at, effective_from, expires_at, reviewed_at,
       authorising_body, authorisation_reference, sbs_provider_name,
       sbs_provider_registration_id, notes`,
    )
    .eq("id", id)
    .eq("organization_id", state.organization.id)
    .maybeSingle();
  if (!plan) notFound();

  const { data: participants } = await supabase
    .from("org_patients")
    .select("id, full_name")
    .eq("organization_id", state.organization.id)
    .order("full_name", { ascending: true })
    .limit(500);

  return (
    <div className="max-w-3xl mx-auto space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Link
          href={`/app/behaviour-support-plans/${plan.id}`}
          className="rounded-lg p-2 transition-colors hover:bg-muted"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Edit Behaviour Support Plan</h1>
          <p className="text-sm text-muted-foreground">Update lifecycle, authorisation, and provider fields.</p>
        </div>
      </div>

      {!canEdit && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm">
          You can view this plan, but only owner / admin / compliance_admin can save changes.
        </div>
      )}

      <form
        action={async (fd: FormData) => {
          "use server";
          await updateBehaviourSupportPlan(fd);
        }}
        className="space-y-6"
      >
        <input type="hidden" name="plan_id" value={plan.id} />

        <div className="rounded-xl border border-border p-6 space-y-4">
          <h2 className="text-lg font-semibold">Plan basics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="participant_id" className="block text-sm font-medium mb-1">
                Participant
              </label>
              <select
                id="participant_id"
                name="participant_id"
                defaultValue={plan.participant_id ?? ""}
                disabled={!canEdit}
                className="w-full px-3 py-2 rounded-lg border border-input bg-background disabled:opacity-60"
              >
                <option value="">— Unassigned —</option>
                {(participants ?? []).map(
                  (p: { id: string; full_name: string }) => (
                    <option key={p.id} value={p.id}>
                      {p.full_name}
                    </option>
                  ),
                )}
              </select>
            </div>
            <div>
              <label htmlFor="plan_type" className="block text-sm font-medium mb-1">
                Plan type
              </label>
              <select
                id="plan_type"
                name="plan_type"
                defaultValue={plan.plan_type}
                disabled={!canEdit}
                className="w-full px-3 py-2 rounded-lg border border-input bg-background disabled:opacity-60"
              >
                <option value="interim">Interim</option>
                <option value="comprehensive">Comprehensive</option>
              </select>
            </div>
            <div>
              <label htmlFor="status" className="block text-sm font-medium mb-1">
                Status
              </label>
              <select
                id="status"
                name="status"
                defaultValue={plan.status}
                disabled={!canEdit}
                className="w-full px-3 py-2 rounded-lg border border-input bg-background capitalize disabled:opacity-60"
              >
                {PLAN_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border p-6 space-y-4">
          <h2 className="text-lg font-semibold">Lifecycle timestamps</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              ["first_restrictive_practice_at", "First restrictive practice"],
              ["authorised_at", "Authorised"],
              ["effective_from", "Effective from"],
              ["expires_at", "Expires"],
              ["reviewed_at", "Last reviewed"],
            ].map(([field, label]) => (
              <div key={field}>
                <label htmlFor={field} className="block text-sm font-medium mb-1">
                  {label}
                </label>
                <input
                  id={field}
                  type="date"
                  name={field}
                  defaultValue={toDateInputValue(
                    plan[field as keyof typeof plan] as string | null,
                  )}
                  disabled={!canEdit}
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background disabled:opacity-60"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border p-6 space-y-4">
          <h2 className="text-lg font-semibold">Authorisation + provider</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              ["authorising_body", "Authorising body"],
              ["authorisation_reference", "Authorisation reference"],
              ["sbs_provider_name", "Specialist Behaviour Support provider"],
              ["sbs_provider_registration_id", "Provider NDIS registration ID"],
            ].map(([field, label]) => (
              <div key={field}>
                <label htmlFor={field} className="block text-sm font-medium mb-1">
                  {label}
                </label>
                <input
                  id={field}
                  type="text"
                  name={field}
                  defaultValue={
                    (plan[field as keyof typeof plan] as string | null) ?? ""
                  }
                  disabled={!canEdit}
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background disabled:opacity-60"
                />
              </div>
            ))}
          </div>
          <div>
            <label htmlFor="notes" className="block text-sm font-medium mb-1">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={4}
              defaultValue={plan.notes ?? ""}
              disabled={!canEdit}
              className="w-full px-3 py-2 rounded-lg border border-input bg-background disabled:opacity-60"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Link
            href={`/app/behaviour-support-plans/${plan.id}`}
            className="rounded-md border border-border px-3 py-2 text-sm hover:bg-muted"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={!canEdit}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            <Save className="h-4 w-4" /> Save changes
          </button>
        </div>
      </form>
    </div>
  );
}
