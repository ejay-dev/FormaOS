/**
 * Branch-coverage tests for lib/marketing/enterprise-copy.ts
 * Targets 39 uncovered branches
 */

import {
  evaluateEnterpriseCopy,
  reactNodeToPlainText,
  ENTERPRISE_COPY_BUDGETS,
} from '@/lib/marketing/enterprise-copy';
import React from 'react';

describe('enterprise-copy branches', () => {
  describe('reactNodeToPlainText', () => {
    it('returns empty for null', () => {
      expect(reactNodeToPlainText(null)).toBe('');
    });
    it('returns empty for undefined', () => {
      expect(reactNodeToPlainText(undefined)).toBe('');
    });
    it('returns empty for boolean', () => {
      expect(reactNodeToPlainText(true)).toBe('');
      expect(reactNodeToPlainText(false)).toBe('');
    });
    it('returns string as-is (trimmed)', () => {
      expect(reactNodeToPlainText('  hello world  ')).toBe('hello world');
    });
    it('returns number as string', () => {
      expect(reactNodeToPlainText(42)).toBe('42');
    });
    it('collapses whitespace in arrays', () => {
      expect(reactNodeToPlainText(['a', '  b  ', 'c'])).toBe('a b c');
    });
    it('extracts text from React element', () => {
      const el = React.createElement('span', null, 'hello');
      expect(reactNodeToPlainText(el)).toBe('hello');
    });
    it('extracts text from nested React elements', () => {
      const el = React.createElement(
        'div',
        null,
        React.createElement('span', null, 'hello '),
        React.createElement('b', null, 'world'),
      );
      expect(reactNodeToPlainText(el)).toBe('hello world');
    });
  });

  describe('evaluateEnterpriseCopy - immersive_hero', () => {
    it('returns no issues for short copy', () => {
      const issues = evaluateEnterpriseCopy({
        surface: 'immersive_hero',
        badgeText: 'New',
        headline: 'Short',
        subheadline: 'Brief',
      });
      expect(issues).toEqual([]);
    });

    it('warns when badge text exceeds budget', () => {
      const issues = evaluateEnterpriseCopy({
        surface: 'immersive_hero',
        badgeText: 'A'.repeat(
          ENTERPRISE_COPY_BUDGETS.immersiveHeroBadgeText + 10,
        ),
      });
      expect(
        issues.some((i) => i.field === 'badgeText' && i.severity === 'warn'),
      ).toBe(true);
    });

    it('warns when headline exceeds budget', () => {
      const issues = evaluateEnterpriseCopy({
        surface: 'immersive_hero',
        headline: 'A'.repeat(
          ENTERPRISE_COPY_BUDGETS.immersiveHeroHeadline + 10,
        ),
      });
      expect(
        issues.some((i) => i.field === 'headline' && i.severity === 'warn'),
      ).toBe(true);
    });

    it('warns when subheadline exceeds budget', () => {
      const issues = evaluateEnterpriseCopy({
        surface: 'immersive_hero',
        subheadline: 'A'.repeat(
          ENTERPRISE_COPY_BUDGETS.immersiveHeroSubheadline + 10,
        ),
      });
      expect(
        issues.some((i) => i.field === 'subheadline' && i.severity === 'warn'),
      ).toBe(true);
    });

    it('detects weak phrase in subheadline', () => {
      const issues = evaluateEnterpriseCopy({
        surface: 'immersive_hero',
        subheadline: 'This is everything you need to know about compliance',
      });
      expect(
        issues.some((i) => i.field === 'subheadline' && i.severity === 'info'),
      ).toBe(true);
    });

    it('detects multiple weak phrases', () => {
      const issues = evaluateEnterpriseCopy({
        surface: 'immersive_hero',
        subheadline:
          'Our team is here to help because failure is not an option',
      });
      const infos = issues.filter((i) => i.severity === 'info');
      expect(infos.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('evaluateEnterpriseCopy - compact_hero', () => {
    it('returns no issues for short copy', () => {
      const issues = evaluateEnterpriseCopy({
        surface: 'compact_hero',
        title: 'Short',
        description: 'Brief',
      });
      expect(issues).toEqual([]);
    });

    it('warns when title exceeds budget', () => {
      const issues = evaluateEnterpriseCopy({
        surface: 'compact_hero',
        title: 'A'.repeat(ENTERPRISE_COPY_BUDGETS.compactHeroTitle + 10),
      });
      expect(
        issues.some((i) => i.field === 'title' && i.severity === 'warn'),
      ).toBe(true);
    });

    it('warns when description exceeds budget', () => {
      const issues = evaluateEnterpriseCopy({
        surface: 'compact_hero',
        description: 'A'.repeat(
          ENTERPRISE_COPY_BUDGETS.compactHeroDescription + 10,
        ),
      });
      expect(
        issues.some((i) => i.field === 'description' && i.severity === 'warn'),
      ).toBe(true);
    });

    it('detects weak phrase in description', () => {
      const issues = evaluateEnterpriseCopy({
        surface: 'compact_hero',
        description:
          'Not just another compliance tool, designed to be reviewable',
      });
      const infos = issues.filter((i) => i.severity === 'info');
      expect(infos.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('evaluateEnterpriseCopy - CTA labels', () => {
    it('warns when primary CTA label exceeds budget', () => {
      const issues = evaluateEnterpriseCopy({
        surface: 'immersive_hero',
        primaryCtaLabel: 'A'.repeat(ENTERPRISE_COPY_BUDGETS.ctaLabel + 10),
      });
      expect(
        issues.some(
          (i) => i.field === 'primaryCtaLabel' && i.severity === 'warn',
        ),
      ).toBe(true);
    });

    it('warns when secondary CTA label exceeds budget', () => {
      const issues = evaluateEnterpriseCopy({
        surface: 'compact_hero',
        secondaryCtaLabel: 'A'.repeat(ENTERPRISE_COPY_BUDGETS.ctaLabel + 10),
      });
      expect(
        issues.some(
          (i) => i.field === 'secondaryCtaLabel' && i.severity === 'warn',
        ),
      ).toBe(true);
    });

    it('no warn for short CTA labels', () => {
      const issues = evaluateEnterpriseCopy({
        surface: 'immersive_hero',
        primaryCtaLabel: 'Get Started',
        secondaryCtaLabel: 'Learn More',
      });
      expect(issues.filter((i) => i.field === 'primaryCtaLabel')).toHaveLength(
        0,
      );
      expect(
        issues.filter((i) => i.field === 'secondaryCtaLabel'),
      ).toHaveLength(0);
    });
  });
});
