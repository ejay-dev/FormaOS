import { redirect } from 'next/navigation';
import { fetchSystemState } from '@/lib/system-state/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { listControlsNeedingAttestation } from '@/lib/compliance/attestations';
import { AttestationsClient, type EvidenceOption } from './AttestationsClient';

// Audit Sprint 6c (2026-05-23): manual-attestation UI for the ~157
// evaluators across SOC2/ISO27001/HIPAA/PCI-DSS/CIS/NIST-CSF/GDPR packs
// that emit `manual_attestation_required` gaps. Page renders the three
// buckets server-side, hands the rows + the org's evidence inventory
// to the client component for interactive claim/review.

export const dynamic = 'force-dynamic';

export default async function ManualAttestationsPage() {
  const state = await fetchSystemState();
  if (!state) redirect('/auth/signin');

  const supabase = await createSupabaseServerClient();

  const [controls, { data: evidenceRows }] = await Promise.all([
    listControlsNeedingAttestation(state.organization.id),
    supabase
      .from('org_evidence')
      .select('id, title, file_name, created_at')
      .eq('organization_id', state.organization.id)
      .order('created_at', { ascending: false })
      .limit(200),
  ]);

  // The claim dialog picks evidence by name, never by row id — the id is
  // carried behind the label.
  const evidenceOptions: EvidenceOption[] = (evidenceRows ?? []).map((row) => ({
    id: String(row.id),
    label:
      (row.title as string | null) ||
      (row.file_name as string | null) ||
      'Untitled artifact',
    uploadedAt: (row.created_at as string | null) ?? null,
  }));

  return (
    <AttestationsClient
      currentUserId={state.user.id}
      controls={controls}
      evidenceOptions={evidenceOptions}
    />
  );
}
