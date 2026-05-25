import type { Metadata } from 'next';
import EnterprisePageContent from './EnterprisePageContent';
import { JsonLd } from '@/components/JsonLd';
import {
  breadcrumbSchema,
  organizationSchema,
  siteUrl,
  softwareApplicationSchema,
} from '@/lib/seo';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'FormaOS for Enterprise | Compliance OS',
  description:
    'Enterprise compliance with SAML 2.0 SSO, AU-hosted deployment, audit-ready artifacts, and dedicated security review support.',
  alternates: { canonical: `${siteUrl}/enterprise` },
  openGraph: {
    title: 'FormaOS for Enterprise | Compliance OS',
    description:
      'Enterprise compliance management with SAML 2.0 SSO, AU-hosted deployment by default, and audit-ready procurement artifacts.',
    type: 'website',
    url: `${siteUrl}/enterprise`,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FormaOS for Enterprise | Compliance OS',
    description:
      'Enterprise compliance management with SAML 2.0 SSO, AU-hosted deployment by default, and audit-ready procurement artifacts.',
  },
};

export default function EnterprisePage() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Enterprise', path: '/enterprise' },
          ]),
          organizationSchema(),
          softwareApplicationSchema(),
        ]}
      />
      <EnterprisePageContent />
    </>
  );
}
