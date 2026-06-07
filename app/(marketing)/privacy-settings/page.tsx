import type { Metadata } from 'next';
import PrivacySettingsContent from './PrivacySettingsContent';
import { siteUrl } from '@/lib/seo';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Privacy Settings | FormaOS',
  description:
    'Manage your cookie and analytics consent for FormaOS. Withdraw or update your consent at any time.',
  alternates: {
    canonical: `${siteUrl}/privacy-settings`,
  },
};

export default function PrivacySettingsPage() {
  return <PrivacySettingsContent />;
}
