import type { Metadata } from 'next';
import CompareIndexContent from './CompareIndexContent';
import { breadcrumbSchema } from '@/lib/seo';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.formaos.com.au';

export const metadata: Metadata = {
  title: 'Compare FormaOS vs Compliance Automation Tools',
  description:
    'Compare FormaOS against Drata, Vanta, SecureFrame, and traditional compliance platforms. See how outcome-driven execution beats checkbox automation.',
  alternates: {
    canonical: `${siteUrl}/compare`,
  },
  openGraph: {
    title: 'Compare FormaOS vs Compliance Tools',
    description:
      'Compare FormaOS against popular compliance automation tools. Outcome-driven execution, evidence defensibility, and operational governance.',
    type: 'website',
    url: `${siteUrl}/compare`,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Compare FormaOS vs Compliance Automation Tools',
    description:
      'See how FormaOS compares against Drata, Vanta, and Secureframe. Outcome-driven execution beats checkbox automation.',
  },
};

export default function CompareIndexPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbSchema([
              { name: 'Home', path: '/' },
              { name: 'Compare', path: '/compare' },
            ])
          ),
        }}
      />
      <CompareIndexContent />
    </>
  );
}
