import { renderOg, ogSize, ogContentType } from '../_og/template';

export const runtime = 'edge';
export const alt = 'FormaOS - Documentation & Knowledge Base';
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return renderOg({
    eyebrow: 'Resources',
    headline: 'Documentation & Knowledge Base',
      subhead: 'Comprehensive documentation for FormaOS, from getting started guides to advanced API references. Everything you need to master…',
    badges: ['v1 API', 'OpenAPI 3.1'],
    accent: 'violet',
  });
}
