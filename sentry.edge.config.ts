import * as Sentry from '@sentry/nextjs';
import { scrubPiiFromEvent } from '@/lib/sentry/scrub-pii';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Only enable in production
  enabled: process.env.NODE_ENV === 'production',

  // Lower sample rate for edge
  tracesSampleRate: 0.05,

  // Scrub PII from error reports
  beforeSend: scrubPiiFromEvent,

  // Environment
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV,
});
