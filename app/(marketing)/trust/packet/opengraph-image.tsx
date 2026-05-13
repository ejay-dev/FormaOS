import { renderOg, ogSize, ogContentType } from '../../_og/template';

export const runtime = 'edge';
export const alt = 'FormaOS - Vendor Trust Packet';
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return renderOg({
    eyebrow: 'Trust & Assurance',
    headline: 'Vendor Trust Packet',
      subhead: 'Vendor trust packet covering architecture, encryption, identity governance, data handling, and assurance review materials for…',
    badges: ['ISO 27001', 'SOC 2', 'GDPR', 'APP'],
    accent: 'emerald',
  });
}
