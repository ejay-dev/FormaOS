// Centralized brand configuration and guard
// Single source of truth for all branding across the app

export const brand = {
  appName: 'FormaOS',
  marketingName: 'FormaOS',
  domain: 'formaos.com.au',
  identity: 'Compliance Operating System',
  logo: {
    mark: '/brand/formaos-mark.svg',
    wordmarkLight: '/brand/formaos-wordmark-light.svg',
    wordmarkDark: '/brand/formaos-wordmark-dark.svg',
    favicon: '/favicon.ico',
  },
  email: {
    senderName: 'FormaOS',
    senderEmail: process.env.RESEND_FROM_EMAIL || 'no-reply@formaos.com.au',
  },
  seo: {
    defaultTitle: 'FormaOS — Compliance Operating System',
    description:
      'FormaOS is the Compliance Operating System for regulated organizations — unify governance, evidence, and audits in one platform.',
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://formaos.com.au',
    appUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://app.formaos.com.au',
    ogImage: '/og-image.png',
  },
} as const;

// Hard lock: prevent unintended branding changes.
// To intentionally override branding, set BRAND_OVERRIDE_ALLOW=true.
(() => {
  if (process.env.BRAND_OVERRIDE_ALLOW === 'true') return;

  const violations: string[] = [];
  if (brand.appName !== 'FormaOS') violations.push(`appName=${brand.appName}`);
  if (brand.marketingName !== 'FormaOS')
    violations.push(`marketingName=${brand.marketingName}`);
  if (brand.domain !== 'formaos.com.au')
    violations.push(`domain=${brand.domain}`);
  if (brand.identity !== 'Compliance Operating System')
    violations.push(`identity=${brand.identity}`);

  if (violations.length) {
    const message = `Brand violation detected. Expected FormaOS defaults. Offending fields: ${violations.join(
      ', ',
    )}. Set BRAND_OVERRIDE_ALLOW=true to bypass (not recommended).`;

    // Throw in development and during build; log error in production runtime
    if (process.env.NODE_ENV !== 'production') {
      throw new Error(message);
    } else {
      // eslint-disable-next-line no-console
      console.error(message);
    }
  }
})();

export type Brand = typeof brand;
