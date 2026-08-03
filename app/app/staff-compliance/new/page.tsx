/**
 * New Staff Credential Form Page
 */

import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { fetchSystemState } from '@/lib/system-state/server';
import { createStaffCredential } from '@/app/app/actions/care-operations';
import { SubmitButton } from '@/components/ui/submit-button';
import {
  getOrgMemberIdentities,
  type MemberIdentity,
} from '@/lib/team/member-identity';

const CREDENTIAL_TYPES = [
  { value: 'wwcc', label: 'Working With Children Check' },
  { value: 'police_check', label: 'Police Check' },
  { value: 'ndis_screening', label: 'NDIS Worker Screening' },
  { value: 'first_aid', label: 'First Aid Certificate' },
  { value: 'cpr', label: 'CPR Certificate' },
  { value: 'manual_handling', label: 'Manual Handling' },
  { value: 'medication_cert', label: 'Medication Certificate' },
  { value: 'drivers_license', label: "Driver's License" },
  { value: 'vaccination', label: 'Vaccination Record' },
  { value: 'other', label: 'Other' },
];

export default async function NewCredentialPage() {
  const systemState = await fetchSystemState();
  if (!systemState) redirect('/auth/signin');

  // Names for the staff picker. org_members has no declared FK to the
  // profile table, so a nested select would return nothing and leave the
  // dropdown showing user ids.
  const identities = await getOrgMemberIdentities();
  const staffMembers = Object.values(identities)
    .filter((identity): identity is MemberIdentity => Boolean(identity))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/app/staff-compliance"
          className="min-h-[44px] md:min-h-0 p-2 rounded-lg hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="page-title">Add credential</h1>
          <p className="text-muted-foreground">
            Record a staff qualification or check
          </p>
        </div>
      </div>

      {/* Form */}
      <form
        action={async (fd: FormData) => {
          'use server';
          await createStaffCredential(fd);
        }}
        className="space-y-6"
      >
        {/* Staff & Credential Type */}
        <div className="rounded-xl border border-border p-6 space-y-4">
          <h2 className="text-lg font-semibold">Credential details</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="field-52"
                className="block text-sm font-medium mb-1"
              >
                Staff member <span className="text-destructive">*</span>
              </label>
              <select
                id="field-52"
                name="user_id"
                required
                className="w-full px-3 py-2 rounded-lg border border-input bg-background"
                defaultValue={systemState.user.id}
              >
                {staffMembers.map((member) => (
                  <option key={member.userId} value={member.userId}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="field-51"
                className="block text-sm font-medium mb-1"
              >
                Credential type <span className="text-destructive">*</span>
              </label>
              <select
                id="field-51"
                name="credential_type"
                required
                className="w-full px-3 py-2 rounded-lg border border-input bg-background"
              >
                <option value="">Select type...</option>
                {CREDENTIAL_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="field-50"
              className="block text-sm font-medium mb-1"
            >
              Credential name <span className="text-destructive">*</span>
            </label>
            <input
              id="field-50"
              type="text"
              name="credential_name"
              required
              className="w-full px-3 py-2 rounded-lg border border-input bg-background"
              placeholder="e.g., Senior First Aid Certificate"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="field-49"
                className="block text-sm font-medium mb-1"
              >
                Credential number
              </label>
              <input
                id="field-49"
                type="text"
                name="credential_number"
                className="w-full px-3 py-2 rounded-lg border border-input bg-background"
                placeholder="Certificate or license number"
              />
            </div>
            <div>
              <label
                htmlFor="field-48"
                className="block text-sm font-medium mb-1"
              >
                Issuing authority
              </label>
              <input
                id="field-48"
                type="text"
                name="issuing_authority"
                className="w-full px-3 py-2 rounded-lg border border-input bg-background"
                placeholder="e.g., St John Ambulance"
              />
            </div>
          </div>
        </div>

        {/* Dates */}
        <div className="rounded-xl border border-border p-6 space-y-4">
          <h2 className="text-lg font-semibold">Validity period</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="field-47"
                className="block text-sm font-medium mb-1"
              >
                Issue date
              </label>
              <input
                id="field-47"
                type="date"
                name="issue_date"
                className="w-full px-3 py-2 rounded-lg border border-input bg-background"
              />
            </div>
            <div>
              <label
                htmlFor="field-46"
                className="block text-sm font-medium mb-1"
              >
                Expiry date
              </label>
              <input
                id="field-46"
                type="date"
                name="expiry_date"
                className="w-full px-3 py-2 rounded-lg border border-input bg-background"
              />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="rounded-xl border border-border p-6 space-y-4">
          <h2 className="text-lg font-semibold">Notes</h2>

          <div>
            <label
              htmlFor="field-45"
              className="block text-sm font-medium mb-1"
            >
              Notes
            </label>
            <textarea
              id="field-45"
              name="notes"
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-input bg-background"
              placeholder="Any additional information..."
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 justify-end">
          <Link
            href="/app/staff-compliance"
            className="min-h-[44px] md:min-h-0 px-4 py-2 rounded-lg border border-input hover:bg-muted transition-colors"
          >
            Cancel
          </Link>
          <SubmitButton
            size="md"
            fullWidth={false}
            showArrow={false}
            loadingText="Adding…"
            className="px-4 rounded-lg"
          >
            Add credential
          </SubmitButton>
        </div>
      </form>
    </div>
  );
}
