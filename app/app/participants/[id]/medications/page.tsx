import { redirect } from 'next/navigation';
import { fetchSystemState } from '@/lib/server/fetch-system-state';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { ArrowLeft, Plus } from 'lucide-react';
import Link from 'next/link';
import { MedicationChart } from '@/components/care/medication-chart';

export const metadata = { title: 'Medications | FormaOS' };

export default async function ParticipantMedicationsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const state = await fetchSystemState();
  if (!state) redirect('/signin');

  const { id: participantId } = await params;
  const db = await createSupabaseServerClient();

  const { data: participant } = await db
    .from('org_patients')
    .select('id, first_name, last_name')
    .eq('id', participantId)
    .eq('org_id', state.orgId)
    .single();

  if (!participant) redirect('/app/participants');

  const { data: medications } = await db
    .from('org_medications')
    .select('*')
    .eq('org_id', state.orgId)
    .eq('participant_id', participantId)
    .order('created_at', { ascending: false });

  const medIds = (medications ?? []).map((m) => m.id);
  const { data: administrations } = medIds.length
    ? await db
        .from('org_medication_administrations')
        .select('*')
        .eq('org_id', state.orgId)
        .in('medication_id', medIds)
        .order('administered_at', { ascending: false })
        .limit(100)
    : { data: [] };

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/app/participants/${participantId}`}
          className="rounded-md p-1.5 hover:bg-muted"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Medications</h1>
          <p className="text-sm text-muted-foreground">
            {participant.first_name} {participant.last_name}
          </p>
        </div>
        <button className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4" /> Add Medication
        </button>
      </div>

      <MedicationChart
        medications={medications ?? []}
        administrations={administrations ?? []}
        participantId={participantId}
        orgId={state.orgId}
      />
    </div>
  );
}
