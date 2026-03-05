/**
 * New Care Plan Page
 * Create a new care/support plan for a client
 */

import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { fetchSystemState } from "@/lib/system-state/server";
import { createCarePlan } from "@/app/app/actions/care-operations";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function getCarePlanLabel(industry: string | null): string {
  switch (industry) {
    case "ndis": return "Support Plan";
    case "healthcare": return "Clinical Plan";
    case "childcare": return "Learning Plan";
    default: return "Care Plan";
  }
}

function getClientLabel(industry: string | null): string {
  switch (industry) {
    case "ndis": return "Participant";
    case "healthcare": return "Patient";
    case "childcare": return "Child";
    default: return "Resident";
  }
}

export const metadata = {
  title: "New Care Plan | FormaOS",
};

export default async function NewCarePlanPage() {
  const systemState = await fetchSystemState();
  if (!systemState) redirect("/auth/signin");

  const { organization } = systemState;
  const label = getCarePlanLabel(organization.industry);
  const clientLabel = getClientLabel(organization.industry);

  const supabase = await createSupabaseServerClient();

  // Fetch clients to populate the dropdown
  const { data: clients } = await supabase
    .from("org_participants")
    .select("id, full_name")
    .eq("organization_id", organization.id)
    .order("full_name", { ascending: true })
    .limit(500);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/app/care-plans"
          className="p-2 rounded-lg hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">New {label}</h1>
          <p className="text-muted-foreground">Create a new plan for a {clientLabel.toLowerCase()}</p>
        </div>
      </div>

      {/* Form */}
      <form action={createCarePlan} className="space-y-6">
        {/* Plan Details */}
        <div className="rounded-xl border border-border p-6 space-y-4">
          <h2 className="text-lg font-semibold">Plan Details</h2>

          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-1">
              Plan Title <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              type="text"
              name="title"
              required
              className="w-full px-3 py-2 rounded-lg border border-input bg-background"
              placeholder={`e.g., ${label} - Q1 2026`}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="client_id" className="block text-sm font-medium mb-1">
                {clientLabel} <span className="text-red-500">*</span>
              </label>
              <select
                id="client_id"
                name="client_id"
                required
                className="w-full px-3 py-2 rounded-lg border border-input bg-background"
              >
                <option value="">Select {clientLabel.toLowerCase()}...</option>
                {clients?.map((client: { id: string; full_name: string }) => (
                  <option key={client.id} value={client.id}>
                    {client.full_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="plan_type" className="block text-sm font-medium mb-1">Plan Type</label>
              <select
                id="plan_type"
                name="plan_type"
                className="w-full px-3 py-2 rounded-lg border border-input bg-background"
              >
                <option value="support">Support Plan</option>
                <option value="ndis">NDIS Plan</option>
                <option value="chsp">CHSP Plan</option>
                <option value="clinical">Clinical Plan</option>
                <option value="behavioral">Behavioural Plan</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-1">Description</label>
            <textarea
              id="description"
              name="description"
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-input bg-background"
              placeholder="Brief description of the plan"
            />
          </div>
        </div>

        {/* Dates */}
        <div className="rounded-xl border border-border p-6 space-y-4">
          <h2 className="text-lg font-semibold">Schedule</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="start_date" className="block text-sm font-medium mb-1">
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                id="start_date"
                type="date"
                name="start_date"
                required
                className="w-full px-3 py-2 rounded-lg border border-input bg-background"
              />
            </div>
            <div>
              <label htmlFor="end_date" className="block text-sm font-medium mb-1">End Date</label>
              <input
                id="end_date"
                type="date"
                name="end_date"
                className="w-full px-3 py-2 rounded-lg border border-input bg-background"
              />
            </div>
            <div>
              <label htmlFor="review_date" className="block text-sm font-medium mb-1">Review Date</label>
              <input
                id="review_date"
                type="date"
                name="review_date"
                className="w-full px-3 py-2 rounded-lg border border-input bg-background"
              />
            </div>
          </div>
        </div>

        {/* Hidden defaults for goals/supports (empty arrays) */}
        <input type="hidden" name="goals" value="[]" />
        <input type="hidden" name="supports" value="[]" />

        {/* Actions */}
        <div className="flex gap-4 justify-end">
          <Link
            href="/app/care-plans"
            className="px-4 py-2 rounded-lg border border-input hover:bg-muted transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
          >
            Create {label}
          </button>
        </div>
      </form>
    </div>
  );
}
