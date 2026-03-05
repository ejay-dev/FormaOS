import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';
import path from 'node:path';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    // Tree-shake large icon/animation/chart libraries — reduces JS bundle per page
    optimizePackageImports: [
      'lucide-react',
      'framer-motion',
      'recharts',
      '@react-three/drei',
      '@react-three/fiber',
    ],
  },
  poweredByHeader: false,

  generateBuildId: async () =>
    process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) ??
    process.env.GIT_COMMIT_SHA?.slice(0, 12) ??
    'local-build',
  outputFileTracingRoot: path.join(__dirname),
  outputFileTracingIncludes: {
    '*': ['framework-packs/*.json'],
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
    ];
  },
  async headers() {
    return [
      {
        // Security headers for all routes (marketing + app)
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            key: 'Permissions-Policy',
            value:
              'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
          {
            // Content Security Policy — permissive mode to allow all existing
            // integrations (Supabase, Sentry, PostHog, Stripe, Vercel, Google Fonts)
            // without breaking anything. Tighten per-environment as needed.
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // Scripts: self + inline (Next.js requires unsafe-inline for RSC hydration)
              // unsafe-eval removed — Next.js 15 no longer requires it for production builds.
              "script-src 'self' 'unsafe-inline' https://*.sentry.io https://*.posthog.com https://js.stripe.com https://vercel.live",
              // Styles: self + inline (Tailwind CSS-in-JS requires this)
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              // Fonts: Google Fonts
              "font-src 'self' https://fonts.gstatic.com data:",
              // Images: self + data URIs + blob + Supabase storage
              "img-src 'self' data: blob: https://*.supabase.co https://*.supabase.in https://vercel.com",
              // Connect: self + all FormaOS backends
              "connect-src 'self' https://*.supabase.co https://*.supabase.in wss://*.supabase.co wss://*.supabase.in https://*.sentry.io https://*.posthog.com https://api.stripe.com https://vitals.vercel-insights.com",
              // Frames: Stripe only (for payment elements)
              'frame-src https://js.stripe.com https://hooks.stripe.com',
              // Workers: self + blob (for Sentry)
              "worker-src 'self' blob:",
              // Block object/embed entirely
              "object-src 'none'",
              // Only allow HTTPS base URIs
              "base-uri 'self'",
              // Form submissions to self only
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
