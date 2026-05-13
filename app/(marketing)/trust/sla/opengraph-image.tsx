import { renderOg, ogSize, ogContentType } from '../../_og/template';

export const runtime = 'edge';
export const alt = 'FormaOS - SLA';
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return renderOg({
    eyebrow: 'Trust & Assurance',
    headline: 'SLA',
      subhead: 'Service levels, support expectations, and availability review guidance for FormaOS plans.',
    badges: ['ISO 27001', 'SOC 2', 'GDPR', 'APP'],
    accent: 'emerald',
  });
}
