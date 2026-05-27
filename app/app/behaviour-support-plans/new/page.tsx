import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fetchSystemState } from "@/lib/system-state/server";
import { createBehaviourSupportPlan } from "@/app/app/actions/behaviour-support-plans";
import { SubmitButton } from "@/components/ui/submit-button";

export const metadata = {
  title: "New Behaviour Support Plan | FormaOS",
};

export default async function NewBehaviourSupportPlanPage() {
  const state = await fetchSystemState();
  if (!state) redirect("/auth/signin");

  const supabase = await createSupabaseServerClient();
  const { data: participants } = await supabase
    .from("org_patients")
    .select("id, full_name")
    .eq("organization_id", state.organization.id)
    .order("full_name", { ascending: true })
    .limit(500);

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-4">
        <Link
          href="/app/behaviour-support-plans"
          className="min-h-[44px] md:min-h-0 p-2 rounded-lg hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">New Behaviour Support Plan</h1>
          <p className="text-sm text-muted-foreground">
            NDIS Restrictive Practices and Behaviour Support Rules 2018
            (F2018L00632) — interim within 1 month, comprehensive within 6 months
            of first regulated restrictive practice use.
          </p>
        </div>
      </div>

      <form
        action={async (fd: FormData) => {
          "use server";
          await createBehaviourSupportPlan(fd);
        }}
        className="space-y-6"
      >
        <div className="rounded-xl border border-border p-6 space-y-4">
          <h2 className="text-lg font-semibold">Plan basics</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="participant_id"
                className="block text-sm font-medium mb-1"
              >
                Participant
              </label>
              <select
                id="participant_id"
                name="participant_id"
                defaultValue=""
                className="w-full px-3 py-2 rounded-lg border border-input bg-background"
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
              <label
                htmlFor="plan_type"
                className="block text-sm font-medium mb-1"
              >
                Plan type <span className="text-red-500">*</span>
              </label>
              <select
                id="plan_type"
                name="plan_type"
                required
                defaultValue="interim"
                className="w-full px-3 py-2 rounded-lg border border-input bg-background"
              >
                <option value="interim">Interim (≤1 month from first RP)</option>
                <option value="comprehensive">
                  Comprehensive (≤6 months from first RP)
                </option>
              </select>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border p-6 space-y-4">
          <h2 className="text-lg font-semibold">Lifecycle timestamps</h2>
          <p className="text-xs text-muted-foreground">
            These drive the NDIS-V.2 and NDIS-M.2 predicates. First-RP date is
            the statutory clock-starter; authorisation and expiry feed the
            renewal cadence check.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="first_restrictive_practice_at"
                className="block text-sm font-medium mb-1"
              >
                First restrictive practice
              </label>
              <input
                id="first_restrictive_practice_at"
                type="date"
                name="first_restrictive_practice_at"
                className="w-full px-3 py-2 rounded-lg border border-input bg-background"
              />
            </div>
            <div>
              <label
                htmlFor="authorised_at"
                className="block text-sm font-medium mb-1"
              >
                Authorised
              </label>
              <input
                id="authorised_at"
                type="date"
                name="authorised_at"
                className="w-full px-3 py-2 rounded-lg border border-input bg-background"
              />
            </div>
            <div>
              <label
                htmlFor="effective_from"
                className="block text-sm font-medium mb-1"
              >
                Effective from
              </label>
              <input
                id="effective_from"
                type="date"
                name="effective_from"
                className="w-full px-3 py-2 rounded-lg border border-input bg-background"
              />
            </div>
            <div>
              <label
                htmlFor="expires_at"
                className="block text-sm font-medium mb-1"
              >
                Expires
              </label>
              <input
                id="expires_at"
                type="date"
                name="expires_at"
                className="w-full px-3 py-2 rounded-lg border border-input bg-background"
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border p-6 space-y-4">
          <h2 className="text-lg font-semibold">Authorisation + provider</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="authorising_body"
                className="block text-sm font-medium mb-1"
              >
                Authorising body
              </label>
              <input
                id="authorising_body"
                type="text"
                name="authorising_body"
                className="w-full px-3 py-2 rounded-lg border border-input bg-background"
                placeholder="e.g. VIC Senior Practitioner, NSW Ombudsman"
              />
            </div>
            <div>
              <label
                htmlFor="authorisation_reference"
                className="block text-sm font-medium mb-1"
              >
                Authorisation reference
              </label>
              <input
                id="authorisation_reference"
                type="text"
                name="authorisation_reference"
                className="w-full px-3 py-2 rounded-lg border border-input bg-background"
                placeholder="Reference number / file ID"
              />
            </div>
            <div>
              <label
                htmlFor="sbs_provider_name"
                className="block text-sm font-medium mb-1"
              >
                Specialist Behaviour Support provider
              </label>
              <input
                id="sbs_provider_name"
                type="text"
                name="sbs_provider_name"
                className="w-full px-3 py-2 rounded-lg border border-input bg-background"
              />
            </div>
            <div>
              <label
                htmlFor="sbs_provider_registration_id"
                className="block text-sm font-medium mb-1"
              >
                Provider NDIS registration ID
              </label>
              <input
                id="sbs_provider_registration_id"
                type="text"
                name="sbs_provider_registration_id"
                className="w-full px-3 py-2 rounded-lg border border-input bg-background"
              />
            </div>
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium mb-1">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={4}
              className="w-full px-3 py-2 rounded-lg border border-input bg-background"
              placeholder="Internal notes (the full BSP document should be uploaded to the Evidence vault and linked separately)."
            />
          </div>
        </div>

        <div className="flex gap-4 justify-end">
          <Link
            href="/app/behaviour-support-plans"
            className="min-h-[44px] md:min-h-0 px-4 py-2 rounded-lg border border-input hover:bg-muted transition-colors"
          >
            Cancel
          </Link>
          <SubmitButton
            size="md"
            fullWidth={false}
            showArrow={false}
            loadingText="Creating BSP…"
            className="px-4 rounded-lg"
          >
            Create BSP
          </SubmitButton>
        </div>
      </form>
    </div>
  );
}
