import type { Metadata } from 'next';
import FAQPageContent from './FAQPageContent';
import { faqSchema, breadcrumbSchema, siteUrl } from '@/lib/seo';
import { JsonLd } from '@/components/JsonLd';
export const dynamic = 'force-static';
export const metadata: Metadata = {
  title: 'Frequently Asked Questions - FormaOS Compliance Platform',
  description:
    'Get answers to common questions about FormaOS - security, audit trails, immutable evidence, ISO/SOC support, integrations, pricing, and enterprise onboarding.',
  alternates: {
    canonical: `${siteUrl}/faq`,
  },
  openGraph: {
    title: 'Frequently Asked Questions | FormaOS',
    description:
      'Get answers to common questions about FormaOS - security, audit trails, immutable evidence, ISO/SOC support, integrations, pricing, and enterprise onboarding.',
    type: 'website',
    url: `${siteUrl}/faq`,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Frequently Asked Questions - FormaOS Compliance Platform',
    description:
      'Security, audit trails, immutable evidence, ISO/SOC support, integrations, pricing, and enterprise onboarding - answered.',
  },
};

// Mirrors the questions rendered on the page. Structured data that answers
// something the visible page does not is both a rich-result violation and a
// second official wording for the same question.
const faqItems = [
  {
    question: 'What is FormaOS?',
    answer:
      'FormaOS is an enterprise compliance operating system designed for regulated industries. It connects governance frameworks, operational controls, evidence collection, and audit defense into a single, unified platform.',
  },
  {
    question: 'How is FormaOS different from task or compliance software?',
    answer:
      'Traditional compliance tools store documents and rely on manual tracking. FormaOS enforces control ownership, captures evidence as work is completed, maintains immutable audit trails, and provides continuous compliance visibility.',
  },
  {
    question: 'Where is data stored and what residency options exist?',
    answer:
      'FormaOS is AU-hosted by default, built for Australian-regulated organizations. Additional residency and cross-border handling requirements are reviewed during procurement, and a Data Processing Agreement is published in the Trust Center.',
  },
  {
    question: 'Is FormaOS SOC 2 certified?',
    answer:
      'No. FormaOS is aligned to SOC 2 controls, meaning controls are modelled and evidence can be produced. Certified would require an independent audit of FormaOS as a vendor. Our infrastructure providers maintain their own SOC 2 reports.',
  },
  {
    question: 'How does FormaOS generate audit trails?',
    answer:
      'Every action is logged with full context: who did what, when, and against which control or workflow. Audit trails are immutable and timestamped, and can be filtered, searched, and exported at any time.',
  },
  {
    question: 'Is evidence immutable?',
    answer:
      'Yes. Evidence records are append-only and tamper-evident. Once uploaded, evidence can only be superseded by a new version, with the original preserved in the audit trail alongside the actor and timestamp.',
  },
  {
    question: 'How do we evaluate FormaOS?',
    answer:
      'FormaOS starts with a guided compliance plan that scopes frameworks, team structure, evidence volume, audit exposure, and procurement requirements before a plan is recommended.',
  },
  {
    question: 'Are APIs available?',
    answer:
      'Yes. The REST API v1 covers organizations, tasks, evidence, compliance data, reports, frameworks, controls, notifications, integrations, and search, with scoped bearer API keys, cursor pagination, rate limiting, and an OpenAPI 3.1 specification.',
  },
];

export default function FAQPage() {
  return (
    <>
      <JsonLd data={[
            faqSchema(faqItems),
            breadcrumbSchema([
              { name: 'Home', path: '/' },
              { name: 'FAQ', path: '/faq' },
            ]),
          ]} />
      <FAQPageContent />
    </>
  );
}
