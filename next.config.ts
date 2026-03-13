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
    ];
  },
  async headers() {
    return [
      {
        // CORS headers for the public REST API v1 (browser-based integrators).
        //
        // Security note: Access-Control-Allow-Origin: * is intentional here.
        // Per the CORS spec, wildcard origin prevents the browser from sending
        // cookies or other credentials — so this does NOT create a CSRF risk.
        // Integrators must authenticate via a Bearer token (Supabase JWT) in the
        // Authorization header; cookie-based sessions do not work cross-origin
        // with a wildcard origin.
        source: '/api/v1/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Authorization, Content-Type, X-Requested-With',
          },
          { key: 'Access-Control-Max-Age', value: '86400' },
        ],
      },
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
            // Content Security Policy for marketing pages (static headers).
            // App routes (/app/*, /admin/*, /auth/*) get nonce-based CSP from proxy.ts.
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' https://*.sentry.io https://*.posthog.com https://js.stripe.com https://vercel.live",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com data:",
              "img-src 'self' data: blob: https://*.supabase.co https://*.supabase.in https://vercel.com",
              "connect-src 'self' https://*.supabase.co https://*.supabase.in wss://*.supabase.co wss://*.supabase.in https://*.sentry.io https://*.posthog.com https://api.stripe.com https://vitals.vercel-insights.com",
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
