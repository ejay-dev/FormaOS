/**
 * FormaOS Security Module — HTML Sanitizer
 *
 * Wraps the `sanitize-html` package to provide safe HTML rendering
 * for any user-generated or externally-sourced content that must
 * be inserted via dangerouslySetInnerHTML.
 *
 * Uses sanitize-html (pure Node.js, no jsdom) so it works in both
 * server components and client components without build issues.
 *
 * Usage:
 *   import { sanitizeHtml } from '@/lib/security/sanitize-html';
 *   <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(untrusted) }} />
 */

import sanitize from 'sanitize-html';

/**
 * Sanitize untrusted HTML, allowing only safe inline formatting tags.
 * Strips all scripts, event handlers, iframes, and dangerous attributes.
 */
export function sanitizeHtml(dirty: string): string {
  return sanitize(dirty, {
    allowedTags: [
      'b',
      'i',
      'em',
      'strong',
      'a',
      'p',
      'br',
      'ul',
      'ol',
      'li',
      'span',
      'mark',
      'code',
      'pre',
      'blockquote',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'table',
      'thead',
      'tbody',
      'tr',
      'th',
      'td',
      'hr',
      'del',
      'sup',
      'sub',
    ],
    allowedAttributes: {
      a: ['href', 'target', 'rel'],
      span: ['class'],
      code: ['class'],
      pre: ['class'],
      '*': ['id'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    disallowedTagsMode: 'discard',
  });
}

/**
 * Sanitize HTML specifically for search snippets —
 * only allows <mark> for highlight and basic inline tags.
 */
export function sanitizeSnippet(dirty: string): string {
  return sanitize(dirty, {
    allowedTags: ['mark', 'b', 'em', 'strong', 'span'],
    allowedAttributes: {
      span: ['class'],
      mark: ['class'],
    },
    allowedSchemes: [],
    disallowedTagsMode: 'discard',
  });
}

/**
 * Sanitize rendered Markdown HTML (for AI chat, rich text previews).
 * Permits structural tags needed for markdown rendering.
 */
export function sanitizeMarkdown(dirty: string): string {
  return sanitize(dirty, {
    allowedTags: [
      'b',
      'i',
      'em',
      'strong',
      'a',
      'p',
      'br',
      'ul',
      'ol',
      'li',
      'span',
      'mark',
      'code',
      'pre',
      'blockquote',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'table',
      'thead',
      'tbody',
      'tr',
      'th',
      'td',
      'hr',
      'del',
      'sup',
      'sub',
      'img',
      'div',
    ],
    allowedAttributes: {
      a: ['href', 'target', 'rel'],
      img: ['src', 'alt', 'width', 'height'],
      span: ['class'],
      div: ['class'],
      code: ['class'],
      pre: ['class'],
      '*': ['id'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    disallowedTagsMode: 'discard',
  });
}
