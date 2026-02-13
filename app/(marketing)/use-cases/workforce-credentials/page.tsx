import { Metadata } from 'next';
import WorkforceContent from './WorkforceContent';

export const metadata: Metadata = {
  title: 'Workforce Credential Management | FormaOS',
  description:
    'Credential tracking for workforce compliance with reminders, competency management, and audit-ready reporting.',
};

export default function WorkforceUseCasePage() {
  return <WorkforceContent />;
}
