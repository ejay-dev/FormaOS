import { renderOg, ogSize, ogContentType } from '../_og/template';

export const runtime = 'edge';
export const alt = 'FormaOS - Operate Compliance';
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return renderOg({
    eyebrow: 'Compliance OS',
    headline: 'Operate Compliance',
      subhead: 'Operate compliance continuously with accountable workflows, task orchestration, and real-time signals.',
    badges: ['ISO 27001', 'SOC 2', 'NDIS', 'AHPRA'],
    accent: 'cyan',
  });
}
