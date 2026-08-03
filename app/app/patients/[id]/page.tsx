import { redirect } from 'next/navigation';

// Legacy alias for the canonical client record at /app/participants/[id].
// Older deep links (progress notes, staff roster, bookmarks) still arrive here.
export default async function LegacyPatientDetailRedirect({
  params,
}: {
  params?: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const patientId = resolvedParams?.id ?? '';
  redirect(patientId ? `/app/participants/${patientId}` : '/app/participants');
}
