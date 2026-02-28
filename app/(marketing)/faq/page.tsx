import type { Metadata } from 'next';
import FAQPageContent from './FAQPageContent';
import { faqSchema, breadcrumbSchema } from '@/lib/seo';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.formaos.com.au';

export const metadata: Metadata = {
  title: 'Frequently Asked Questions — FormaOS Compliance Platform',
  description:
    'Get answers to common questions about FormaOS — security, audit trails, immutable evidence, ISO/SOC support, integrations, pricing, and enterprise onboarding.',
  alternates: {
    canonical: `${siteUrl}/faq`,
  },
  openGraph: {
    title: 'Frequently Asked Questions | FormaOS',
    description:
      'Get answers to common questions about FormaOS — security, audit trails, immutable evidence, ISO/SOC support, integrations, pricing, and enterprise onboarding.',
    type: 'website',
    url: `${siteUrl}/faq`,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Frequently Asked Questions — FormaOS Compliance Platform',
    description:
      'Security, audit trails, immutable evidence, ISO/SOC support, integrations, pricing, and enterprise onboarding — answered.',
  },
};

const faqItems = [
  { question: 'What is FormaOS?', answer: 'FormaOS is an enterprise compliance operating system designed for regulated industries. It connects governance frameworks, operational controls, evidence collection, and audit defense into a single, unified platform.' },
  { question: 'How does FormaOS ensure audit integrity?', answer: 'Every action in FormaOS is automatically logged with full context — who did what, when, and in relation to which control or workflow. Audit trails are immutable and timestamped, providing a complete chain of evidence that satisfies regulatory requirements.' },
  { question: 'How is evidence made immutable?', answer: 'Evidence records are tracked with audit logs and timestamps. Every upload, update, and approval is recorded for full traceability, creating an immutable chain of evidence.' },
  { question: 'Does FormaOS support ISO and SOC frameworks?', answer: 'Yes. FormaOS is framework-agnostic and supports multiple compliance frameworks simultaneously including ISO 27001, SOC 2, NDIS Practice Standards, healthcare regulations, and industry-specific requirements.' },
  { question: 'Is FormaOS multi-tenant secure?', answer: 'FormaOS implements enterprise-grade security with data encryption in transit and at rest, role-based access controls, SSO support, and isolated tenant environments for regulated data protection.' },
  { question: 'Is there a free trial?', answer: 'Yes. FormaOS offers a 14-day free trial with full platform access. No credit card is required to start.' },
  { question: 'How is FormaOS different from task or compliance software?', answer: 'Traditional compliance tools store documents and rely on manual tracking. FormaOS is an operating system that runs your compliance program — enforcing control ownership, capturing evidence as work is completed, maintaining immutable audit trails, and providing continuous compliance visibility.' },
  { question: 'Does FormaOS integrate with existing systems?', answer: 'FormaOS provides Google OAuth for authentication and REST API access. Slack and Microsoft Teams integrations are available by request. Webhooks are included for real-time event notifications.' },
];

export default function FAQPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            faqSchema(faqItems),
            breadcrumbSchema([
              { name: 'Home', path: '/' },
              { name: 'FAQ', path: '/faq' },
            ]),
          ]),
        }}
      />
      <FAQPageContent />
    </>
  );
}
