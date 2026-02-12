/** @jest-environment node */

/**
 * Unit tests for lib/security/api-validation.ts
 *
 * Tests the Zod schemas exported by the API validation module:
 * uuidSchema, emailSchema, safeString, orgNameSchema, paginationSchema,
 * and helper functions.
 */

import {
  uuidSchema,
  emailSchema,
  safeString,
  safeStringSchema,
  orgNameSchema,
  paginationSchema,
  displayNameSchema,
  urlSchema,
  formatZodError,
} from '@/lib/security/api-validation';
import { z } from 'zod';

// -------------------------------------------------------------------------
// uuidSchema
// -------------------------------------------------------------------------

describe('uuidSchema', () => {
  it('accepts a valid UUID v4', () => {
    const result = uuidSchema.safeParse('550e8400-e29b-41d4-a716-446655440000');
    expect(result.success).toBe(true);
  });

  it('accepts another valid UUID', () => {
    const result = uuidSchema.safeParse('f47ac10b-58cc-4372-a567-0e02b2c3d479');
    expect(result.success).toBe(true);
  });

  it('rejects a plain string', () => {
    const result = uuidSchema.safeParse('not-a-uuid');
    expect(result.success).toBe(false);
  });

  it('rejects an empty string', () => {
    const result = uuidSchema.safeParse('');
    expect(result.success).toBe(false);
  });

  it('rejects a UUID with missing section', () => {
    const result = uuidSchema.safeParse('550e8400-e29b-41d4-a716');
    expect(result.success).toBe(false);
  });
});

// -------------------------------------------------------------------------
// emailSchema
// -------------------------------------------------------------------------

describe('emailSchema', () => {
  it('accepts a valid email', () => {
    const result = emailSchema.safeParse('user@example.com');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe('user@example.com');
    }
  });

  it('normalizes email to lowercase', () => {
    const result = emailSchema.safeParse('User@EXAMPLE.COM');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe('user@example.com');
    }
  });

  it('trims whitespace from email', () => {
    const result = emailSchema.safeParse('  user@example.com  ');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe('user@example.com');
    }
  });

  it('rejects invalid email format', () => {
    const result = emailSchema.safeParse('not-an-email');
    expect(result.success).toBe(false);
  });

  it('rejects emails longer than 255 characters', () => {
    const longEmail = 'a'.repeat(250) + '@b.com';
    const result = emailSchema.safeParse(longEmail);
    expect(result.success).toBe(false);
  });
});

// -------------------------------------------------------------------------
// safeString
// -------------------------------------------------------------------------

describe('safeString', () => {
  const schema = safeString({ min: 1, max: 200 });

  it('accepts a normal string', () => {
    const result = schema.safeParse('Hello, world!');
    expect(result.success).toBe(true);
  });

  it('rejects strings with script tags', () => {
    const result = schema.safeParse('<script>alert("xss")</script>');
    expect(result.success).toBe(false);
  });

  it('rejects strings with SQL injection patterns (double dash)', () => {
    const result = schema.safeParse('DROP TABLE users --');
    expect(result.success).toBe(false);
  });

  it('rejects strings with pipe operator', () => {
    const result = schema.safeParse('ls | rm -rf /');
    expect(result.success).toBe(false);
  });

  it('rejects strings with command substitution ($())', () => {
    const result = schema.safeParse('$(cat /etc/passwd)');
    expect(result.success).toBe(false);
  });

  it('rejects strings with backtick command injection', () => {
    const result = schema.safeParse('`whoami`');
    expect(result.success).toBe(false);
  });

  it('enforces minimum length', () => {
    const result = schema.safeParse('');
    expect(result.success).toBe(false);
  });

  it('enforces maximum length', () => {
    const longString = 'a'.repeat(201);
    const result = schema.safeParse(longString);
    expect(result.success).toBe(false);
  });

  it('accepts strings with normal punctuation', () => {
    const result = schema.safeParse("It's a great day! (really)");
    expect(result.success).toBe(true);
  });
});

// -------------------------------------------------------------------------
// safeStringSchema (default max 10000)
// -------------------------------------------------------------------------

describe('safeStringSchema', () => {
  it('accepts a normal string within default bounds', () => {
    const result = safeStringSchema.safeParse('Hello');
    expect(result.success).toBe(true);
  });

  it('rejects script tags', () => {
    const result = safeStringSchema.safeParse(
      '<script>document.cookie</script>',
    );
    expect(result.success).toBe(false);
  });
});

// -------------------------------------------------------------------------
// orgNameSchema
// -------------------------------------------------------------------------

describe('orgNameSchema', () => {
  it('accepts a valid organization name', () => {
    const result = orgNameSchema.safeParse('Acme Corp');
    expect(result.success).toBe(true);
  });

  it('accepts names with hyphens and dots', () => {
    const result = orgNameSchema.safeParse('Acme-Corp.io');
    expect(result.success).toBe(true);
  });

  it('accepts names with underscores', () => {
    const result = orgNameSchema.safeParse('my_org');
    expect(result.success).toBe(true);
  });

  it('rejects names shorter than 2 characters', () => {
    const result = orgNameSchema.safeParse('A');
    expect(result.success).toBe(false);
  });

  it('rejects names longer than 100 characters', () => {
    const result = orgNameSchema.safeParse('A'.repeat(101));
    expect(result.success).toBe(false);
  });

  it('rejects names with special characters like @', () => {
    const result = orgNameSchema.safeParse('Acme@Corp');
    expect(result.success).toBe(false);
  });

  it('rejects names with angle brackets', () => {
    const result = orgNameSchema.safeParse('Acme<script>');
    expect(result.success).toBe(false);
  });
});

// -------------------------------------------------------------------------
// paginationSchema
// -------------------------------------------------------------------------

describe('paginationSchema', () => {
  it('applies default values when no params provided', () => {
    const result = paginationSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(20);
    }
  });

  it('accepts valid page and limit', () => {
    const result = paginationSchema.safeParse({ page: 3, limit: 50 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(3);
      expect(result.data.limit).toBe(50);
    }
  });

  it('coerces string numbers to integers', () => {
    const result = paginationSchema.safeParse({ page: '2', limit: '10' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(2);
      expect(result.data.limit).toBe(10);
    }
  });

  it('rejects page less than 1', () => {
    const result = paginationSchema.safeParse({ page: 0 });
    expect(result.success).toBe(false);
  });

  it('rejects limit greater than 100', () => {
    const result = paginationSchema.safeParse({ limit: 101 });
    expect(result.success).toBe(false);
  });

  it('accepts optional offset parameter', () => {
    const result = paginationSchema.safeParse({ offset: 40 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.offset).toBe(40);
    }
  });
});

// -------------------------------------------------------------------------
// formatZodError
// -------------------------------------------------------------------------

describe('formatZodError', () => {
  it('formats a ZodError into a structured object', () => {
    const result = emailSchema.safeParse('not-valid');
    if (!result.success) {
      const formatted = formatZodError(result.error);
      expect(formatted.message).toBe('Validation failed');
      expect(formatted.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            message: expect.any(String),
          }),
        ]),
      );
    }
  });

  it('joins nested paths with dots', () => {
    const schema = z.object({
      nested: z.object({
        field: z.string(),
      }),
    });
    const result = schema.safeParse({ nested: { field: 123 } });
    if (!result.success) {
      const formatted = formatZodError(result.error);
      expect(formatted.errors[0].path).toBe('nested.field');
    }
  });
});
