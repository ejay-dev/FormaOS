import type { Metadata } from 'next';
import EnterprisePageContent from './EnterprisePageContent';
import {
  breadcrumbSchema,
  jsonLdScript,
  organizationSchema,
  siteUrl,
  softwareApplicationSchema,
} from '@/lib/seo';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'FormaOS for Enterprise | Compliance Operating System',
  description:
    'Enterprise compliance management with SAML 2.0 SSO, AU-hosted deployment by default, audit-ready artifacts, and dedicated security review support. Built for regulated industries.',
  alternates: { canonical: `${siteUrl}/enterprise` },
  openGraph: {
    title: 'FormaOS for Enterprise | Compliance Operating System',
    description:
      'Enterprise compliance management with SAML 2.0 SSO, AU-hosted deployment by default, and audit-ready procurement artifacts.',
    type: 'website',
    url: `${siteUrl}/enterprise`,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FormaOS for Enterprise | Compliance Operating System',
    description:
      'Enterprise compliance management with SAML 2.0 SSO, AU-hosted deployment by default, and audit-ready procurement artifacts.',
  },
};

export default function EnterprisePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript([
            breadcrumbSchema([
              { name: 'Home', path: '/' },
              { name: 'Enterprise', path: '/enterprise' },
            ]),
            organizationSchema(),
            softwareApplicationSchema(),
          ]),
        }}
      />
      <EnterprisePageContent />
    </>
  );
}
