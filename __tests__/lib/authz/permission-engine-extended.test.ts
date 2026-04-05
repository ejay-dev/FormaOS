/**
 * Tests for lib/authz/permission-engine.ts — pure function getPermissionDiff
 * and constant PERMISSION_MODULES
 */

import {
  getPermissionDiff,
  PERMISSION_MODULES,
} from '@/lib/authz/permission-engine';

function makeMatrix(value: boolean): any {
  return Object.fromEntries(
    PERMISSION_MODULES.map((m) => [
      m,
      { read: value, write: value, delete: value, export: value, admin: value },
    ]),
  ) as any;
}

describe('PERMISSION_MODULES', () => {
  it('contains expected modules', () => {
    expect(PERMISSION_MODULES).toContain('tasks');
    expect(PERMISSION_MODULES).toContain('evidence');
    expect(PERMISSION_MODULES).toContain('compliance');
    expect(PERMISSION_MODULES).toContain('incidents');
    expect(PERMISSION_MODULES).toContain('reports');
    expect(PERMISSION_MODULES).toContain('team');
    expect(PERMISSION_MODULES).toContain('billing');
    expect(PERMISSION_MODULES).toContain('settings');
  });

  it('has 13 modules', () => {
    expect(PERMISSION_MODULES.length).toBe(13);
  });
});

describe('getPermissionDiff', () => {
  it('returns empty array for identical matrices', () => {
    const a = makeMatrix(true);
    const b = makeMatrix(true);
    expect(getPermissionDiff(a, b)).toEqual([]);
  });

  it('returns all diffs when completely different', () => {
    const allTrue = makeMatrix(true);
    const allFalse = makeMatrix(false);
    const diffs = getPermissionDiff(allTrue, allFalse);
    // 13 modules × 5 actions = 65 diffs
    expect(diffs.length).toBe(PERMISSION_MODULES.length * 5);
  });

  it('identifies single permission difference', () => {
    const a = makeMatrix(false);
    const b = makeMatrix(false);
    b.tasks.write = true;

    const diffs = getPermissionDiff(a, b);
    expect(diffs).toEqual([
      { module: 'tasks', action: 'write', a: false, b: true },
    ]);
  });

  it('diff is symmetric in structure', () => {
    const a = makeMatrix(false);
    const b = makeMatrix(false);
    a.billing.admin = true;

    const diffs = getPermissionDiff(a, b);
    expect(diffs).toEqual([
      { module: 'billing', action: 'admin', a: true, b: false },
    ]);
  });

  it('handles multiple module diffs', () => {
    const a = makeMatrix(false);
    const b = makeMatrix(false);
    b.tasks.read = true;
    b.evidence.write = true;
    b.compliance.delete = true;

    const diffs = getPermissionDiff(a, b);
    expect(diffs).toHaveLength(3);
    expect(diffs.map((d) => d.module)).toContain('tasks');
    expect(diffs.map((d) => d.module)).toContain('evidence');
    expect(diffs.map((d) => d.module)).toContain('compliance');
  });
});
