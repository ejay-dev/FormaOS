import { Metadata } from 'next';
import dynamic from 'next/dynamic';

const WorkforceContent = dynamic(
  () => import('./WorkforceContent').then((m) => m.default),
  { ssr: false },
);

export const metadata: Metadata = {
  title: 'Workforce Credential Management | FormaOS',
  description:
    'Credential tracking for workforce compliance with reminders, competency management, and audit-ready reporting.',
};

export default function WorkforceUseCasePage() {
  return <WorkforceContent />;
}
