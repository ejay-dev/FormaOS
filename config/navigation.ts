/**
 * Centralised navigation link definitions.
 * Imported by NavLinks, Footer, and any surface that renders site navigation.
 *
 * Header grouping strategy (5 items max):
 *   Platform (dropdown) | Solutions (dropdown) | Trust & Security (dropdown) | Pricing (direct) | Resources (dropdown)
 *
 * "Home" removed — the logo handles that. "Enterprise" moved into Solutions
 * since it's a buyer path, not a product section. "Product" and "Features"
 * merged under Platform. "Security" and "Trust" merged under Trust & Security.
 */

/* ── Header navigation ─────────────────────────────── */

export const platformLinks = [
  { href: '/product', label: 'How It Works' },
  { href: '/features', label: 'Features' },
  { href: '/frameworks', label: 'Framework Coverage' },
  { href: '/integrations', label: 'Integrations' },
] as const;

export const solutionLinks = [
  { href: '/industries', label: 'Industries' },
  { href: '/ndis-providers', label: 'NDIS Providers' },
  { href: '/healthcare-compliance', label: 'Healthcare' },
  { href: '/financial-services-compliance', label: 'Financial Services' },
  { href: '/childcare-compliance', label: 'Childcare' },
  { href: '/construction-compliance', label: 'Construction' },
  { href: '/enterprise', label: 'Enterprise' },
  { href: '/customer-stories', label: 'Customer Stories' },
  { href: '/compare', label: 'Compare' },
] as const;

export const trustLinks = [
  { href: '/security', label: 'Security' },
  { href: '/trust', label: 'Trust Center' },
  { href: '/security-review', label: 'Security Review Packet' },
  { href: '/enterprise-proof', label: 'Enterprise Proof' },
] as const;

export const resourceLinks = [
  { href: '/documentation', label: 'Documentation' },
  { href: '/blog', label: 'Blog' },
  { href: '/about', label: 'About' },
  { href: '/changelog', label: 'Changelog' },
  { href: '/status', label: 'Status' },
  { href: '/faq', label: 'FAQ' },
] as const;

/**
 * Outcome journey links — used in mobile nav and footer.
 * Kept as a separate group but not in the primary desktop nav bar.
 */
export const outcomeLinks = [
  { href: '/evaluate', label: 'Evaluate' },
  { href: '/prove', label: 'Prove' },
  { href: '/operate', label: 'Operate' },
  { href: '/govern', label: 'Govern' },
] as const;

/* ── Legacy re-exports ─────────────────────────────── */

/**
 * @deprecated Use platformLinks / solutionLinks / trustLinks instead.
 * Kept so that any straggling import of `primaryLinks` still compiles.
 */
export const primaryLinks = [
  { href: '/product', label: 'Product' },
  { href: '/features', label: 'Features' },
  { href: '/industries', label: 'Industries' },
  { href: '/security', label: 'Security' },
  { href: '/enterprise', label: 'Enterprise' },
  { href: '/trust', label: 'Trust' },
  { href: '/pricing', label: 'Pricing' },
] as const;

/* ── Footer navigation ─────────────────────────────── */

export const footerLinks = {
  platform: [
    { href: '/product', label: 'How It Works' },
    { href: '/features', label: 'Features' },
    { href: '/frameworks', label: 'Framework Coverage' },
    { href: '/integrations', label: 'Integrations' },
    { href: '/pricing', label: 'Pricing' },
  ],
  solutions: [
    { href: '/industries', label: 'Industries' },
    { href: '/ndis-providers', label: 'NDIS Providers' },
    { href: '/healthcare-compliance', label: 'Healthcare' },
    { href: '/financial-services-compliance', label: 'Financial Services' },
    { href: '/childcare-compliance', label: 'Childcare' },
    { href: '/construction-compliance', label: 'Construction' },
    { href: '/enterprise', label: 'Enterprise' },
    { href: '/customer-stories', label: 'Customer Stories' },
    { href: '/compare', label: 'Compare' },
  ],
  resources: [
    { href: '/documentation', label: 'Documentation' },
    { href: '/blog', label: 'Blog' },
    { href: '/trust', label: 'Trust Center' },
    { href: '/security-review', label: 'Security Review Packet' },
    { href: '/status', label: 'Status' },
    { href: '/changelog', label: 'Changelog' },
    { href: '/faq', label: 'FAQ' },
  ],
  company: [
    { href: '/about', label: 'About' },
    { href: '/our-story', label: 'Our Story' },
    { href: '/contact', label: 'Contact' },
    { href: '/legal', label: 'Legal' },
    { href: '/legal/privacy', label: 'Privacy Policy' },
    { href: '/legal/terms', label: 'Terms of Service' },
  ],
} as const;
