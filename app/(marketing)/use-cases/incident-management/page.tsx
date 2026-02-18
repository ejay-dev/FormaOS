import { Metadata } from 'next';
import IncidentContent from './IncidentContent';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://formaos.com.au';

export const metadata: Metadata = {
  title: 'Incident Management & Investigation | FormaOS',
  description:
    'Incident reporting and investigation workflows with corrective actions, audit trails, and configurable regulator templates.',
  alternates: { canonical: `${siteUrl}/use-cases/incident-management` },
  openGraph: {
    title: 'Incident Management & Investigation | FormaOS',
    description:
      'Incident reporting and investigation workflows with corrective actions, audit trails, and configurable regulator templates.',
    type: 'website',
    url: `${siteUrl}/use-cases/incident-management`,
  },
};

export default function IncidentManagementPage() {
  return <IncidentContent />;
}
