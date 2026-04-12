import type { Metadata } from 'next';
import WhatIsCosContent from './WhatIsCosContent';
import { breadcrumbSchema, faqSchema, siteUrl } from '@/lib/seo';
export const dynamic = 'force-static';
export const metadata: Metadata = {
  title: 'What is a Compliance Operating System? | FormaOS',
  description:
    'A compliance operating system turns regulatory obligations into governed workflows with named owners, evidence chains, and audit-ready assurance. Learn how it differs from GRC tools.',
  keywords: [
    'compliance operating system',
    'what is compliance software',
    'GRC software Australia',
    'compliance management platform',
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
  alternates: { canonical: `${siteUrl}/what-is-a-compliance-operating-system` },
  openGraph: {
    title: 'What is a Compliance Operating System? | FormaOS',
    description:
      'Learn what a compliance operating system is, how it differs from GRC tools, and why regulated organisations are adopting this approach.',
    type: 'article',
    url: `${siteUrl}/what-is-a-compliance-operating-system`,
    siteName: 'FormaOS',
    locale: 'en_AU',
    images: [
      {
        url: `${siteUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'What is a Compliance Operating System?',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'What is a Compliance Operating System? | FormaOS',
    description:
      'Learn what a compliance operating system is, how it differs from GRC tools, and why it matters.',
    images: [`${siteUrl}/og-image.png`],
    creator: '@EjazDev',
    site: '@FormaOS',
  },
};

const pageFaq = [
  {
    question: 'What is a compliance operating system?',
    answer:
      'A compliance operating system is operational infrastructure that turns regulatory obligations into executable workflows with continuous evidence capture and real-time audit readiness. Unlike traditional GRC tools that manage documents and checklists, a compliance OS runs your compliance program as part of daily operations.',
  },
  {
    question:
      'How is a compliance operating system different from GRC software?',
    answer:
      'GRC software focuses on governance documentation, risk registers, and compliance checklists. A compliance operating system goes further by embedding compliance into operational workflows - turning requirements into executable processes that capture evidence automatically as work happens.',
  },
  {
    question: 'Who needs a compliance operating system?',
    answer:
      'Any organization that must demonstrate compliance to regulators, auditors, or accreditation bodies. This includes healthcare providers, disability service organizations, financial services firms, technology companies pursuing SOC 2 or ISO certification, and government agencies.',
  },
  {
    question:
      'What are the benefits of a compliance operating system over spreadsheets?',
    answer:
      'A compliance operating system eliminates manual evidence gathering, ensures continuous audit readiness, connects controls to operational workflows, and provides immutable audit trails. Spreadsheets create compliance gaps, lack accountability, and require periodic reconstruction of evidence.',
  },
];

export default function WhatIsComplianceOSPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            faqSchema(pageFaq),
            breadcrumbSchema([
              { name: 'Home', path: '/' },
              {
                name: 'What Is a Compliance Operating System',
                path: '/what-is-a-compliance-operating-system',
              },
            ]),
          ]),
        }}
      />
      <WhatIsCosContent />
    </>
  );
}
