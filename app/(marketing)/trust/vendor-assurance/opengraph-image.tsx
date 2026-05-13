import { renderOg, ogSize, ogContentType } from '../../_og/template';

export const runtime = 'edge';
export const alt = 'FormaOS - Vendor Assurance';
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return renderOg({
    eyebrow: 'Trust & Assurance',
    headline: 'Vendor Assurance',
      subhead: 'Vendor assurance process, independent assessment approach, and enterprise review materials for buyers evaluating FormaOS.',
    badges: ['ISO 27001', 'SOC 2', 'GDPR', 'APP'],
    accent: 'emerald',
  });
}
