import { renderOg, ogSize, ogContentType } from '../_og/template';

export const runtime = 'edge';
export const alt = 'FormaOS - Audit Evidence Management - Immutable Evidence & Audit Trails';
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return renderOg({
    eyebrow: 'Evidence & Audit',
    headline: 'Audit Evidence Management - Immutable Evidence & Audit Trails',
      subhead: 'Capture, organize, and export audit evidence automatically. FormaOS creates immutable audit trails tied to compliance controls,…',
    badges: ['SHA-256', 'Immutable', 'ISO 27001', 'SOC 2'],
    accent: 'cyan',
  });
}
