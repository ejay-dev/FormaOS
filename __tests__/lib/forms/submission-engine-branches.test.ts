/**
 * Additional branch tests for lib/forms/submission-engine.ts
 * Covers async CRUD operations not covered by existing test.
 */

function createBuilder(result: any = { data: null, error: null }) {
  const b: Record<string, any> = {};
  [
    'select',
    'insert',
    'update',
    'delete',
    'eq',
    'gte',
    'lte',
    'order',
    'limit',
    'range',
    'single',
    'maybeSingle',
  ].forEach((m) => {
    b[m] = jest.fn(() => b);
  });
  b.then = (resolve: (v: any) => void) => resolve(result);
  return b;
}

function mockDb(result?: any) {
  return {
    from: jest.fn(() =>
      createBuilder(result ?? { data: { id: 's1' }, error: null }),
    ),
  };
}

import type { FormField } from '@/lib/forms/types';
import {
  evaluateCondition,
  isFieldVisible,
  validateSubmission,
  submitForm,
  getSubmission,
  listSubmissions,
  reviewSubmission,
  getSubmissionAnalytics,
} from '@/lib/forms/submission-engine';

describe('validateField edge cases', () => {
  it('validates email field', () => {
    const fields: FormField[] = [
      {
        id: 'email',
        type: 'email',
        label: 'Email',
        order: 0,
        validation: { required: true },
      },
    ];
    const errors = validateSubmission(fields, { email: 'notanemail' });
    expect(errors.length).toBeGreaterThan(0);
  });

  it('passes valid email', () => {
    const fields: FormField[] = [
      { id: 'email', type: 'email', label: 'Email', order: 0 },
    ];
    const errors = validateSubmission(fields, { email: 'user@example.com' });
    expect(errors).toHaveLength(0);
  });

  it('validates number field min/max', () => {
    const fields: FormField[] = [
      {
        id: 'age',
        type: 'number',
        label: 'Age',
        order: 0,
        validation: { min: 18, max: 100 },
      },
    ];
    expect(validateSubmission(fields, { age: '10' }).length).toBeGreaterThan(0);
    expect(validateSubmission(fields, { age: '200' }).length).toBeGreaterThan(
      0,
    );
    expect(validateSubmission(fields, { age: '25' })).toHaveLength(0);
  });

  it('validates number field NaN', () => {
    const fields: FormField[] = [
      { id: 'n', type: 'number', label: 'Num', order: 0 },
    ];
    const errors = validateSubmission(fields, { n: 'abc' });
    expect(errors.length).toBeGreaterThan(0);
  });

  it('validates minLength/maxLength', () => {
    const fields: FormField[] = [
      {
        id: 'name',
        type: 'text',
        label: 'Name',
        order: 0,
        validation: { minLength: 3, maxLength: 10 },
      },
    ];
    expect(validateSubmission(fields, { name: 'ab' }).length).toBeGreaterThan(
      0,
    );
    expect(
      validateSubmission(fields, { name: 'abcdefghijk' }).length,
    ).toBeGreaterThan(0);
    expect(validateSubmission(fields, { name: 'valid' })).toHaveLength(0);
  });

  it('validates pattern with custom message', () => {
    const fields: FormField[] = [
      {
        id: 'code',
        type: 'text',
        label: 'Code',
        order: 0,
        validation: { pattern: '^[A-Z]+$', customMessage: 'Uppercase only' },
      },
    ];
    const errors = validateSubmission(fields, { code: 'abc' });
    expect(errors[0].message).toBe('Uppercase only');
  });

  it('skips pattern validation when pattern is invalid regex', () => {
    const fields: FormField[] = [
      {
        id: 'x',
        type: 'text',
        label: 'X',
        order: 0,
        validation: { pattern: '(?invalid' },
      },
    ];
    const errors = validateSubmission(fields, { x: 'test' });
    expect(errors).toHaveLength(0);
  });

  it('skips validation on empty optional fields', () => {
    const fields: FormField[] = [
      {
        id: 'opt',
        type: 'text',
        label: 'Optional',
        order: 0,
        validation: { minLength: 5 },
      },
    ];
    expect(validateSubmission(fields, { opt: '' })).toHaveLength(0);
  });

  it('uses default required message', () => {
    const fields: FormField[] = [
      {
        id: 'req',
        type: 'text',
        label: 'Name',
        order: 0,
        validation: { required: true },
      },
    ];
    const errors = validateSubmission(fields, { req: '  ' });
    expect(errors[0].message).toBe('Name is required');
  });

  it('uses custom required message', () => {
    const fields: FormField[] = [
      {
        id: 'req',
        type: 'text',
        label: 'Name',
        order: 0,
        validation: { required: true, customMessage: 'Fill this' },
      },
    ];
    const errors = validateSubmission(fields, { req: '' });
    expect(errors[0].message).toBe('Fill this');
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
            value: 'yes',
            action: 'show',
          },
        ],
      },
    ];
    const errors = validateSubmission(fields, { toggle: 'no', hidden: '' });
    expect(errors).toHaveLength(0);
  });
});

