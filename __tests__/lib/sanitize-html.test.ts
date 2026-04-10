/**
 * Tests for lib/security/sanitize-html.ts
 *
 * Verifies that each sanitization function passes the correct sanitize-html
 * configuration and returns the sanitized result.
 */

// Must use `var` so jest.mock hoisting can reference it
var mockSanitize: jest.Mock;  

jest.mock('sanitize-html', () => {
  mockSanitize = jest.fn((dirty: string) => `clean:${dirty}`);
  return { __esModule: true, default: mockSanitize };
});

import {
  sanitizeHtml,
  sanitizeSnippet,
  sanitizeMarkdown,
} from '@/lib/security/sanitize-html';

beforeEach(() => {
  mockSanitize.mockClear();
});

 
function getConfig(): any {
  return mockSanitize.mock.calls[0][1];
}

describe('sanitizeHtml', () => {
  it('calls sanitize-html and returns the result', () => {
    const result = sanitizeHtml('<b>test</b>');
    expect(mockSanitize).toHaveBeenCalledTimes(1);
    expect(mockSanitize.mock.calls[0][0]).toBe('<b>test</b>');
    expect(result).toBe('clean:<b>test</b>');
  });

  it('allows safe inline and block formatting tags', () => {
    sanitizeHtml('x');
    const config = getConfig();
    expect(config.allowedTags).toEqual(
      expect.arrayContaining([
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
      ]),
    );
  });

  it('does NOT allow img, iframe, script, or form tags', () => {
    sanitizeHtml('');
    const config = getConfig();
    expect(config.allowedTags).not.toContain('img');
    expect(config.allowedTags).not.toContain('iframe');
    expect(config.allowedTags).not.toContain('script');
    expect(config.allowedTags).not.toContain('form');
  });

  it('allows href on links and class on spans', () => {
    sanitizeHtml('');
    const config = getConfig();
    expect(config.allowedAttributes.a).toEqual(
      expect.arrayContaining(['href', 'target', 'rel']),
    );
    expect(config.allowedAttributes.span).toEqual(['class']);
  });

  it('only allows safe URL schemes', () => {
    sanitizeHtml('');
    const config = getConfig();
    expect(config.allowedSchemes).toEqual(['http', 'https', 'mailto']);
  });

  it('discards disallowed tags', () => {
    sanitizeHtml('');
    expect(getConfig().disallowedTagsMode).toBe('discard');
  });

  it('returns empty string for empty input', () => {
    const result = sanitizeHtml('');
    expect(result).toBe('clean:');
  });
});

describe('sanitizeSnippet', () => {
  it('calls sanitize-html and returns the result', () => {
    const result = sanitizeSnippet('<mark>match</mark>');
    expect(mockSanitize).toHaveBeenCalledTimes(1);
    expect(result).toBe('clean:<mark>match</mark>');
  });

  it('only allows mark and basic inline tags', () => {
    sanitizeSnippet('');
    expect(getConfig().allowedTags).toEqual([
      'mark',
      'b',
      'em',
      'strong',
      'span',
    ]);
  });

  it('only allows class attribute on span and mark', () => {
    sanitizeSnippet('');
    const config = getConfig();
    expect(config.allowedAttributes.span).toEqual(['class']);
    expect(config.allowedAttributes.mark).toEqual(['class']);
  });

  it('does NOT allow any URL schemes', () => {
    sanitizeSnippet('');
    expect(getConfig().allowedSchemes).toEqual([]);
  });
});

describe('sanitizeMarkdown', () => {
  it('calls sanitize-html and returns the result', () => {
    const result = sanitizeMarkdown('<h1>Title</h1>');
    expect(mockSanitize).toHaveBeenCalledTimes(1);
    expect(result).toBe('clean:<h1>Title</h1>');
  });

  it('allows structural markdown elements including img and div', () => {
    sanitizeMarkdown('');
    const config = getConfig();
    expect(config.allowedTags).toEqual(
      expect.arrayContaining([
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
        'img',
        'div',
      ]),
    );
  });

  it('allows image attributes on img tags', () => {
    sanitizeMarkdown('');
    const config = getConfig();
    expect(config.allowedAttributes.img).toEqual(
      expect.arrayContaining(['src', 'alt', 'width', 'height']),
    );
  });

  it('allows href on links', () => {
    sanitizeMarkdown('');
    const config = getConfig();
    expect(config.allowedAttributes.a).toEqual(
      expect.arrayContaining(['href', 'target', 'rel']),
    );
  });

  it('does NOT allow script, iframe, or form tags', () => {
    sanitizeMarkdown('');
    const config = getConfig();
    expect(config.allowedTags).not.toContain('script');
    expect(config.allowedTags).not.toContain('iframe');
    expect(config.allowedTags).not.toContain('form');
  });

  it('only allows safe URL schemes', () => {
    sanitizeMarkdown('');
    expect(getConfig().allowedSchemes).toEqual(['http', 'https', 'mailto']);
  });
});
