import type { LucideIcon } from 'lucide-react';
import {
  Database,
  Cloud,
  Server,
  BarChart3,
  Mail,
  Shield,
  Activity,
} from 'lucide-react';

export type TrustSubprocessor = {
  name: string;
  purpose: string;
  location: string;
  category: string;
  icon: LucideIcon;
};

/**
 * Public subprocessor list.
 *
 * Important: only include vendors that are actually used in the deployed system.
 * Do not list "possible" or "roadmap" vendors here.
 */
export const TRUST_SUBPROCESSORS: TrustSubprocessor[] = [
  {
    name: 'Supabase (AWS)',
    purpose: 'Database hosting, authentication, and real-time data services',
    location: 'Region configured for the FormaOS Supabase project',
    icon: Database,
    category: 'Infrastructure',
  },
  {
    name: 'Vercel',
    purpose: 'Application hosting and CDN delivery',
    location: 'Global',
    icon: Cloud,
    category: 'Infrastructure',
  },
  {
    name: 'Upstash',
    purpose: 'Redis (rate limiting, caching, and queue processing)',
    location: 'Global',
    icon: Server,
    category: 'Infrastructure',
  },
  {
    name: 'Stripe',
    purpose: 'Payment processing and subscription management',
    location: 'United States',
    icon: BarChart3,
    category: 'Payments',
  },
  {
    name: 'Resend',
    purpose: 'Transactional email delivery',
    location: 'United States',
    icon: Mail,
    category: 'Communications',
  },
  {
    name: 'Sentry',
    purpose: 'Error monitoring and performance tracking',
    location: 'United States',
    icon: Shield,
    category: 'Monitoring',
  },
  {
    name: 'PostHog',
    purpose: 'Product analytics (configured per environment)',
    location: 'Varies (provider dependent)',
    icon: Activity,
    category: 'Analytics',
  },
];
