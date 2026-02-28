import type { Metadata } from 'next';
import SecurityPageContent from './SecurityPageContent';
import { faqSchema, breadcrumbSchema } from '@/lib/seo';

export const dynamic = 'force-static';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.formaos.com.au';

export const metadata: Metadata = {
  title: 'Security & Compliance Infrastructure — FormaOS',
  description:
    'Enterprise-grade security with encryption at rest and in transit, immutable audit trails, role-based access, SSO, and privacy-by-design architecture for regulated data.',
  alternates: {
    canonical: `${siteUrl}/security`,
  },
  openGraph: {
    title: 'Security & Compliance | FormaOS',
    description:
      'Enterprise-grade security controls and privacy protection for regulated data. Encryption, audit trails, SSO, and multi-tenant isolation.',
    type: 'website',
    url: `${siteUrl}/security`,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Security & Compliance Infrastructure | FormaOS',
    description:
      'Enterprise-grade encryption, immutable audit trails, role-based access, and SSO for regulated data.',
  },
};

const securityFaqItems = [
  { question: 'How does FormaOS ensure audit integrity?', answer: 'Every action in FormaOS is automatically logged with full context — who did what, when, and in relation to which control or workflow. Audit trails are immutable and timestamped, providing a complete chain of evidence.' },
  { question: 'How is evidence made immutable?', answer: 'Evidence records are tracked with audit logs and timestamps. Every upload, update, and approval is recorded for full traceability, creating a defensible chain of evidence.' },
  { question: 'Does FormaOS support ISO and SOC frameworks?', answer: 'Yes. FormaOS is framework-agnostic and supports ISO 27001, SOC 2, NDIS Practice Standards, healthcare regulations, and other frameworks simultaneously.' },
  { question: 'Is FormaOS multi-tenant secure?', answer: 'FormaOS implements enterprise-grade security with data encryption in transit and at rest, role-based access controls, SSO support, and isolated tenant environments.' },
];

export default function SecurityPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            faqSchema(securityFaqItems),
            breadcrumbSchema([
              { name: 'Home', path: '/' },
              { name: 'Security', path: '/security' },
            ]),
          ]),
        }}
      />
      <SecurityPageContent />
    </>
  );
}
