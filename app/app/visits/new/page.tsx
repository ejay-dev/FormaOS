/**
 * New Visit/Service Delivery Form Page
 */

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { fetchSystemState } from "@/lib/system-state/server";
import { createVisit } from "@/app/app/actions/care-operations";

export default async function NewVisitPage() {
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
    .eq("care_status", "active")
    .order("full_name");

  // Fetch staff members for dropdown
  const { data: staffMembers } = await supabase
    .from("org_members")
    .select("user_id, users:user_id(email)")
    .eq("organization_id", organization.id);

  type Client = NonNullable<typeof clients>[number];
  type StaffMember = NonNullable<typeof staffMembers>[number];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/app/visits"
          className="p-2 rounded-lg hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Schedule Visit</h1>
          <p className="text-muted-foreground">Create a new service delivery entry</p>
        </div>
      </div>

      {/* Form */}
      <form action={createVisit} className="space-y-6">
        {/* Client & Staff */}
        <div className="rounded-xl border border-border p-6 space-y-4">
          <h2 className="text-lg font-semibold">Assignment</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Client <span className="text-red-500">*</span>
              </label>
              <select
                name="client_id"
                required
                className="w-full px-3 py-2 rounded-lg border border-input bg-background"
              >
                <option value="">Select client...</option>
                {clients?.map((client: Client) => (
                  <option key={client.id} value={client.id}>
                    {client.full_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Staff Member</label>
              <select
                name="staff_id"
                className="w-full px-3 py-2 rounded-lg border border-input bg-background"
              >
                <option value="">Assign later...</option>
                {staffMembers?.map((member: StaffMember) => (
                  <option key={member.user_id} value={member.user_id}>
                    {(member.users as { email: string } | null)?.email?.split("@")[0] || member.user_id}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Schedule */}
        <div className="rounded-xl border border-border p-6 space-y-4">
          <h2 className="text-lg font-semibold">Schedule</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Start Date/Time <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                name="scheduled_start"
                required
                className="w-full px-3 py-2 rounded-lg border border-input bg-background"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End Date/Time</label>
              <input
                type="datetime-local"
                name="scheduled_end"
                className="w-full px-3 py-2 rounded-lg border border-input bg-background"
              />
            </div>
          </div>
        </div>

        {/* Service Details */}
        <div className="rounded-xl border border-border p-6 space-y-4">
          <h2 className="text-lg font-semibold">Service Details</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Visit Type</label>
              <select
                name="visit_type"
                className="w-full px-3 py-2 rounded-lg border border-input bg-background"
              >
                <option value="service">Service Delivery</option>
                <option value="assessment">Assessment</option>
                <option value="review">Plan Review</option>
                <option value="support">Support Session</option>
                <option value="transport">Transport</option>
                <option value="community">Community Access</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Service Category</label>
              <select
                name="service_category"
                className="w-full px-3 py-2 rounded-lg border border-input bg-background"
              >
                <option value="">Select...</option>
                <option value="personal_care">Personal Care</option>
                <option value="domestic">Domestic Assistance</option>
                <option value="community_access">Community Access</option>
                <option value="therapy">Therapy</option>
                <option value="nursing">Nursing</option>
                <option value="respite">Respite</option>
                <option value="transport">Transport</option>
                <option value="group">Group Program</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Location Type</label>
              <select
                name="location_type"
                className="w-full px-3 py-2 rounded-lg border border-input bg-background"
              >
                <option value="client_home">Client Home</option>
                <option value="facility">Facility</option>
                <option value="community">Community</option>
                <option value="telehealth">Telehealth</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Address</label>
              <input
                type="text"
                name="address"
                className="w-full px-3 py-2 rounded-lg border border-input bg-background"
                placeholder="Location address if different from client"
              />
            </div>
          </div>
        </div>

        {/* Billing */}
        <div className="rounded-xl border border-border p-6 space-y-4">
          <h2 className="text-lg font-semibold">Billing</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Funding Source</label>
              <select
                name="funding_source"
                className="w-full px-3 py-2 rounded-lg border border-input bg-background"
              >
                <option value="">Select...</option>
                <option value="ndis">NDIS</option>
                <option value="chsp">CHSP</option>
                <option value="private">Private</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="flex items-center pt-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="billable" value="true" defaultChecked className="rounded" />
                <span className="text-sm">Billable Service</span>
              </label>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="rounded-xl border border-border p-6 space-y-4">
          <h2 className="text-lg font-semibold">Notes</h2>

          <div>
            <label className="block text-sm font-medium mb-1">Visit Notes</label>
            <textarea
              name="notes"
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-input bg-background"
              placeholder="Any notes or special instructions for this visit"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 justify-end">
          <Link
            href="/app/visits"
            className="px-4 py-2 rounded-lg border border-input hover:bg-muted transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
          >
            Schedule Visit
          </button>
        </div>
      </form>
    </div>
  );
}
