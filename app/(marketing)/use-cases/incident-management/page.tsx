import { Metadata } from 'next';
import dynamic from 'next/dynamic';

const IncidentContent = dynamic(
  () => import('./IncidentContent').then((m) => m.default),
  { ssr: false },
);

export const metadata: Metadata = {
  title: 'Incident Management & Investigation | FormaOS',
  description:
    'Incident reporting and investigation workflows with corrective actions, audit trails, and configurable regulator templates.',
};

export default function IncidentManagementPage() {
  return <IncidentContent />;
}
