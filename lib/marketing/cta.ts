export const PUBLIC_CTA_LABELS = {
  compliancePlan: 'Get Compliance Plan',
  bookDemo: 'Book Demo',
  talkToSales: 'Talk to Sales',
  startAssessment: 'Start Assessment',
  buyerReview: 'Start Buyer Review',
  securityReview: 'Book Security Review',
  trustPacket: 'Download Trust Packet',
  seeDemo: 'See Demo',
} as const;

// 2026-05-23 (SEO sprint): the `source` parameter was dropped from these
// builders. It was generating 50+ canonicalised URL variants of /contact —
// not an indexing problem (canonicals were correct) but real crawl-budget
// and link-graph noise. Source attribution is now derived from
// document.referrer on the contact page (see ContactPageContentNew).
// Builder arguments are retained for backwards-compatibility with existing
// callsites; they are accepted but ignored.
type PublicCtaSource =
  | 'header_cta'
  | 'footer'
  | 'seo_landing'
  | 'compare'
  | 'use_case'
  | 'industry'
  | 'pricing'
  | 'contact'
  | 'product'
  | 'trust'
  | 'security'
  | 'resource'
  | string;

export function compliancePlanHref(_source?: PublicCtaSource) {
  return `/contact?type=compliance-plan`;
}

export function demoHref(_source?: PublicCtaSource) {
  return `/contact?type=demo`;
}

export function salesHref(_source?: PublicCtaSource) {
  return `/contact?type=sales`;
}

export function assessmentHref(_source?: PublicCtaSource) {
  return `/contact?type=assessment`;
}

export function buyerReviewHref(_source?: PublicCtaSource) {
  return `/contact?type=procurement`;
}

export function securityReviewHref(_source?: PublicCtaSource) {
  return `/contact?type=security-review`;
}

export function trustPacketHref(_source?: PublicCtaSource) {
  return `/trust/packet`;
}
