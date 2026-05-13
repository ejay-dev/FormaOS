import { brand } from '@/config/brand';

const siteUrl = brand.seo.siteUrl.replace(/\/$/, '');

// ============================================================================
// JSON-LD Schema Helpers
// ============================================================================

export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'FormaOS',
    url: siteUrl,
    logo: `${siteUrl}/og-image.png`,
    description:
      'Compliance Operating System for Australian regulated industries. Unify governance, evidence, and audits in one platform.',
    foundingDate: '2025',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'AU',
      addressRegion: 'SA',
      addressLocality: 'Adelaide',
    },
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        email: `support@${brand.domain}`,
      },
    ],
    // sameAs lists external profiles that Google treats as canonical
    // company identities for knowledge-graph linking. The founder's
    // personal Twitter handle (twitter.com/EjazDev) was previously
    // listed here and would be interpreted by indexers as FormaOS's
    // own social profile — wrong identity binding. Until FormaOS has
    // a company-owned X/Twitter handle, only the LinkedIn company
    // page is listed. Audit row #16 (2026-05-13 marketing audit).
    sameAs: ['https://www.linkedin.com/company/formaos'],
  };
}

export function softwareApplicationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'FormaOS',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    url: siteUrl,
    description:
      'Compliance Operating System that transforms regulatory obligations into structured controls, owned actions, and immutable audit evidence.',
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'AUD',
      lowPrice: '297',
      highPrice: '5000',
      offerCount: '3',
    },
  };
}

export function serviceSchema(opts: {
  name: string;
  description: string;
  url: string;
  serviceType?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: opts.name,
    provider: {
      '@type': 'Organization',
      name: 'FormaOS',
      url: siteUrl,
    },
    serviceType: opts.serviceType ?? 'Compliance Software',
    areaServed: {
      '@type': 'Country',
      name: 'Australia',
    },
    description: opts.description,
    url: opts.url,
  };
}

export function pricingSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: 'FormaOS Compliance Platform',
    description:
      'Compliance Operating System for Australian regulated industries',
    brand: { '@type': 'Brand', name: 'FormaOS' },
    offers: [
      {
        '@type': 'Offer',
        name: 'Foundation',
        price: '297',
        priceCurrency: 'AUD',
        priceSpecification: {
          '@type': 'UnitPriceSpecification',
          price: '297',
          priceCurrency: 'AUD',
          unitCode: 'MON',
        },
        url: `${siteUrl}/pricing`,
      },
      {
        '@type': 'Offer',
        name: 'Growth',
        price: '1800',
        priceCurrency: 'AUD',
        priceSpecification: {
          '@type': 'UnitPriceSpecification',
          price: '1800',
          priceCurrency: 'AUD',
          unitCode: 'MON',
        },
        url: `${siteUrl}/pricing`,
      },
      {
        '@type': 'Offer',
        name: 'Enterprise',
        price: '5000',
        priceCurrency: 'AUD',
        description: 'Custom compliance infrastructure pricing from $5,000/month.',
        priceSpecification: {
          '@type': 'UnitPriceSpecification',
          price: '5000',
          priceCurrency: 'AUD',
          unitCode: 'MON',
        },
        url: `${siteUrl}/pricing`,
      },
    ],
  };
}

export function breadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${siteUrl}${item.path}`,
    })),
  };
}

export function faqSchema(questions: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: questions.map((q) => ({
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: q.answer,
      },
    })),
  };
}

export function articleSchema(opts: {
  title: string;
  description: string;
  url: string;
  datePublished: string;
  author: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: opts.title,
    description: opts.description,
    url: opts.url,
    datePublished: opts.datePublished,
    author: {
      '@type': 'Organization',
      name: opts.author === 'FormaOS Team' ? 'FormaOS' : opts.author,
    },
    publisher: {
      '@type': 'Organization',
      name: 'FormaOS',
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/og-image.png`,
      },
    },
  };
}

/**
 * Renders a JSON-LD script tag for use in page components.
 * Usage: <JsonLd data={schema} /> or <JsonLd data={[schema1, schema2]} />
 */
export function jsonLdScript(
  data: Record<string, unknown> | Record<string, unknown>[],
) {
  return JSON.stringify(data);
}

export { siteUrl };
