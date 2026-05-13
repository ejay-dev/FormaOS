import { renderOg, ogSize, ogContentType } from '../_og/template';

export const runtime = 'edge';
export const alt = 'FormaOS - Terms';
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return renderOg({
    eyebrow: 'Legal',
    headline: 'Terms',
      subhead: 'Terms and conditions for using FormaOS.',
    badges: ['GDPR', 'APP', 'DPA'],
    accent: 'amber',
  });
}
