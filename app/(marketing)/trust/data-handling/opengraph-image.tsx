import { renderOg, ogSize, ogContentType } from '../../_og/template';

export const runtime = 'edge';
export const alt = 'FormaOS - Data Handling';
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return renderOg({
    eyebrow: 'Trust & Assurance',
    headline: 'Data Handling',
      subhead: 'Data handling, retention, and deletion summary for enterprise procurement.',
    badges: ['ISO 27001', 'SOC 2', 'GDPR', 'APP'],
    accent: 'emerald',
  });
}
