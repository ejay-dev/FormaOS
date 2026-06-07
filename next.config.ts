import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';
import path from 'node:path';

const isVercelBuild = process.env.VERCEL === '1';
const buildCpuCount = Number(
  process.env.NEXT_BUILD_CPUS ?? (isVercelBuild ? 2 : 4),
);

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    cpus: buildCpuCount,
    staticGenerationMaxConcurrency: isVercelBuild ? 2 : 4,
    staticGenerationMinPagesPerWorker: isVercelBuild ? 8 : 25,
    webpackMemoryOptimizations: true,
    // Tree-shake large icon/animation/chart libraries — reduces JS bundle per page
    optimizePackageImports: ['lucide-react', 'framer-motion', 'recharts'],
  },
  poweredByHeader: false,
  images: {
    formats: ['image/avif', 'image/webp'],
    qualities: [55, 75],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: '**.supabase.in' },
      { protocol: 'https', hostname: '**.googleusercontent.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },

  generateBuildId: async () =>
    process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) ??
    process.env.GIT_COMMIT_SHA?.slice(0, 12) ??
    'local-build',
  outputFileTracingRoot: path.join(__dirname),
  outputFileTracingIncludes: {
    '*': ['framework-packs/*.json'],
    // Include source files so the QA audit runner can inspect them with fs at runtime
    '/api/admin/audit/run': [
      'lib/**/*.ts',
      'lib/**/*.tsx',
      'app/**/*.ts',
      'app/**/*.tsx',
      'components/**/*.tsx',
      'next.config.ts',
      'proxy.ts',
      'tsconfig.json',
      '.env.example',
      'sentry.client.config.ts',
      'sentry.server.config.ts',
      'sentry.edge.config.ts',
      'eslint.config.mjs',
      '.github/workflows/*.yml',
      'supabase/migrations/*.sql',
      'openapi.json',
      'package.json',
    ],
  },
  async redirects() {
    return [
      // Canonical domain: formaos.com.au → www.formaos.com.au
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'formaos.com.au' }],
        destination: 'https://www.formaos.com.au/:path*',
        permanent: true, // 308
      },
      // Legacy privacy paths → canonical
      {
        source: '/privacy',
        destination: '/legal/privacy',
        permanent: true,
      },
      // Canonical docs route: /docs has been intermittently unreliable on some deployments
      {
        source: '/docs',
        destination: '/documentation',
        permanent: true,
      },
      {
        source: '/docs/:path*',
        destination: '/documentation/:path*',
        permanent: true,
      },
      // Legacy auth paths -> canonical auth routes
      {
        source: '/signup',
        destination: '/auth/signup',
        permanent: true,
      },
      {
        source: '/signup/:path*',
        destination: '/auth/signup/:path*',
        permanent: true,
      },
      {
        source: '/admin/organizations',
        destination: '/admin/orgs',
        permanent: true,
      },
      {
        source: '/admin/organisations',
        destination: '/admin/orgs',
        permanent: true,
      },
      // /status was unshipped 2026-05-13 — it claimed "All systems
      // operational" against 0% uptime data. Temporary redirect (307,
      // Next's `permanent: false`) so search engines do not cache the
      // mapping; the route may come back once a real status provider
      // is wired.
      {
        source: '/status',
        destination: '/',
        permanent: false,
      },
      // /compliance and /care surfaced as 404s in the pass-2 dynamic
      // audit (2026-05-13 marketing audit, §11). Neither route was
      // ever built in this repo (no git log, no directory, zero
      // inbound refs), but buyers commonly URL-type these and may
      // arrive from stale external mentions. Redirect to the closest
      // working surface — /trust is the compliance hub the audit
      // identified as the equivalent, /healthcare-compliance is the
      // closest "care" landing per §4.15. Temporary (307) until the
      // routes are intentionally built.
      {
        source: '/compliance',
        destination: '/trust',
        permanent: false,
      },
      {
        source: '/care',
        destination: '/healthcare-compliance',
        permanent: false,
      },
      // URL-cannibalization consolidation (2026-05-14 marketing audit
      // §3 #9). Three healthcare URLs, three NDIS URLs, two finance
      // URLs all targeted overlapping search intents and each carried
      // a self-canonical, so Google could not pick a primary. The
      // industry money pages (/healthcare-compliance, /ndis-providers,
      // /financial-services-compliance) win because they carry the
      // rich IndustryHero + dashboard mock and are the buyer-facing
      // destination. The duplicates 308 to the primary. Permanent so
      // search engines transfer link equity; internal references in
      // this repo were swept to point at canonicals directly so no
      // internal navigation pays a redirect hop.
      {
        source: '/healthcare-compliance-platform',
        destination: '/healthcare-compliance',
        permanent: true,
      },
      {
        source: '/use-cases/healthcare',
        destination: '/healthcare-compliance',
        permanent: true,
      },
      {
        source: '/ndis-compliance-system',
        destination: '/ndis-providers',
        permanent: true,
      },
      {
        source: '/use-cases/ndis-aged-care',
        destination: '/ndis-providers',
        permanent: true,
      },
      {
        source: '/use-cases/financial-services',
        destination: '/financial-services-compliance',
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        // Build assets (JS/CSS chunks, fonts, media) must stay crawlable so
        // Googlebot can render pages, but they should never be *indexed* as
        // standalone documents. Without this, every `/_next/static/chunks/
        // *.js?dpl=…` URL Googlebot discovers lands in Search Console's
        // "Crawled - currently not indexed" bucket (85 such assets as of the
        // 2026-05-30 GSC review), drowning the report and wasting crawl
        // budget. `X-Robots-Tag: noindex` is the render-safe fix — the asset
        // is still fetched for rendering, just not eligible to appear in
        // search. (We deliberately do NOT `Disallow` these in robots.txt;
        // blocking the fetch would break Google's render + Core Web Vitals.)
        source: '/_next/static/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex' }],
      },
      {
        // Security headers for all routes (marketing + app)
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // X-XSS-Protection removed 2026-05-14 (audit row #17). The
          // header is deprecated; modern browsers ignore it. Chrome
          // dropped the auditor in M78, Firefox never honoured it,
          // Safari kept the attribute but tied it to "block" only,
          // which CSP already covers. CSP + Trusted Types are the
          // current defence.
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            // Audit 2026-05-25: HSTS only on Vercel deployments (always
            // HTTPS via the platform's TLS termination). On local prod
            // builds (npm run start over http://localhost) the header
            // poisons the browser HSTS cache and forces Chrome to
            // refuse subsequent http://localhost requests with
            // chrome-error://chromewebdata/, which used to break the
            // SOC2 + a11y compliance suites mid-run.
            key: 'Strict-Transport-Security',
            value: process.env.VERCEL
              ? 'max-age=31536000; includeSubDomains; preload'
              : 'max-age=0',
          },
          {
            key: 'Permissions-Policy',
            value:
              'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
          {
            // Content Security Policy — dormant fallback.
            //
            // proxy.ts now runs for every non-static-asset route (its
            // matcher is a catch-all). The middleware sets a strict
            // nonce-based CSP via `response.headers.set('Content-
            // Security-Policy', ...)` which overrides this static
            // header on every response. This block remains as a
            // belt-and-braces fallback for the (unlikely) case where
            // middleware fails to run — the nonce-less marketing CSP
            // below still keeps `script-src` to known origins.
            //
            // `'unsafe-inline'` is preserved here ONLY for the fallback
            // path because headers() doesn't have request context and
            // can't generate a nonce. In the normal request path
            // proxy.ts's nonce-based CSP applies and JSON-LD scripts
            // emitted via <JsonLd> carry the nonce attribute.
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              `script-src 'self' 'unsafe-inline' https://*.sentry.io https://*.posthog.com https://js.stripe.com${
                process.env.VERCEL_ENV !== 'production' ? ' https://vercel.live' : ''
              }`,
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com data:",
              "img-src 'self' data: blob: https://*.supabase.co https://*.supabase.in https://vercel.com",
              `connect-src 'self' https://*.supabase.co https://*.supabase.in wss://*.supabase.co wss://*.supabase.in https://*.sentry.io https://*.posthog.com https://api.stripe.com https://vitals.vercel-insights.com${
                process.env.VERCEL_ENV !== 'production' ? ' https://vercel.live wss://ws-us3.pusher.com' : ''
              }${
                // Allow a localhost/self-hosted Supabase origin (local dev +
                // E2E) when that's what's configured. No-op in prod (the URL
                // is *.supabase.co), so it doesn't widen the prod policy.
                /^https?:\/\/(localhost|127\.0\.0\.1)/.test(
                  process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
                )
                  ? ' http://127.0.0.1:54321 ws://127.0.0.1:54321 http://localhost:54321 ws://localhost:54321'
                  : ''
              }`,
              'frame-src https://js.stripe.com https://hooks.stripe.com',
              "worker-src 'self' blob:",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

// Wrap with Sentry only in production
const sentryConfig = {
  // Sentry options
  silent: true, // Suppress Sentry build logs
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Upload source maps for better stack traces
  widenClientFileUpload: true,

  // Tree-shake Sentry in dev
  disableLogger: true,

  // Hide source maps from users
  hideSourceMaps: true,
};

export default process.env.NEXT_PUBLIC_SENTRY_DSN
  ? withSentryConfig(nextConfig, sentryConfig)
  : nextConfig;
