import { redirect } from 'next/navigation';

// /app/participants is the canonical client record. This route stays as an
// alias so saved links, onboarding CTAs, and the mobile nav keep working.
export default function LegacyPatientsRedirect() {
  redirect('/app/participants');
}
