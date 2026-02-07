/**
 * New Incident Report Form Page
 */

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { fetchSystemState } from "@/lib/system-state/server";
import { createIncident } from "@/app/app/actions/care-operations";

export default async function NewIncidentPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/signin");

  const systemState = await fetchSystemState();
  if (!systemState) redirect("/auth/signin");

  const { organization } = systemState;

  // Fetch clients for dropdown
  const { data: clients } = await supabase
    .from("org_patients")
    .select("id, full_name")
    .eq("organization_id", organization.id)
    .order("full_name");

  type Client = NonNullable<typeof clients>[number];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/app/incidents"
          className="p-2 rounded-lg hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Report Incident</h1>
          <p className="text-muted-foreground">Log a new incident for tracking and follow-up</p>
        </div>
      </div>

      {/* Form */}
      <form action={createIncident} className="space-y-6">
        {/* Incident Details */}
        <div className="rounded-xl border border-border p-6 space-y-4">
          <h2 className="text-lg font-semibold">Incident Details</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Incident Type <span className="text-red-500">*</span>
              </label>
              <select
                name="incident_type"
                required
                className="w-full px-3 py-2 rounded-lg border border-input bg-background"
              >
                <option value="general">General</option>
                <option value="injury">Injury</option>
                <option value="medication_error">Medication Error</option>
                <option value="behavioral">Behavioral</option>
                <option value="abuse">Abuse/Neglect</option>
                <option value="property">Property Damage</option>
                <option value="complaint">Complaint</option>
                <option value="near_miss">Near Miss</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Severity <span className="text-red-500">*</span>
              </label>
              <select
                name="severity"
                required
                className="w-full px-3 py-2 rounded-lg border border-input bg-background"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Related Client</label>
              <select
                name="patient_id"
                className="w-full px-3 py-2 rounded-lg border border-input bg-background"
              >
                <option value="">No client linked</option>
                {clients?.map((client: Client) => (
                  <option key={client.id} value={client.id}>
                    {client.full_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Date & Time Occurred <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                name="occurred_at"
                required
                className="w-full px-3 py-2 rounded-lg border border-input bg-background"
                defaultValue={new Date().toISOString().slice(0, 16)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Location</label>
            <input
              type="text"
              name="location"
              className="w-full px-3 py-2 rounded-lg border border-input bg-background"
              placeholder="Where did the incident occur?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              required
              rows={4}
              className="w-full px-3 py-2 rounded-lg border border-input bg-background"
              placeholder="Describe what happened in detail..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Immediate Actions Taken</label>
            <textarea
              name="immediate_actions"
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-input bg-background"
              placeholder="What actions were taken immediately after the incident?"
            />
          </div>
        </div>

        {/* Follow-up */}
        <div className="rounded-xl border border-border p-6 space-y-4">
          <h2 className="text-lg font-semibold">Follow-up</h2>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="follow_up_required" value="true" className="rounded" />
              <span className="text-sm">Follow-up Required</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Follow-up Due Date</label>
            <input
              type="date"
              name="follow_up_due_date"
              className="w-full px-3 py-2 rounded-lg border border-input bg-background"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 justify-end">
          <Link
            href="/app/incidents"
            className="px-4 py-2 rounded-lg border border-input hover:bg-muted transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
          >
            Report Incident
          </button>
        </div>
      </form>
    </div>
  );
}
