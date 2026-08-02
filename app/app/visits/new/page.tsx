/**
 * New Visit/Service Delivery Form Page
 */

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { fetchSystemState } from '@/lib/system-state/server';
import { createVisit } from '@/app/app/actions/care-operations';
import { SubmitButton } from '@/components/ui/submit-button';
import { resolveUserLabels } from '@/lib/identity/user-directory';

export default async function NewVisitPage() {
  const systemState = await fetchSystemState();
  if (!systemState) redirect('/auth/signin');

  const { organization } = systemState;
  const supabase = await createSupabaseServerClient();

  // Fetch clients for dropdown
  const { data: clients } = await supabase
    .from('org_patients')
    .select('id, full_name')
    .eq('organization_id', organization.id)
    .eq('care_status', 'active')
    .order('full_name');

  // Fetch staff members for dropdown. `users:user_id(...)` cannot be embedded —
  // org_members.user_id points at auth.users and the production schema declares
  // no FK to a public table — so profiles are resolved in a second query.
  const db = createSupabaseAdminClient();

  const { data: members, error: membersError } = await db
    .from('org_members')
    .select('user_id')
    .eq('organization_id', organization.id);

  if (membersError) {
    throw new Error(`Failed to load staff members: ${membersError.message}`);
  }

  const memberIds = Array.from(
    new Set(
      (members ?? [])
        .map((member) => member.user_id as string)
        .filter(Boolean),
    ),
  );

  // user_profiles.full_name and .email are NULL for all 2,598 production rows,
  // so building the picker from that table produced a list of blank options.
  // auth.users is the only populated source and is not reachable through
  // PostgREST, hence the admin-API directory lookup.
  const profileLabelById = await resolveUserLabels(db, memberIds);

  const staffMembers = memberIds.map((userId) => ({
    user_id: userId,
    label: profileLabelById.get(userId) ?? userId,
  }));

  type Client = NonNullable<typeof clients>[number];
  type StaffMember = (typeof staffMembers)[number];

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
          <p className="text-muted-foreground">
            Create a new service delivery entry
          </p>
        </div>
      </div>

      {/* Form */}
      <form
        action={async (fd: FormData) => {
          'use server';
          await createVisit(fd);
        }}
        className="space-y-6"
      >
        {/* Client & Staff */}
        <div className="rounded-xl border border-border p-6 space-y-4">
          <h2 className="text-lg font-semibold">Assignment</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="field-66"
                className="block text-sm font-medium mb-1"
              >
                Client <span className="text-red-500">*</span>
              </label>
              <select
                id="field-66"
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
              <label
                htmlFor="field-65"
                className="block text-sm font-medium mb-1"
              >
                Staff Member
              </label>
              <select
                id="field-65"
                name="staff_id"
                className="w-full px-3 py-2 rounded-lg border border-input bg-background"
              >
                <option value="">Assign later...</option>
                {staffMembers.map((member: StaffMember) => (
                  <option key={member.user_id} value={member.user_id}>
                    {member.label}
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
              <label
                htmlFor="field-64"
                className="block text-sm font-medium mb-1"
              >
                Start Date/Time <span className="text-red-500">*</span>
              </label>
              <input
                id="field-64"
                type="datetime-local"
                name="scheduled_start"
                required
                className="w-full px-3 py-2 rounded-lg border border-input bg-background"
              />
            </div>
            <div>
              <label
                htmlFor="field-63"
                className="block text-sm font-medium mb-1"
              >
                End Date/Time
              </label>
              <input
                id="field-63"
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
              <label
                htmlFor="field-62"
                className="block text-sm font-medium mb-1"
              >
                Visit Type
              </label>
              <select
                id="field-62"
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
              <label
                htmlFor="field-61"
                className="block text-sm font-medium mb-1"
              >
                Service Category
              </label>
              <select
                id="field-61"
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
              <label
                htmlFor="field-60"
                className="block text-sm font-medium mb-1"
              >
                Location Type
              </label>
              <select
                id="field-60"
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
              <label
                htmlFor="field-59"
                className="block text-sm font-medium mb-1"
              >
                Address
              </label>
              <input
                id="field-59"
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
              <label
                htmlFor="field-58"
                className="block text-sm font-medium mb-1"
              >
                Funding Source
              </label>
              <select
                id="field-58"
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
                <input
                  type="checkbox"
                  name="billable"
                  value="true"
                  defaultChecked
                  className="rounded"
                />
                <span className="text-sm">Billable Service</span>
              </label>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="rounded-xl border border-border p-6 space-y-4">
          <h2 className="text-lg font-semibold">Notes</h2>

          <div>
            <label
              htmlFor="field-57"
              className="block text-sm font-medium mb-1"
            >
              Visit Notes
            </label>
            <textarea
              id="field-57"
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
          <SubmitButton
            size="md"
            fullWidth={false}
            showArrow={false}
            loadingText="Scheduling…"
            className="px-4 rounded-lg"
          >
            Schedule Visit
          </SubmitButton>
        </div>
      </form>
    </div>
  );
}
