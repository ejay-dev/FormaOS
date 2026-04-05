/**
 * Tests for lib/tasks/priority.ts
 */

import { normalizeTaskPriority, taskPriorityLabel } from '@/lib/tasks/priority';

describe('normalizeTaskPriority', () => {
  it('maps "urgent" to critical', () => {
    expect(normalizeTaskPriority('urgent')).toBe('critical');
  });

  it('maps "critical" to critical', () => {
    expect(normalizeTaskPriority('critical')).toBe('critical');
  });

  it('maps "high" to high', () => {
    expect(normalizeTaskPriority('high')).toBe('high');
  });

  it('maps "low" to low', () => {
    expect(normalizeTaskPriority('low')).toBe('low');
  });

  it('maps "standard" to medium', () => {
    expect(normalizeTaskPriority('standard')).toBe('medium');
  });

  it('maps "medium" to medium', () => {
    expect(normalizeTaskPriority('medium')).toBe('medium');
  });

  it('defaults null to medium', () => {
    expect(normalizeTaskPriority(null)).toBe('medium');
  });

  it('defaults undefined to medium', () => {
    expect(normalizeTaskPriority(undefined)).toBe('medium');
  });

  it('is case-insensitive', () => {
    expect(normalizeTaskPriority('HIGH')).toBe('high');
    expect(normalizeTaskPriority('Critical')).toBe('critical');
  });

  it('defaults unknown string to medium', () => {
    expect(normalizeTaskPriority('banana')).toBe('medium');
  });
});

describe('taskPriorityLabel', () => {
  it('returns normalized priority string', () => {
    expect(taskPriorityLabel('urgent')).toBe('critical');
    expect(taskPriorityLabel(null)).toBe('medium');
  });
});
