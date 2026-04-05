/**
 * Tests for lib/forms/submission-engine.ts
 * Covers: evaluateCondition, isFieldVisible, validateSubmission (pure logic only).
 */

import type { FormField, ConditionalLogic } from '@/lib/forms/types';
import {
  evaluateCondition,
  isFieldVisible,
  validateSubmission,
} from '@/lib/forms/submission-engine';

describe('evaluateCondition', () => {
  const cond = (
    operator: ConditionalLogic['operator'],
    value: string,
  ): ConditionalLogic => ({
    fieldId: 'field1',
    operator,
    value,
    action: 'show',
  });

  it('equals — matches', () => {
    expect(evaluateCondition(cond('equals', 'yes'), { field1: 'yes' })).toBe(
      true,
    );
  });

  it('equals — does not match', () => {
    expect(evaluateCondition(cond('equals', 'yes'), { field1: 'no' })).toBe(
      false,
    );
  });

  it('notEquals — matches', () => {
    expect(evaluateCondition(cond('notEquals', 'yes'), { field1: 'no' })).toBe(
      true,
    );
  });

  it('contains — matches', () => {
    expect(
      evaluateCondition(cond('contains', 'ello'), { field1: 'hello' }),
    ).toBe(true);
  });

  it('greaterThan — matches', () => {
    expect(evaluateCondition(cond('greaterThan', '10'), { field1: '20' })).toBe(
      true,
    );
  });

  it('greaterThan — does not match', () => {
    expect(evaluateCondition(cond('greaterThan', '10'), { field1: '5' })).toBe(
      false,
    );
  });

  it('lessThan — matches', () => {
    expect(evaluateCondition(cond('lessThan', '10'), { field1: '5' })).toBe(
      true,
    );
  });

  it('treats missing field as empty string', () => {
    expect(evaluateCondition(cond('equals', ''), {})).toBe(true);
  });

  it('defaults to true for unknown operator', () => {
    expect(
      evaluateCondition(cond('unknown' as any, 'x'), { field1: 'y' }),
    ).toBe(true);
  });
});

describe('isFieldVisible', () => {
  const field = (logic: ConditionalLogic[]): FormField => ({
    id: 'target',
    type: 'text',
    label: 'Target',
    order: 0,
    conditionalLogic: logic,
  });

  it('visible by default when no conditions', () => {
    expect(isFieldVisible(field([]), { field1: 'x' })).toBe(true);
  });

  it('visible when show condition is met', () => {
    const f = field([
      { fieldId: 'field1', operator: 'equals', value: 'yes', action: 'show' },
    ]);
    expect(isFieldVisible(f, { field1: 'yes' })).toBe(true);
  });

  it('hidden when show condition is NOT met', () => {
    const f = field([
      { fieldId: 'field1', operator: 'equals', value: 'yes', action: 'show' },
    ]);
    expect(isFieldVisible(f, { field1: 'no' })).toBe(false);
  });

  it('hidden when hide condition is met', () => {
    const f = field([
      { fieldId: 'field1', operator: 'equals', value: 'yes', action: 'hide' },
    ]);
    expect(isFieldVisible(f, { field1: 'yes' })).toBe(false);
  });

  it('visible when hide condition is NOT met', () => {
    const f = field([
      { fieldId: 'field1', operator: 'equals', value: 'yes', action: 'hide' },
    ]);
    expect(isFieldVisible(f, { field1: 'no' })).toBe(true);
  });
});

describe('validateSubmission', () => {
  it('returns no errors for valid data', () => {
    const fields: FormField[] = [
      {
        id: 'name',
        type: 'text',
        label: 'Name',
        order: 0,
        validation: { required: true },
      },
    ];
    expect(validateSubmission(fields, { name: 'Alice' })).toEqual([]);
  });

  it('returns error for missing required field', () => {
    const fields: FormField[] = [
      {
        id: 'name',
        type: 'text',
        label: 'Name',
        order: 0,
        validation: { required: true },
      },
    ];
    const errors = validateSubmission(fields, { name: '' });
    expect(errors).toHaveLength(1);
    expect(errors[0].fieldId).toBe('name');
    expect(errors[0].message).toContain('Name');
  });

  it('skips hidden fields', () => {
    const fields: FormField[] = [
      {
        id: 'hidden',
        type: 'text',
        label: 'Hidden',
        order: 0,
        validation: { required: true },
        conditionalLogic: [
          {
            fieldId: 'toggle',
            operator: 'equals',
            value: 'show',
            action: 'show',
          },
        ],
      },
    ];
    // toggle != 'show' → field hidden → not validated
    const errors = validateSubmission(fields, { toggle: 'hide', hidden: '' });
    expect(errors).toHaveLength(0);
  });

  it('validates email field type', () => {
    const fields: FormField[] = [
      { id: 'email', type: 'email', label: 'Email', order: 0 },
    ];
    const errors = validateSubmission(fields, { email: 'not-an-email' });
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain('valid email');
  });

  it('validates number min/max', () => {
    const fields: FormField[] = [
      {
        id: 'age',
        type: 'number',
        label: 'Age',
        order: 0,
        validation: { min: 18, max: 120 },
      },
    ];
    const errors = validateSubmission(fields, { age: '10' });
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain('at least 18');
  });

  it('validates minLength', () => {
    const fields: FormField[] = [
      {
        id: 'bio',
        type: 'text',
        label: 'Bio',
        order: 0,
        validation: { minLength: 10 },
      },
    ];
    const errors = validateSubmission(fields, { bio: 'short' });
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain('at least 10');
  });

  it('validates maxLength', () => {
    const fields: FormField[] = [
      {
        id: 'code',
        type: 'text',
        label: 'Code',
        order: 0,
        validation: { maxLength: 5 },
      },
    ];
    const errors = validateSubmission(fields, { code: 'toolong' });
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain('at most 5');
  });

  it('validates pattern', () => {
    const fields: FormField[] = [
      {
        id: 'zip',
        type: 'text',
        label: 'Zip',
        order: 0,
        validation: { pattern: '^\\d{5}$', customMessage: 'Must be 5 digits' },
      },
    ];
    const errors = validateSubmission(fields, { zip: 'abc' });
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toBe('Must be 5 digits');
  });

  it('passes valid pattern', () => {
    const fields: FormField[] = [
      {
        id: 'zip',
        type: 'text',
        label: 'Zip',
        order: 0,
        validation: { pattern: '^\\d{5}$' },
      },
    ];
    expect(validateSubmission(fields, { zip: '12345' })).toEqual([]);
  });
});
