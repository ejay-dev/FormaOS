import { redirect } from 'next/navigation';

// Workspace profile, feature modules, and branding all live on the settings
// hub; this route only existed as a second copy of it.
export default function OrganizationSettingsRedirectPage() {
  redirect('/app/settings');
}
