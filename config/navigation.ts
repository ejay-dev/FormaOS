/**
 * Centralised navigation link definitions.
 * Imported by NavLinks, Footer, and any surface that renders site navigation.
 */

export const primaryLinks = [
  { href: '/', label: 'Home' },
  { href: '/product', label: 'Product' },
  { href: '/features', label: 'Features' },
  { href: '/industries', label: 'Industries' },
  { href: '/security', label: 'Security' },
  { href: '/enterprise', label: 'Enterprise' },
  { href: '/trust', label: 'Trust' },
  { href: '/pricing', label: 'Pricing' },
] as const;

export const outcomeLinks = [
  { href: '/evaluate', label: 'Evaluate' },
  { href: '/prove', label: 'Prove' },
  { href: '/operate', label: 'Operate' },
  { href: '/govern', label: 'Govern' },
] as const;

export const resourceLinks = [
  { href: '/security-review', label: 'Security Review Packet' },
  { href: '/security-review/faq', label: 'Security Review FAQ' },
  { href: '/trust/packet', label: 'Trust Packet (PDF)' },
  { href: '/frameworks', label: 'Framework Coverage' },
  { href: '/integrations', label: 'Integrations' },
  { href: '/customer-stories', label: 'Customer Stories' },
  { href: '/compare', label: 'Compare' },
  { href: '/changelog', label: 'Changelog' },
  { href: '/roadmap', label: 'Roadmap' },
  { href: '/status', label: 'Status' },
  { href: '/documentation', label: 'Documentation' },
  { href: '/about', label: 'About' },
] as const;

export const footerLinks = {
  platform: [
    { href: '/product', label: 'How it works' },
    { href: '/features', label: 'Features' },
    { href: '/industries', label: 'Industries' },
    { href: '/security', label: 'Security' },
    { href: '/frameworks', label: 'Framework Coverage' },
    { href: '/pricing', label: 'Pricing' },
  ],
  useCases: [
    { href: '/use-cases/healthcare', label: 'Healthcare' },
    { href: '/use-cases/ndis-aged-care', label: 'NDIS & Aged Care' },
    { href: '/use-cases/workforce-credentials', label: 'Workforce' },
    { href: '/use-cases/incident-management', label: 'Incidents' },
  ],
  resources: [
    { href: '/documentation', label: 'Documentation' },
    { href: '/blog', label: 'Blog' },
    { href: '/trust', label: 'Trust Center' },
    { href: '/security-review', label: 'Security Review Packet' },
    { href: '/trust/packet', label: 'Trust Packet (PDF)' },
    { href: '/status', label: 'Status' },
    { href: '/changelog', label: 'Changelog' },
    { href: '/roadmap', label: 'Roadmap' },
    { href: '/customer-stories', label: 'Customer Stories' },
    { href: '/compare', label: 'Compare' },
    { href: '/faq', label: 'FAQ' },
  ],
  company: [
    { href: '/about', label: 'About' },
    { href: '/our-story', label: 'Our Story' },
    { href: '/contact', label: 'Contact' },
  ],
  legal: [
    { href: '/legal', label: 'Legal' },
    {
      href: '/legal/privacy',
      label: 'Privacy Policy',
    },
    { href: '/legal/terms', label: 'Terms of Service' },
    { href: '/security', label: 'Security' },
    { href: '/trust', label: 'Assurance Portal' },
  ],
} as const;
