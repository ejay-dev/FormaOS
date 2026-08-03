/**
 * Edit Participant Form Page
 *
 * Mirrors the field groups of /app/participants/new so the same record
 * reads the same whether it is being created or corrected.
 */

import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { fetchSystemState } from '@/lib/system-state/server';
import { updateParticipant } from '@/app/app/actions/care-operations';
import { SubmitButton } from '@/components/ui/submit-button';

function getEntityLabel(industry: string | null): string {
  switch (industry) {
    case 'ndis':
      return 'Participant';
    case 'healthcare':
      return 'Patient';
    case 'aged_care':
      return 'Resident';
    default:
      return 'Client';
  }
}

type ParticipantRow = {
  id: string;
  full_name: string;
  preferred_name: string | null;
  external_id: string | null;
  date_of_birth: string | null;
  gender: string | null;
  care_status: string;
  risk_level: string;
  emergency_flag: boolean;
  phone: string | null;
  email: string | null;
  address: string | null;
  funding_type: string | null;
  primary_diagnosis: string | null;
  ndis_number: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_relationship: string | null;
  communication_needs: string | null;
  cultural_considerations: string | null;
};

export default async function EditParticipantPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const systemState = await fetchSystemState();
  if (!systemState) redirect('/auth/signin');

  const { id: participantId } = await params;
  const label = getEntityLabel(systemState.organization.industry);
  const isNDIS = systemState.organization.industry === 'ndis';

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('org_patients')
    .select(
      `
        id,
        full_name,
        preferred_name,
        external_id,
        date_of_birth,
        gender,
        care_status,
        risk_level,
        emergency_flag,
        phone,
        email,
        address,
        funding_type,
        primary_diagnosis,
        ndis_number,
        emergency_contact_name,
        emergency_contact_phone,
        emergency_contact_relationship,
        communication_needs,
        cultural_considerations
      `,
    )
    .eq('organization_id', systemState.organization.id)
    .eq('id', participantId)
    .maybeSingle();

  // supabase-js resolves with { data: null, error } rather than rejecting, so
  // an RLS denial or timeout would otherwise read as "no such record".
  if (error) throw new Error(error.message);

  const participant = data as ParticipantRow | null;
  if (!participant) notFound();

  const detailHref = `/app/participants/${participantId}`;
  const inputClass =
    'w-full px-3 py-2 rounded-lg border border-input bg-background';

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href={detailHref}
          className="min-h-[44px] md:min-h-0 p-2 rounded-lg hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="page-title">Edit {label.toLowerCase()}</h1>
          <p className="text-muted-foreground">{participant.full_name}</p>
        </div>
      </div>

      <form
        action={async (fd: FormData) => {
          'use server';
          // On success updateParticipant redirects; on failure it returns a
          // typed error instead of throwing, so rethrow it or the page just
          // re-renders and the edit is lost without a word to the user.
          const result = await updateParticipant(participantId, fd);
          if (result && !result.success) throw new Error(result.error);
        }}
        className="space-y-6"
      >
        <div className="rounded-xl border border-border p-6 space-y-4">
          <h2 className="text-lg font-semibold">Basic Information</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="participant-full-name"
                className="block text-sm font-medium mb-1"
              >
                Full Name <span className="text-destructive">*</span>
              </label>
              <input
                id="participant-full-name"
                type="text"
                name="full_name"
                required
                autoComplete="name"
                enterKeyHint="next"
                defaultValue={participant.full_name}
                className={inputClass}
              />
            </div>
            <div>
              <label
                htmlFor="participant-preferred-name"
                className="block text-sm font-medium mb-1"
              >
                Preferred Name
              </label>
              <input
                id="participant-preferred-name"
                type="text"
                name="preferred_name"
                autoComplete="nickname"
                enterKeyHint="next"
                defaultValue={participant.preferred_name ?? ''}
                className={inputClass}
                placeholder="Nickname or preferred name"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="participant-date-of-birth"
                className="block text-sm font-medium mb-1"
              >
                Date of Birth
              </label>
              <input
                id="participant-date-of-birth"
                type="date"
                name="date_of_birth"
                autoComplete="bday"
                defaultValue={participant.date_of_birth ?? ''}
                className={inputClass}
              />
            </div>
            <div>
              <label
                htmlFor="participant-gender"
                className="block text-sm font-medium mb-1"
              >
                Gender
              </label>
              <select
                id="participant-gender"
                name="gender"
                defaultValue={participant.gender ?? ''}
                className={inputClass}
              >
                <option value="">Select...</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="non_binary">Non-binary</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="participant-phone"
                className="block text-sm font-medium mb-1"
              >
                Phone
              </label>
              <input
                id="participant-phone"
                type="tel"
                name="phone"
                autoComplete="tel"
                inputMode="tel"
                enterKeyHint="next"
                defaultValue={participant.phone ?? ''}
                className={inputClass}
              />
            </div>
            <div>
              <label
                htmlFor="participant-email"
                className="block text-sm font-medium mb-1"
              >
                Email
              </label>
              <input
                id="participant-email"
                type="email"
                name="email"
                autoComplete="email"
                inputMode="email"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                enterKeyHint="next"
                defaultValue={participant.email ?? ''}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="participant-address"
              className="block text-sm font-medium mb-1"
            >
              Address
            </label>
            <textarea
              id="participant-address"
              name="address"
              rows={2}
              autoComplete="street-address"
              defaultValue={participant.address ?? ''}
              className={inputClass}
            />
          </div>
        </div>

        <div className="rounded-xl border border-border p-6 space-y-4">
          <h2 className="text-lg font-semibold">Emergency Contact</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="participant-emergency-contact-name"
                className="block text-sm font-medium mb-1"
              >
                Contact Name
              </label>
              <input
                id="participant-emergency-contact-name"
                type="text"
                name="emergency_contact_name"
                defaultValue={participant.emergency_contact_name ?? ''}
                className={inputClass}
              />
            </div>
            <div>
              <label
                htmlFor="participant-emergency-contact-phone"
                className="block text-sm font-medium mb-1"
              >
                Contact Phone
              </label>
              <input
                id="participant-emergency-contact-phone"
                type="tel"
                name="emergency_contact_phone"
                inputMode="tel"
                enterKeyHint="next"
                defaultValue={participant.emergency_contact_phone ?? ''}
                className={inputClass}
              />
            </div>
            <div>
              <label
                htmlFor="participant-emergency-contact-relationship"
                className="block text-sm font-medium mb-1"
              >
                Relationship
              </label>
              <input
                id="participant-emergency-contact-relationship"
                type="text"
                name="emergency_contact_relationship"
                defaultValue={participant.emergency_contact_relationship ?? ''}
                className={inputClass}
                placeholder="e.g., Parent, Spouse"
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border p-6 space-y-4">
          <h2 className="text-lg font-semibold">Funding &amp; Care Details</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="participant-funding-type"
                className="block text-sm font-medium mb-1"
              >
                Funding Type
              </label>
              <select
                id="participant-funding-type"
                name="funding_type"
                defaultValue={participant.funding_type ?? ''}
                className={inputClass}
              >
                <option value="">Select...</option>
                <option value="ndis">NDIS</option>
                <option value="chsp">CHSP</option>
                <option value="private">Private</option>
                <option value="dva">DVA</option>
                <option value="other">Other</option>
              </select>
            </div>
            {/* The NDIS number is kept in the form for any record that already
                carries one, even if the org has since changed industry —
                otherwise saving would silently clear it. */}
            {isNDIS || participant.ndis_number ? (
              <div>
                <label
                  htmlFor="participant-ndis-number"
                  className="block text-sm font-medium mb-1"
                >
                  NDIS Number
                </label>
                <input
                  id="participant-ndis-number"
                  type="text"
                  name="ndis_number"
                  defaultValue={participant.ndis_number ?? ''}
                  className={inputClass}
                  placeholder="NDIS participant number"
                />
              </div>
            ) : null}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="participant-external-id"
                className="block text-sm font-medium mb-1"
              >
                External ID
              </label>
              <input
                id="participant-external-id"
                type="text"
                name="external_id"
                defaultValue={participant.external_id ?? ''}
                className={inputClass}
                placeholder="Reference number from other system"
              />
            </div>
            <div>
              <label
                htmlFor="participant-primary-diagnosis"
                className="block text-sm font-medium mb-1"
              >
                Primary Diagnosis
              </label>
              <input
                id="participant-primary-diagnosis"
                type="text"
                name="primary_diagnosis"
                defaultValue={participant.primary_diagnosis ?? ''}
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="participant-care-status"
                className="block text-sm font-medium mb-1"
              >
                Care Status
              </label>
              <select
                id="participant-care-status"
                name="care_status"
                defaultValue={participant.care_status}
                className={inputClass}
              >
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="discharged">Discharged</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="participant-risk-level"
                className="block text-sm font-medium mb-1"
              >
                Risk Level
              </label>
              <select
                id="participant-risk-level"
                name="risk_level"
                defaultValue={participant.risk_level}
                className={inputClass}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div className="flex items-center pt-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="emergency_flag"
                  value="true"
                  defaultChecked={participant.emergency_flag}
                  className="rounded"
                />
                <span className="text-sm">Emergency Flag</span>
              </label>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border p-6 space-y-4">
          <h2 className="text-lg font-semibold">Additional Information</h2>

          <div>
            <label
              htmlFor="participant-communication-needs"
              className="block text-sm font-medium mb-1"
            >
              Communication Needs
            </label>
            <textarea
              id="participant-communication-needs"
              name="communication_needs"
              rows={2}
              defaultValue={participant.communication_needs ?? ''}
              className={inputClass}
              placeholder="Any communication preferences or requirements"
            />
          </div>

          <div>
            <label
              htmlFor="participant-cultural-considerations"
              className="block text-sm font-medium mb-1"
            >
              Cultural Considerations
            </label>
            <textarea
              id="participant-cultural-considerations"
              name="cultural_considerations"
              rows={2}
              defaultValue={participant.cultural_considerations ?? ''}
              className={inputClass}
              placeholder="Cultural background, dietary requirements, etc."
            />
          </div>
        </div>

        <div className="flex gap-4 justify-end">
          <Link
            href={detailHref}
            className="min-h-[44px] md:min-h-0 px-4 py-2 rounded-lg border border-input hover:bg-muted transition-colors"
          >
            Cancel
          </Link>
          <SubmitButton
            size="md"
            fullWidth={false}
            showArrow={false}
            loadingText="Saving…"
            className="px-4 rounded-lg"
          >
            Save changes
          </SubmitButton>
        </div>
      </form>
    </div>
  );
}
