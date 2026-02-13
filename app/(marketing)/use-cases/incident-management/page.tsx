import { Metadata } from 'next';
import IncidentContent from './IncidentContent';

export const metadata: Metadata = {
  title: 'Incident Management & Investigation | FormaOS',
  description:
    'Incident reporting and investigation workflows with corrective actions, audit trails, and configurable regulator templates.',
};

export default function IncidentManagementPage() {
  return <IncidentContent />;
}
