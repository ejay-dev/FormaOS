import { renderOg, ogSize, ogContentType } from '../_og/template';

export const runtime = 'edge';
export const alt = 'FormaOS - Compliance Operating System';
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return renderOg({
    eyebrow: 'Enterprise',
    headline: 'Compliance Operating System',
      subhead: 'Enterprise compliance management with SAML 2.0 SSO, AU-hosted deployment by default, audit-ready artifacts, and dedicated…',
    badges: ['SSO', 'SAML 2.0', 'AU-hosted', 'SCIM'],
    accent: 'cyan',
  });
}