describe('evaluateCondition — all operators', () => {
  it('greaterThan', () => {
    const cond = {
      fieldId: 'f1',
      operator: 'greaterThan' as const,
      value: '10',
      action: 'show' as const,
    };
    expect(evaluateCondition(cond, { f1: '15' })).toBe(true);
    expect(evaluateCondition(cond, { f1: '5' })).toBe(false);
  });

  it('lessThan', () => {
    const cond = {
      fieldId: 'f1',
      operator: 'lessThan' as const,
      value: '10',
      action: 'show' as const,
    };
    expect(evaluateCondition(cond, { f1: '5' })).toBe(true);
    expect(evaluateCondition(cond, { f1: '15' })).toBe(false);
  });

  it('contains', () => {
    const cond = {
      fieldId: 'f1',
      operator: 'contains' as const,
      value: 'hello',
      action: 'show' as const,
    };
    expect(evaluateCondition(cond, { f1: 'say hello world' })).toBe(true);
    expect(evaluateCondition(cond, { f1: 'goodbye' })).toBe(false);
  });

  it('default operator returns true', () => {
    const cond = {
      fieldId: 'f1',
      operator: 'unknown' as any,
      value: 'x',
      action: 'show' as const,
    };
    expect(evaluateCondition(cond, { f1: 'whatever' })).toBe(true);
  });
});

describe('isFieldVisible', () => {
  it('returns true when no conditional logic', () => {
    const field: FormField = { id: 'f1', type: 'text', label: 'F1', order: 0 };
    expect(isFieldVisible(field, {})).toBe(true);
  });

  it('hides field when hide condition met', () => {
    const field: FormField = {
      id: 'f1',
      type: 'text',
      label: 'F1',
      order: 0,
      conditionalLogic: [
        { fieldId: 'toggle', operator: 'equals', value: 'yes', action: 'hide' },
      ],
    };
    expect(isFieldVisible(field, { toggle: 'yes' })).toBe(false);
  });

  it('shows field when hide condition not met', () => {
    const field: FormField = {
      id: 'f1',
      type: 'text',
      label: 'F1',
      order: 0,
      conditionalLogic: [
        { fieldId: 'toggle', operator: 'equals', value: 'yes', action: 'hide' },
      ],
    };
    expect(isFieldVisible(field, { toggle: 'no' })).toBe(true);
  });
});

