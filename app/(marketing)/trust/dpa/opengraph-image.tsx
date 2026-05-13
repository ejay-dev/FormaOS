import { renderOg, ogSize, ogContentType } from '../../_og/template';

export const runtime = 'edge';
export const alt = 'FormaOS - Data Processing Agreement';
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return renderOg({
    eyebrow: 'Trust & Assurance',
    headline: 'Data Processing Agreement',
      subhead: 'FormaOS Data Processing Agreement for enterprise customers. Data handling terms aligned with GDPR and the Australian Privacy Act.',
    badges: ['ISO 27001', 'SOC 2', 'GDPR', 'APP'],
    accent: 'emerald',
  });
}
