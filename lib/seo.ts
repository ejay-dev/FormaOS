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
    sameAs: [
      'https://twitter.com/EjazDev',
      'https://www.linkedin.com/company/formaos',
    ],
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
      lowPrice: '159',
      highPrice: '399',
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
        name: 'Starter',
        price: '159',
        priceCurrency: 'AUD',
        priceSpecification: {
          '@type': 'UnitPriceSpecification',
          price: '159',
          priceCurrency: 'AUD',
          unitCode: 'MON',
        },
        url: `${siteUrl}/pricing`,
      },
      {
        '@type': 'Offer',
        name: 'Professional',
        price: '239',
        priceCurrency: 'AUD',
        priceSpecification: {
          '@type': 'UnitPriceSpecification',
          price: '239',
          priceCurrency: 'AUD',
          unitCode: 'MON',
        },
        url: `${siteUrl}/pricing`,
      },
      {
        '@type': 'Offer',
        name: 'Enterprise',
        price: '399',
        priceCurrency: 'AUD',
        priceSpecification: {
          '@type': 'UnitPriceSpecification',
          price: '399',
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
 * @deprecated Do not use until real review data is available.
 * Google prohibits fabricated AggregateRating structured data.
 * Remove the aggregateRating property and populate from a real review source.
 */
export function aggregateRatingSchema(opts?: {
  ratingValue?: number;
  reviewCount?: number;
  bestRating?: number;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'FormaOS',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    url: siteUrl,
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: String(opts?.ratingValue ?? 4.8),
      reviewCount: String(opts?.reviewCount ?? 47),
      bestRating: String(opts?.bestRating ?? 5),
      worstRating: '1',
    },
  };
}

/**
 * @deprecated Only emit this schema when a real video exists with a contentUrl or embedUrl.
 * Google requires at least one of contentUrl/embedUrl to generate a video rich result.
 */
export function videoObjectSchema(opts: {
  name: string;
  description: string;
  thumbnailUrl: string;
  uploadDate: string;
  duration?: string;
  embedUrl?: string;
  contentUrl?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: opts.name,
    description: opts.description,
    thumbnailUrl: opts.thumbnailUrl.startsWith('http')
      ? opts.thumbnailUrl
      : `${siteUrl}${opts.thumbnailUrl}`,
    uploadDate: opts.uploadDate,
    ...(opts.duration && { duration: opts.duration }),
    ...(opts.embedUrl && { embedUrl: opts.embedUrl }),
    ...(opts.contentUrl && { contentUrl: opts.contentUrl }),
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