describe('submitForm', () => {
  it('submits valid data', async () => {
    const form = { fields: [], settings: {}, status: 'published' };
    let callCount = 0;
    const db = {
      from: jest.fn(() => {
        callCount++;
        if (callCount === 1) return createBuilder({ data: form, error: null });
        return createBuilder({ data: { id: 's1' }, error: null });
      }),
    };
    const result = await submitForm(db as any, 'form-1', 'org-1', { data: {} });
    expect(result.id).toBe('s1');
  });

  it('throws when form not found', async () => {
    const db = mockDb({ data: null, error: { message: 'not found' } });
    await expect(
      submitForm(db as any, 'f1', 'org-1', { data: {} }),
    ).rejects.toBeDefined();
  });

  it('throws when form not published', async () => {
    const db = mockDb({
      data: { fields: [], settings: {}, status: 'draft' },
      error: null,
    });
    await expect(
      submitForm(db as any, 'f1', 'org-1', { data: {} }),
    ).rejects.toThrow('not accepting');
  });

  it('throws when max submissions reached', async () => {
    const form = {
      fields: [],
      settings: { max_submissions: 1 },
      status: 'published',
    };
    let callCount = 0;
    const db = {
      from: jest.fn(() => {
        callCount++;
        if (callCount === 1) return createBuilder({ data: form, error: null });
        return createBuilder({ data: null, count: 1, error: null });
      }),
    };
    await expect(
      submitForm(db as any, 'f1', 'org-1', { data: {} }),
    ).rejects.toThrow('maximum');
  });

  it('throws validation error on invalid data', async () => {
    const form = {
      fields: [
        {
          id: 'name',
          type: 'text',
          label: 'Name',
          order: 0,
          validation: { required: true },
        },
      ],
      settings: {},
      status: 'published',
    };
    const db = mockDb({ data: form, error: null });
    await expect(
      submitForm(db as any, 'f1', 'org-1', { data: { name: '' } }),
    ).rejects.toThrow('Validation failed');
  });
});

describe('listSubmissions', () => {
  it('lists with defaults', async () => {
    const db = mockDb({ data: [{ id: 's1' }], count: 1, error: null });
    const result = await listSubmissions(db as any, 'f1', 'org-1');
    expect(result.data).toHaveLength(1);
  });

  it('applies status filter', async () => {
    const db = mockDb({ data: [], count: 0, error: null });
    await listSubmissions(db as any, 'f1', 'org-1', { status: 'approved' });
    expect(db.from).toHaveBeenCalled();
  });

  it('applies date filters', async () => {
    const db = mockDb({ data: [], count: 0, error: null });
    await listSubmissions(db as any, 'f1', 'org-1', {
      dateFrom: '2024-01-01',
      dateTo: '2024-12-31',
    });
    expect(db.from).toHaveBeenCalled();
  });
});

describe('reviewSubmission', () => {
  it('approves submission', async () => {
    const db = mockDb({ data: { id: 's1', status: 'approved' }, error: null });
    const result = await reviewSubmission(
      db as any,
      's1',
      'org-1',
      'reviewer-1',
      'approved',
      'Looks good',
    );
    expect(result.status).toBe('approved');
  });
});

describe('getSubmissionAnalytics', () => {
  it('computes analytics', async () => {
    const subs = [
      {
        status: 'submitted',
        created_at: '2024-01-01',
        metadata: { submission_duration_ms: 5000 },
      },
      {
        status: 'approved',
        created_at: '2024-01-02',
        metadata: { submission_duration_ms: 3000 },
      },
      { status: 'submitted', created_at: '2024-01-03', metadata: {} },
    ];
    const db = mockDb({ data: subs, error: null });
    const result = await getSubmissionAnalytics(db as any, 'f1', 'org-1');
    expect(result.total).toBe(3);
    expect(result.byStatus['submitted']).toBe(2);
    expect(result.byStatus['approved']).toBe(1);
    expect(result.averageCompletionTimeMs).toBe(4000);
  });

  it('returns null average when no durations', async () => {
    const subs = [
      { status: 'submitted', created_at: '2024-01-01', metadata: {} },
    ];
    const db = mockDb({ data: subs, error: null });
    const result = await getSubmissionAnalytics(db as any, 'f1', 'org-1');
    expect(result.averageCompletionTimeMs).toBeNull();
  });
});
