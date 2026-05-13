import { renderOg, ogSize, ogContentType } from '../_og/template';

export const runtime = 'edge';
export const alt = 'FormaOS - Enterprise Operations Proof';
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return renderOg({
    eyebrow: 'Enterprise',
    headline: 'Enterprise Operations Proof',
      subhead: 'A buyer-facing proof page showing how FormaOS handles admin governance, customer rescue, auditability, and enterprise support…',
    badges: ['SSO', 'SAML 2.0', 'AU-hosted', 'SCIM'],
    accent: 'cyan',
  });
}
