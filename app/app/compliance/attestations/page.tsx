import { redirect } from 'next/navigation';
import { fetchSystemState } from '@/lib/system-state/server';
import { listControlsNeedingAttestation } from '@/lib/compliance/attestations';
import { AttestationsClient } from './AttestationsClient';

// Audit Sprint 6c (2026-05-23): manual-attestation UI for the ~157
// evaluators across SOC2/ISO27001/HIPAA/PCI-DSS/CIS/NIST-CSF/GDPR packs
// that emit `manual_attestation_required` gaps. Page renders the three
// buckets server-side, hands the rows + the org's evidence inventory
// to the client component for interactive claim/review.

export const dynamic = 'force-dynamic';

export default async function ManualAttestationsPage() {
  const state = await fetchSystemState();
  if (!state) redirect('/auth/signin');

  const controls = await listControlsNeedingAttestation(state.organization.id);

  return (
    <AttestationsClient
      currentUserId={state.user.id}
      controls={controls}
    />
  );
}
