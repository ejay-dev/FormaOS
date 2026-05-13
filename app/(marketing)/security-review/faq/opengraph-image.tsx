import { renderOg, ogSize, ogContentType } from '../../_og/template';

export const runtime = 'edge';
export const alt = 'FormaOS - Security Review FAQ';
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return renderOg({
    eyebrow: 'Security Review',
    headline: 'Security Review FAQ',
      subhead: 'Enterprise security review FAQ for procurement, security, and compliance stakeholders evaluating FormaOS.',
    badges: ['ISO 27001', 'SOC 2', 'Pen-tested'],
    accent: 'emerald',
  });
}
