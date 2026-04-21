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

export function compliancePlanHref(source: PublicCtaSource) {
  return `/contact?type=compliance-plan&source=${encodeURIComponent(source)}`;
}

export function demoHref(source: PublicCtaSource) {
  return `/contact?type=demo&source=${encodeURIComponent(source)}`;
}

export function salesHref(source: PublicCtaSource) {
  return `/contact?type=sales&source=${encodeURIComponent(source)}`;
}

export function assessmentHref(source: PublicCtaSource) {
  return `/contact?type=assessment&source=${encodeURIComponent(source)}`;
}

export function buyerReviewHref(source: PublicCtaSource) {
  return `/contact?type=procurement&source=${encodeURIComponent(source)}`;
}

export function securityReviewHref(source: PublicCtaSource) {
  return `/contact?type=security-review&source=${encodeURIComponent(source)}`;
}

export function trustPacketHref(source: PublicCtaSource) {
  return `/trust/packet?source=${encodeURIComponent(source)}`;
}
