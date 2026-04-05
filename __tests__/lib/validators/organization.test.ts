/**
 * Tests for lib/validators/organization.ts
 * Covers all validation functions, sanitization, and email parsing.
 */

import {
  validateOrganizationName,
  sanitizeOrganizationName,
  validateIndustry,
  validateTeamSize,
  validatePlan,
  validateFrameworks,
  isValidEmail,
  parseInviteEmails,
  validateInviteEmails,
  validateOnboardingForm,
  INDUSTRY_OPTIONS,
  TEAM_SIZE_OPTIONS,
  FRAMEWORK_OPTIONS,
  PLAN_OPTIONS,
} from '@/lib/validators/organization';

describe('validateOrganizationName', () => {
  it('rejects empty string', () => {
    expect(validateOrganizationName('')).toEqual({
      valid: false,
      error: 'Organization name is required',
    });
  });

  it('rejects whitespace-only', () => {
    expect(validateOrganizationName('   ')).toEqual({
      valid: false,
      error: 'Organization name is required',
    });
  });

  it('rejects single character', () => {
    const r = validateOrganizationName('A');
    expect(r.valid).toBe(false);
  });

  it('rejects over 100 characters', () => {
    const r = validateOrganizationName('A'.repeat(101));
    expect(r.valid).toBe(false);
    expect(r.error).toContain('less than 100');
  });

  it('accepts valid 2-char name', () => {
    expect(validateOrganizationName('AB')).toEqual({ valid: true });
  });

  it('accepts name with spaces and hyphens', () => {
    expect(validateOrganizationName('My-Company Name')).toEqual({
      valid: true,
    });
  });

  it('accepts name with apostrophe', () => {
    expect(validateOrganizationName("O'Brien Corp")).toEqual({ valid: true });
  });

  it('rejects name starting with special char', () => {
    const r = validateOrganizationName('-Start');
    expect(r.valid).toBe(false);
  });
});

describe('sanitizeOrganizationName', () => {
  it('trims whitespace', () => {
    expect(sanitizeOrganizationName('  Hello  ')).toBe('Hello');
  });

  it('normalizes multiple spaces', () => {
    expect(sanitizeOrganizationName('My    Company')).toBe('My Company');
  });

  it('normalizes multiple hyphens', () => {
    expect(sanitizeOrganizationName('My--Company')).toBe('My-Company');
  });

  it('removes leading/trailing hyphens', () => {
    expect(sanitizeOrganizationName('-Hello-')).toBe('Hello');
  });

  it('removes leading/trailing apostrophes', () => {
    expect(sanitizeOrganizationName("'Hello'")).toBe('Hello');
  });
});

describe('validateIndustry', () => {
  it('accepts all valid industries', () => {
    for (const opt of INDUSTRY_OPTIONS) {
      expect(validateIndustry(opt.id)).toEqual({ valid: true });
    }
  });

  it('rejects unknown industry', () => {
    const r = validateIndustry('unknown_industry');
    expect(r.valid).toBe(false);
  });
});

describe('validateTeamSize', () => {
  it('accepts all valid team sizes', () => {
    for (const opt of TEAM_SIZE_OPTIONS) {
      expect(validateTeamSize(opt.id)).toEqual({ valid: true });
    }
  });

  it('rejects invalid team size', () => {
    expect(validateTeamSize('500+')).toEqual({
      valid: false,
      error: 'Please select a valid team size',
    });
  });
});

describe('validatePlan', () => {
  it('accepts all plan options', () => {
    for (const opt of PLAN_OPTIONS) {
      expect(validatePlan(opt.id)).toEqual({ valid: true });
    }
  });

  it('rejects invalid plan', () => {
    expect(validatePlan('ultimate')).toEqual({
      valid: false,
      error: 'Please select a valid plan',
    });
  });
});

describe('validateFrameworks', () => {
  it('rejects empty array', () => {
    expect(validateFrameworks([])).toEqual({
      valid: false,
      error: 'Please select at least one framework',
    });
  });

  it('accepts valid frameworks', () => {
    expect(validateFrameworks(['soc2', 'gdpr'])).toEqual({ valid: true });
  });

  it('rejects invalid framework', () => {
    const r = validateFrameworks(['soc2', 'invalid']);
    expect(r.valid).toBe(false);
    expect(r.error).toBe('Invalid framework selection');
  });
});

describe('isValidEmail', () => {
  it('accepts standard email', () => {
    expect(isValidEmail('test@example.com')).toBe(true);
  });

  it('rejects missing @', () => {
    expect(isValidEmail('testexample.com')).toBe(false);
  });

  it('rejects missing domain', () => {
    expect(isValidEmail('test@')).toBe(false);
  });

  it('rejects spaces', () => {
    expect(isValidEmail('test @example.com')).toBe(false);
  });
});

describe('parseInviteEmails', () => {
  it('returns empty for null', () => {
    expect(parseInviteEmails(null)).toEqual([]);
  });

  it('splits by comma', () => {
    const result = parseInviteEmails('a@b.com, c@d.com');
    expect(result).toEqual(['a@b.com', 'c@d.com']);
  });

  it('splits by newline', () => {
    const result = parseInviteEmails('a@b.com\nc@d.com');
    expect(result).toEqual(['a@b.com', 'c@d.com']);
  });

  it('filters out short items without @', () => {
    const result = parseInviteEmails('a@b.com, hi, c@d.com');
    expect(result).toEqual(['a@b.com', 'c@d.com']);
  });

  it('lowercases emails', () => {
    const result = parseInviteEmails('ADMIN@TEST.COM');
    expect(result).toEqual(['admin@test.com']);
  });
});

describe('validateInviteEmails', () => {
  it('all valid', () => {
    const r = validateInviteEmails(['a@b.com', 'c@d.com']);
    expect(r.valid).toBe(true);
    expect(r.validEmails).toHaveLength(2);
    expect(r.invalidEmails).toHaveLength(0);
  });

  it('mixed valid and invalid', () => {
    const r = validateInviteEmails(['a@b.com', 'notanemail']);
    expect(r.valid).toBe(false);
    expect(r.invalidEmails).toContain('notanemail');
  });
});

describe('validateOnboardingForm', () => {
  function makeFormData(data: Record<string, string | string[]>): FormData {
    const fd = new FormData();
    for (const [key, val] of Object.entries(data)) {
      if (Array.isArray(val)) {
        val.forEach((v) => fd.append(key, v));
      } else {
        fd.set(key, val);
      }
    }
    return fd;
  }

  it('validates a complete valid form', () => {
    const fd = makeFormData({
      organizationName: 'MyOrg',
      industry: 'ndis',
      teamSize: '1-10',
      plan: 'pro',
      frameworks: ['soc2'],
      inviteEmails: '',
    });
    const r = validateOnboardingForm(fd);
    expect(r.valid).toBe(true);
    expect(r.data?.organizationName).toBe('MyOrg');
  });

  it('returns errors for invalid fields', () => {
    const fd = makeFormData({
      organizationName: '',
      industry: 'bad',
      teamSize: 'bad',
      plan: 'bad',
      frameworks: [],
    });
    const r = validateOnboardingForm(fd);
    expect(r.valid).toBe(false);
    expect(r.errors).toBeDefined();
    expect(r.errors!.organizationName).toBeDefined();
    expect(r.errors!.industry).toBeDefined();
  });
});
