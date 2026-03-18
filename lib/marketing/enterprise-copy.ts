import { isValidElement, type ReactNode } from 'react';

export type EnterpriseCopySurface = 'immersive_hero' | 'compact_hero';

export type EnterpriseCopyIssueSeverity = 'info' | 'warn';

export interface EnterpriseCopyIssue {
  severity: EnterpriseCopyIssueSeverity;
  surface: EnterpriseCopySurface;
  field:
    | 'badgeText'
    | 'headline'
    | 'subheadline'
    | 'title'
    | 'description'
    | 'primaryCtaLabel'
    | 'secondaryCtaLabel';
  message: string;
}

export const ENTERPRISE_COPY_BUDGETS = {
  immersiveHeroBadgeText: 44,
  immersiveHeroHeadline: 84,
  immersiveHeroSubheadline: 160,
  compactHeroTitle: 56,
  compactHeroDescription: 170,
  ctaLabel: 24,
} as const;

const ENTERPRISE_COPY_WEAK_PHRASES = [
  'everything you need to know',
  'our team is here to help',
  'failure is not an option',
  'not just',
  'designed to be reviewable',
] as const;

function collapseWhitespace(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

export function reactNodeToPlainText(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') {
    return collapseWhitespace(String(node));
  }
  if (Array.isArray(node)) {
    return collapseWhitespace(node.map((item) => reactNodeToPlainText(item)).join(' '));
  }
  if (isValidElement<{ children?: ReactNode }>(node)) {
    return reactNodeToPlainText(node.props.children);
  }
  return '';
}

interface EvaluateEnterpriseCopyInput {
  surface: EnterpriseCopySurface;
  badgeText?: ReactNode;
  headline?: ReactNode;
  subheadline?: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
  primaryCtaLabel?: string;
  secondaryCtaLabel?: string;
}

function pushLengthWarning(
  issues: EnterpriseCopyIssue[],
  input: {
    value: string;
    maxLength: number;
    field: EnterpriseCopyIssue['field'];
    surface: EnterpriseCopySurface;
    message: string;
  },
) {
  if (!input.value || input.value.length <= input.maxLength) return;
  issues.push({
    severity: 'warn',
    surface: input.surface,
    field: input.field,
    message: input.message,
  });
}

function pushWeakPhraseInfo(
  issues: EnterpriseCopyIssue[],
  input: {
    value: string;
    field: EnterpriseCopyIssue['field'];
    surface: EnterpriseCopySurface;
  },
) {
  if (!input.value) return;
  const normalized = input.value.toLowerCase();
  for (const phrase of ENTERPRISE_COPY_WEAK_PHRASES) {
    if (!normalized.includes(phrase)) continue;
    issues.push({
      severity: 'info',
      surface: input.surface,
      field: input.field,
      message: `Copy contains weak enterprise phrasing: "${phrase}".`,
    });
  }
}

export function evaluateEnterpriseCopy(
  input: EvaluateEnterpriseCopyInput,
): EnterpriseCopyIssue[] {
  const issues: EnterpriseCopyIssue[] = [];
  const badgeText = reactNodeToPlainText(input.badgeText ?? '');
  const headline = reactNodeToPlainText(input.headline ?? '');
  const subheadline = reactNodeToPlainText(input.subheadline ?? '');
  const title = reactNodeToPlainText(input.title ?? '');
  const description = reactNodeToPlainText(input.description ?? '');
  const primaryCtaLabel = collapseWhitespace(input.primaryCtaLabel ?? '');
  const secondaryCtaLabel = collapseWhitespace(input.secondaryCtaLabel ?? '');

  if (input.surface === 'immersive_hero') {
    pushLengthWarning(issues, {
      value: badgeText,
      maxLength: ENTERPRISE_COPY_BUDGETS.immersiveHeroBadgeText,
      field: 'badgeText',
      surface: input.surface,
      message: 'Hero badge text is too long for enterprise-scannable hierarchy.',
    });
    pushLengthWarning(issues, {
      value: headline,
      maxLength: ENTERPRISE_COPY_BUDGETS.immersiveHeroHeadline,
      field: 'headline',
      surface: input.surface,
      message: 'Hero headline is too long and may reduce executive clarity.',
    });
    pushLengthWarning(issues, {
      value: subheadline,
      maxLength: ENTERPRISE_COPY_BUDGETS.immersiveHeroSubheadline,
      field: 'subheadline',
      surface: input.surface,
      message: 'Hero subheadline exceeds copy budget for above-the-fold focus.',
    });
    pushWeakPhraseInfo(issues, {
      value: subheadline,
      field: 'subheadline',
      surface: input.surface,
    });
  }

  if (input.surface === 'compact_hero') {
    pushLengthWarning(issues, {
      value: title,
      maxLength: ENTERPRISE_COPY_BUDGETS.compactHeroTitle,
      field: 'title',
      surface: input.surface,
      message: 'Compact hero title is too long for information-page scanning.',
    });
    pushLengthWarning(issues, {
      value: description,
      maxLength: ENTERPRISE_COPY_BUDGETS.compactHeroDescription,
      field: 'description',
      surface: input.surface,
      message: 'Compact hero description exceeds concise enterprise guidance budget.',
    });
    pushWeakPhraseInfo(issues, {
      value: description,
      field: 'description',
      surface: input.surface,
    });
  }

  pushLengthWarning(issues, {
    value: primaryCtaLabel,
    maxLength: ENTERPRISE_COPY_BUDGETS.ctaLabel,
    field: 'primaryCtaLabel',
    surface: input.surface,
    message: 'Primary CTA label is too long for clear action hierarchy.',
  });

  pushLengthWarning(issues, {
    value: secondaryCtaLabel,
    maxLength: ENTERPRISE_COPY_BUDGETS.ctaLabel,
    field: 'secondaryCtaLabel',
    surface: input.surface,
    message: 'Secondary CTA label is too long for clear action hierarchy.',
  });

  return issues;
}
