// Centralized brand configuration and guard
// Single source of truth for all branding across the app
import {
  DISTINCT_FRAMEWORK_COUNT,
  DISTINCT_FRAMEWORK_NAMES,
  FRAMEWORK_CONTROL_COUNT,
  FRAMEWORK_PACK_COUNT,
  FRAMEWORK_PACK_NAMES,
} from '@/lib/marketing/claims';

export const brand = {
  appName: 'FormaOS',
  marketingName: 'FormaOS',
  domain: 'formaos.com.au',
  identity: 'Compliance Operating System',
  logo: {
    // "FO" monogram for square slots (favicon, app icons, email header img).
    mark: '/brand/formaos-mark.svg',
    markTile: '/brand/formaos-mark-tile.svg', // white-on-charcoal rounded tile (icons)
    markTileLight: '/brand/formaos-mark-tile-light.svg',
    // Horizontal FORMAOS wordmark (currentColor, tints per surface).
    wordmark: '/brand/formaos-wordmark.svg',
    wordmarkWhite: '/brand/master/formaos-wordmark-white-on-dark.svg',
    wordmarkGrey: '/brand/master/formaos-wordmark-grey.svg',
    // Legacy field names retained so existing consumers don't break.
    markLight: '/brand/formaos-mark-tile-light.svg',
    markWhite: '/brand/formaos-mark-tile.svg',
    wordmarkLight: '/brand/formaos-wordmark.svg',
    wordmarkDark: '/brand/formaos-wordmark.svg',
    favicon: '/favicon.ico',
    icon: '/icon.svg',
    appleTouchIcon: '/apple-touch-icon.png',
  },
  email: {
    // Canonical visible support address. Aligns with the JSON-LD
    // contactPoint.email used across every marketing page; before
    // 2026-05-13 the visible footer + several marketing pages still
    // showed Formaos.team@gmail.com which read as a Gmail support
    // address to enterprise vendor-assurance reviewers.
    contactEmail:
      process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'support@formaos.com.au',
    senderName: 'FormaOS',
    senderEmail: process.env.RESEND_FROM_EMAIL || 'support@formaos.com.au',
    // Billing/procurement contact shown on paid surfaces. The billing page,
    // checkout error copy and plan comparison previously printed the raw
    // Formaos.team@gmail.com address — a consumer mailbox on the screen that
    // asks an enterprise buyer for money, which reads as an unvetted vendor
    // during procurement review.
    billingEmail:
      process.env.NEXT_PUBLIC_BILLING_EMAIL || 'billing@formaos.com.au',
  },
  // Canonical company address. Mirrors the JSON-LD PostalAddress
  // emitted from lib/seo.ts so visible copy and structured data can't
  // drift again. Adelaide, SA is the registered office.
  address: {
    locality: 'Adelaide',
    region: 'SA',
    country: 'Australia',
  },
  seo: {
    defaultTitle: 'FormaOS: Compliance Operating System',
    description:
      'FormaOS is the Compliance Operating System for regulated organizations: unify governance, evidence, and audits in one platform.',
    // Strip surrounding whitespace at the constant source. The deploy
    // env historically carried a trailing `\n` that propagated into
    // sitemap.xml, robots.txt, and JSON-LD `<loc>` / `url` / `logo`
    // fields on every marketing page, Lighthouse SEO 83 universal,
    // search engines drop the entries. Trimming here is one fix for
    // all consumers; `lib/seo.ts` still strips the trailing slash on
    // top of this for path concatenation.
    siteUrl: (
      process.env.NEXT_PUBLIC_SITE_URL || 'https://www.formaos.com.au'
    ).trim(),
    appUrl: (
      process.env.NEXT_PUBLIC_APP_URL || 'https://app.formaos.com.au'
    ).trim(),
    ogImage: '/og-image.png',
  },
  /**
   * Framework packs shipped and mapped with live controls.
   *
   * Derived from PACK_REGISTRY and the pack files rather than typed by
   * hand: the hardcoded values here had fallen to 8 packs / 70 controls
   * while the product shipped 11 packs / 271 controls, and pages that
   * bypassed this constant published four different pack counts between
   * them. See lib/marketing/claims.ts.
   */
  frameworks: {
    /** Distinct standards covered — use wherever copy says "frameworks". */
    count: DISTINCT_FRAMEWORK_COUNT,
    /** Installable packs — use wherever copy says "packs". */
    packCount: FRAMEWORK_PACK_COUNT,
    controlCount: FRAMEWORK_CONTROL_COUNT,
    packs: FRAMEWORK_PACK_NAMES,
    names: DISTINCT_FRAMEWORK_NAMES,
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
      console.error(message);
    }
  }
})();

export type Brand = typeof brand;
