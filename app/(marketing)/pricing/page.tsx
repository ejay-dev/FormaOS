import type { Metadata } from 'next';
import PricingPageContent from './PricingPageContent';
import { PRICING_FAQS } from './components/faq-data';
import { faqSchema } from '@/lib/seo';
import { breadcrumbSchema,
  siteUrl} from '@/lib/seo';

export const dynamic = 'force-static';
export const metadata: Metadata = {
  title: 'Pricing | Compliance Operating System Plans | FormaOS',
  description:
    'Starter and Professional plans are self-serve. Enterprise buyers can run security review, procurement, and guided rollout with FormaOS.',
  alternates: {
    canonical: `${siteUrl}/pricing`,
  },
  openGraph: {
    title: 'Pricing | FormaOS',
    description:
      'Self-serve plans for regulated teams, with guided enterprise evaluation and procurement support when needed.',
    type: 'website',
    url: `${siteUrl}/pricing`,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pricing | Compliance Operating System Plans | FormaOS',
    description:
      'Self-serve plans for regulated teams, with guided enterprise evaluation and procurement support when needed.',
  },
};

export default function PricingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            faqSchema(PRICING_FAQS.map((faq) => ({
              question: faq.question,
              answer: faq.answer,
            }))),
            breadcrumbSchema([
              { name: 'Home', path: '/' },
              { name: 'Pricing', path: '/pricing' },
            ]),
          ]),
        }}
      />
      <PricingPageContent />
    </>
  );
}
