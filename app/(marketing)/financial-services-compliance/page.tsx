import type { Metadata } from 'next';
import FinancialServicesContent from './FinancialServicesContent';
import { breadcrumbSchema, serviceSchema, faqSchema, siteUrl } from '@/lib/seo';

const financialServiceSchema = serviceSchema({
  name: 'Financial Services Compliance Management Software',
  description:
    'ASIC AFS licence obligation mapping, APRA CPS compliance, AUSTRAC AML/CTF tracking, and breach register management for Australian financial services.',
  url: `${siteUrl}/financial-services-compliance`,
});

const financialFaqSchema = faqSchema([
  {
    question: 'Does FormaOS map all AFS licence obligations?',
    answer:
      'Yes. FormaOS maps obligations under ASIC s912A including conduct obligations, disclosure requirements, organisational competence, dispute resolution, and breach reporting requirements.',
  },
  {
    question: 'How does FormaOS handle AUSTRAC AML/CTF compliance?',
    answer:
      'FormaOS tracks AML/CTF program requirements including customer identification, transaction monitoring, suspicious matter reporting, and annual compliance reporting obligations.',
  },
  {
    question: 'Can FormaOS manage breach registers?',
    answer:
      'Yes. FormaOS maintains a structured breach register with significance assessment, ASIC notification tracking, root cause analysis, and remediation workflows aligned with the reportable situations regime.',
  },
  {
    question: 'Does FormaOS support board reporting?',
    answer:
      'Yes. FormaOS generates compliance reporting packs for board and risk committee meetings, covering obligation status, breach summaries, and risk exposure across regulatory frameworks.',
  },
  {
    question: 'Is my financial data stored in Australia?',
    answer:
      'Yes. FormaOS is AU-hosted by default. All compliance records, client data, and audit evidence remain on Australian infrastructure.',
  },
]);

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title:
    'Financial Services Compliance Software - ASIC, APRA & AUSTRAC | FormaOS',
  description:
    'Map AFS licence obligations, manage breach registers, track AUSTRAC AML/CTF requirements, and generate board reporting packs. Built for Australian financial services compliance.',
  keywords: [
    'financial services compliance software Australia',
    'ASIC compliance software',
    'AFS licence obligations',
    'AUSTRAC AML CTF compliance',
    'APRA compliance platform',
    'breach register management',
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
  alternates: { canonical: `${siteUrl}/financial-services-compliance` },
  openGraph: {
    title:
      'Financial Services Compliance Software - ASIC, APRA & AUSTRAC | FormaOS',
    description:
      'Map AFS licence obligations, manage breach registers, track AUSTRAC AML/CTF, and generate board reporting packs for Australian financial services.',
    url: `${siteUrl}/financial-services-compliance`,
    siteName: 'FormaOS',
    locale: 'en_AU',
    type: 'website',
    images: [
      {
        url: `${siteUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'Financial Services Compliance Software by FormaOS',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title:
      'Financial Services Compliance Software - ASIC, APRA & AUSTRAC | FormaOS',
    description:
      'Map AFS licence obligations, manage breach registers, track AUSTRAC AML/CTF for Australian financial services.',
    images: [`${siteUrl}/og-image.png`],
    creator: '@EjazDev',
    site: '@FormaOS',
  },
};

export default function FinancialServicesCompliancePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            breadcrumbSchema([
              { name: 'Home', path: '/' },
              { name: 'Industries', path: '/industries' },
              {
                name: 'Financial Services Compliance',
                path: '/financial-services-compliance',
              },
            ]),
            financialServiceSchema,
            financialFaqSchema,
          ]),
        }}
      />
      <FinancialServicesContent />
    </>
  );
}
