import { redirect } from 'next/navigation';

// Email preferences now live in the Communications settings page alongside
// channel routing, so a person configures delivery in one place.
export default function EmailPreferencesRedirectPage() {
  redirect('/app/settings/notifications#email');
}
