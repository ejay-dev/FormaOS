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
      'Compliance Operating System for regulated organizations. Unify governance, evidence, and audits in one platform.',
    foundingDate: '2025',
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'sales',
        email: `sales@${brand.domain}`,
      },
    ],
    sameAs: [],
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
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'AUD',
    },
  };
}

export function breadcrumbSchema(
  items: { name: string; path: string }[],
) {
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

export function faqSchema(
  questions: { question: string; answer: string }[],
) {
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
export function jsonLdScript(data: Record<string, unknown> | Record<string, unknown>[]) {
  return JSON.stringify(data);
}

export { siteUrl };
