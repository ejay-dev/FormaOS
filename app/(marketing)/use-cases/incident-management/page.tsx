import { Metadata } from 'next';
import IncidentContent from './IncidentContent';
import { siteUrl } from '@/lib/seo';
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
  twitter: {
    card: 'summary_large_image',
    title: 'Incident Management & Investigation | FormaOS',
    description:
      'Incident reporting and investigation workflows with corrective actions, audit trails, and configurable regulator templates.',
  },
};

export default function IncidentManagementPage() {
  return <IncidentContent />;
}
