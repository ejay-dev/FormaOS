import { renderOg, ogSize, ogContentType } from '../_og/template';

export const runtime = 'edge';
export const alt = 'FormaOS - Legal';
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return renderOg({
    eyebrow: 'Legal',
    headline: 'Legal',
      subhead: 'Legal and compliance resources for FormaOS: Terms, Privacy, DPA summary, and subprocessors.',
    badges: ['GDPR', 'APP', 'DPA'],
    accent: 'amber',
  });
}
