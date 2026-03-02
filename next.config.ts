import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';
import path from 'node:path';

const nextConfig: NextConfig = {
  reactStrictMode: true,
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
