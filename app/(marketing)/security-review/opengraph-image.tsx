import { renderOg, ogSize, ogContentType } from '../_og/template';

export const runtime = 'edge';
export const alt = 'FormaOS - Security Review Packet';
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return renderOg({
    eyebrow: 'Security Review',
    headline: 'Security Review Packet',
      subhead: 'Procurement-ready security review walkthrough: architecture, data handling, access controls, audit logging, and operational…',
    badges: ['ISO 27001', 'SOC 2', 'Pen-tested'],
    accent: 'emerald',
  });
}
