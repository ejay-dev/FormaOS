import { Metadata } from 'next';
import WorkforceContent from './WorkforceContent';
import {
  siteUrl,
  breadcrumbSchema,
  softwareApplicationSchema,
} from '@/lib/seo';
export const metadata: Metadata = {
  title: 'Workforce Credential Management | FormaOS',
  description:
    'Credential tracking for workforce compliance with reminders, competency management, and audit-ready reporting.',
  alternates: { canonical: `${siteUrl}/use-cases/workforce-credentials` },
  openGraph: {
    title: 'Workforce Credential Management | FormaOS',
    description:
      'Credential tracking for workforce compliance with reminders, competency management, and audit-ready reporting.',
    type: 'website',
    url: `${siteUrl}/use-cases/workforce-credentials`,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Workforce Credential Management | FormaOS',
    description:
      'Credential tracking, competency management, and audit-ready reporting for workforce compliance.',
  },
};

export default function WorkforceUseCasePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            breadcrumbSchema([
              { name: 'Home', path: '/' },
              { name: 'Use Cases', path: '/use-cases/workforce-credentials' },
              {
                name: 'Workforce Credentials',
                path: '/use-cases/workforce-credentials',
              },
            ]),
            softwareApplicationSchema(),
          ]),
        }}
      />
      <WorkforceContent />
    </>
  );
}
