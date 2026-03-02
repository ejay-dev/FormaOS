/**
 * Unit tests for lib/utils.ts
 *
 * Tests the cn() classname merging utility (clsx + tailwind-merge).
 */

import { cn } from '@/lib/utils';

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('handles conditional classes', () => {
    expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz');
  });

  it('handles undefined and null', () => {
    expect(cn('foo', undefined, null, 'bar')).toBe('foo bar');
  });

  it('handles empty string', () => {
    expect(cn('foo', '', 'bar')).toBe('foo bar');
  });

  it('deduplicates conflicting Tailwind classes', () => {
    // tailwind-merge should resolve p-2 vs p-4 to the last one
    expect(cn('p-2', 'p-4')).toBe('p-4');
  });

  it('merges responsive Tailwind variants correctly', () => {
    expect(cn('text-sm', 'md:text-lg')).toBe('text-sm md:text-lg');
  });

  it('resolves conflicting background colors', () => {
    expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500');
  });

  it('handles arrays of class names', () => {
    expect(cn(['foo', 'bar'])).toBe('foo bar');
  });

  it('returns empty string with no args', () => {
    expect(cn()).toBe('');
  });
});
