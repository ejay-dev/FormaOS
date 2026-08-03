import { redirect } from 'next/navigation';
import { fetchSystemState } from '@/lib/system-state/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { MedicationChart } from '@/components/care/medication-chart';

export const metadata = { title: 'Medications | FormaOS' };

export default async function ParticipantMedicationsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const state = await fetchSystemState();
  if (!state) redirect('/auth/signin');

  const { id: participantId } = await params;
  const db = await createSupabaseServerClient();

  // Audit product-001 (2026-05-22): org_patients exposes `full_name`
  // (not first_name/last_name) and `organization_id` (not `org_id`).
  // The original query failed silently, the guard below fired, and the
  // entire medications module was unreachable.
  const { data: participant } = await db
    .from('org_patients')
    .select('id, full_name')
    .eq('id', participantId)
    .eq('organization_id', state.organization.id)
    .single();

  if (!participant) redirect('/app/participants');

  const { data: medications } = await db
    .from('org_medications')
    .select('*')
    .eq('org_id', state.organization.id)
    .eq('participant_id', participantId)
    .order('created_at', { ascending: false });

  const medIds = (medications ?? []).map((m) => m.id);
  const { data: administrations } = medIds.length
    ? await db
        .from('org_medication_administrations')
        .select('*')
        .eq('org_id', state.organization.id)
        .in('medication_id', medIds)
        .order('administered_at', { ascending: false })
        .limit(100)
    : { data: [] };

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/app/participants/${participantId}`}
          className="min-h-[44px] md:min-h-0 rounded-md p-1.5 hover:bg-muted"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <h1 className="page-title">Medications</h1>
          <p className="text-sm text-muted-foreground">
            {participant.full_name}
          </p>
        </div>
      </div>

      <MedicationChart
        medications={medications ?? []}
        administrations={administrations ?? []}
        participantId={participantId}
        orgId={state.organization.id}
      />
    </div>
  );
}
