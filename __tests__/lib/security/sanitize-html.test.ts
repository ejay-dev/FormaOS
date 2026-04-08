/**
 * Tests for lib/security/sanitize-html.ts
 */

import {
  sanitizeHtml,
  sanitizeSnippet,
  sanitizeMarkdown,
} from '@/lib/security/sanitize-html';

describe('sanitizeHtml', () => {
  it('allows safe formatting tags', () => {
    const input = '<p><strong>Bold</strong> and <em>italic</em></p>';
    const result = sanitizeHtml(input);
    expect(result).toContain('<strong>Bold</strong>');
    expect(result).toContain('<em>italic</em>');
  });

  it('allows links with href, target, rel', () => {
    const input =
      '<a href="https://example.com" target="_blank" rel="noopener">Link</a>';
    const result = sanitizeHtml(input);
    expect(result).toContain('href="https://example.com"');
    expect(result).toContain('target="_blank"');
  });

  it('strips script tags', () => {
    const input = '<p>Hello</p><script>alert("xss")</script>';
    const result = sanitizeHtml(input);
    expect(result).not.toContain('<script>');
    expect(result).not.toContain('alert');
    expect(result).toContain('Hello');
  });

  it('strips event handlers', () => {
    const input = '<p onclick="alert(1)">Click me</p>';
    const result = sanitizeHtml(input);
    expect(result).not.toContain('onclick');
    expect(result).toContain('Click me');
  });

  it('strips iframe tags', () => {
    const input = '<iframe src="https://evil.com"></iframe>';
    const result = sanitizeHtml(input);
    expect(result).not.toContain('<iframe');
  });

  it('blocks javascript: URL scheme', () => {
    const input = '<a href="javascript:alert(1)">Click</a>';
    const result = sanitizeHtml(input);
    expect(result).not.toContain('javascript:');
  });

  it('allows table tags', () => {
    const input =
      '<table><thead><tr><th>Header</th></tr></thead><tbody><tr><td>Cell</td></tr></tbody></table>';
    const result = sanitizeHtml(input);
    expect(result).toContain('<table>');
    expect(result).toContain('<th>Header</th>');
    expect(result).toContain('<td>Cell</td>');
  });

  it('allows list tags', () => {
    const input = '<ul><li>Item 1</li><li>Item 2</li></ul>';
    const result = sanitizeHtml(input);
    expect(result).toContain('<li>Item 1</li>');
  });

  it('allows heading tags', () => {
    const input = '<h1>Title</h1><h2>Subtitle</h2><h3>Section</h3>';
    const result = sanitizeHtml(input);
    expect(result).toContain('<h1>Title</h1>');
    expect(result).toContain('<h2>Subtitle</h2>');
  });

  it('allows code and pre tags', () => {
    const input = '<pre class="language-js"><code>const x = 1;</code></pre>';
    const result = sanitizeHtml(input);
    expect(result).toContain('<code>const x = 1;</code>');
  });

  it('allows mailto links', () => {
    const input = '<a href="mailto:test@example.com">Email</a>';
    const result = sanitizeHtml(input);
    expect(result).toContain('mailto:test@example.com');
  });

  it('strips img tags (not allowed in basic sanitize)', () => {
    const input = '<img src="https://example.com/img.png" />';
    const result = sanitizeHtml(input);
    expect(result).not.toContain('<img');
  });

  it('strips style tags', () => {
    const input = '<style>body { color: red; }</style><p>Text</p>';
    const result = sanitizeHtml(input);
    expect(result).not.toContain('<style');
    expect(result).toContain('Text');
  });

  it('allows id attribute on any tag', () => {
    const input = '<p id="intro">Hello</p>';
    const result = sanitizeHtml(input);
    expect(result).toContain('id="intro"');
  });

  it('strips data-* attributes', () => {
    const input = '<p data-value="secret">Text</p>';
    const result = sanitizeHtml(input);
    expect(result).not.toContain('data-value');
  });
});

describe('sanitizeSnippet', () => {
  it('allows mark tag for highlights', () => {
    const input = '<mark>highlighted</mark> text';
    const result = sanitizeSnippet(input);
    expect(result).toContain('<mark>highlighted</mark>');
  });

  it('allows basic inline tags', () => {
    const input = '<b>bold</b> <em>italic</em> <strong>strong</strong>';
    const result = sanitizeSnippet(input);
    expect(result).toContain('<b>bold</b>');
    expect(result).toContain('<em>italic</em>');
  });

  it('strips block-level tags', () => {
    const input = '<p>paragraph</p><div>div</div>';
    const result = sanitizeSnippet(input);
    expect(result).not.toContain('<p>');
    expect(result).not.toContain('<div>');
    expect(result).toContain('paragraph');
  });

  it('strips links', () => {
    const input = '<a href="https://evil.com">Click</a>';
    const result = sanitizeSnippet(input);
    expect(result).not.toContain('<a');
    expect(result).toContain('Click');
  });

  it('strips scripts', () => {
    const input = '<script>alert(1)</script><mark>safe</mark>';
    const result = sanitizeSnippet(input);
    expect(result).not.toContain('<script');
    expect(result).toContain('<mark>safe</mark>');
  });
});

describe('sanitizeMarkdown', () => {
  it('allows img tags with src, alt, width, height', () => {
    const input =
      '<img src="https://example.com/img.png" alt="desc" width="100" height="50" />';
    const result = sanitizeMarkdown(input);
    expect(result).toContain('<img');
    expect(result).toContain('src="https://example.com/img.png"');
    expect(result).toContain('alt="desc"');
  });

  it('allows div tags with class', () => {
    const input = '<div class="code-block">content</div>';
    const result = sanitizeMarkdown(input);
    expect(result).toContain('<div');
    expect(result).toContain('class="code-block"');
  });

  it('allows the same tags as sanitizeHtml plus img and div', () => {
    const input =
      '<table><tr><td>Cell</td></tr></table><img src="https://x.com/a.png" />';
    const result = sanitizeMarkdown(input);
    expect(result).toContain('<table>');
    expect(result).toContain('<img');
  });

  it('strips script tags', () => {
    const input = '<script>alert(1)</script><p>safe</p>';
    const result = sanitizeMarkdown(input);
    expect(result).not.toContain('<script');
    expect(result).toContain('<p>safe</p>');
  });

  it('strips event handlers on img', () => {
    const input = '<img src="x.png" onerror="alert(1)" />';
    const result = sanitizeMarkdown(input);
    expect(result).not.toContain('onerror');
  });

  it('blocks javascript: on img src', () => {
    const input = '<img src="javascript:alert(1)" />';
    const result = sanitizeMarkdown(input);
    expect(result).not.toContain('javascript:');
  });
});
