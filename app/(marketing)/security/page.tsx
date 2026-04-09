import type { Metadata } from 'next';
import SecurityPageContent from './SecurityPageContent';
import { faqSchema, breadcrumbSchema, siteUrl } from '@/lib/seo';

export const dynamic = 'force-static';
export const metadata: Metadata = {
  title: 'Security & Data Protection | FormaOS',
  description:
    'Enterprise-grade security for Australian compliance data. AU-hosted by default, SOC 2 in progress, row-level security, SAML SSO, MFA. Your data never leaves Australia.',
  keywords: [
    'FormaOS security',
    'compliance software security Australia',
    'data residency Australia',
    'SOC 2 compliance software',
  ],
  authors: [{ name: 'FormaOS' }],
  creator: 'FormaOS',
  publisher: 'FormaOS',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large' as const,
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: `${siteUrl}/security`,
  },
  openGraph: {
    type: 'website',
    locale: 'en_AU',
    url: `${siteUrl}/security`,
    siteName: 'FormaOS',
    title: 'Security & Data Protection | FormaOS',
    description:
      'Enterprise-grade security for Australian compliance data. AU-hosted, SOC 2 in progress, row-level security, SAML SSO, MFA.',
    images: [
      {
        url: `${siteUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'FormaOS Security & Data Protection',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Security & Data Protection | FormaOS',
    description:
      'Enterprise-grade security for Australian compliance data. AU-hosted, SOC 2 in progress, row-level security, SAML SSO, MFA.',
    images: [`${siteUrl}/og-image.png`],
    creator: '@EjazDev',
    site: '@FormaOS',
  },
};

const securityFaqItems = [
  {
    question: 'How does FormaOS ensure audit integrity?',
    answer:
      'Every action in FormaOS is automatically logged with full context - who did what, when, and in relation to which control or workflow. Audit trails are immutable and timestamped, providing a complete chain of evidence.',
  },
  {
    question: 'How is evidence made immutable?',
    answer:
      'Evidence records are tracked with audit logs and timestamps. Every upload, update, and approval is recorded for full traceability, creating a defensible chain of evidence.',
  },
  {
    question: 'Does FormaOS support ISO and SOC frameworks?',
    answer:
      'Yes. FormaOS is framework-agnostic and supports ISO 27001, SOC 2, NDIS Practice Standards, healthcare regulations, and other frameworks simultaneously.',
  },
  {
    question: 'Is FormaOS multi-tenant secure?',
    answer:
      'FormaOS implements enterprise-grade security with data encryption in transit and at rest, role-based access controls, SSO support, and isolated tenant environments.',
  },
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
