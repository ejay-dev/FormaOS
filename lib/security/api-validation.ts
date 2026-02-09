/**
 * API Input Validation Module
 *
 * Centralized Zod schemas for all API inputs
 * Prevents injection attacks and ensures data integrity
 */

import { z } from 'zod';

// ============================================
// Common validation patterns
// ============================================

/**
 * UUID validation
 */
export const uuidSchema = z.string().uuid('Invalid UUID format');

/**
 * Email validation with additional checks
 */
export const emailSchema = z
  .string()
  .trim()
  .email('Invalid email format')
  .max(255, 'Email too long')
  .transform((email) => email.toLowerCase());

/**
 * Safe string - no SQL injection, XSS, or command injection
 */
type SafeStringOptions = {
  min?: number;
  max?: number;
};

const applySafeStringRules = (schema: z.ZodString) =>
  schema
    .refine(
      (val) =>
        !/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi.test(val),
      'Script tags not allowed',
    )
    .refine(
      (val) => !/(\-\-|;|\||&|\$\(|`)/g.test(val),
      'Invalid characters detected',
    );

export const safeString = (options: SafeStringOptions = {}) => {
  let schema = z.string();
  if (options.min !== undefined) {
    schema = schema.min(
      options.min,
      `String must be at least ${options.min} characters`,
    );
  }
  if (options.max !== undefined) {
    schema = schema.max(options.max, 'String too long');
  }
  return applySafeStringRules(schema);
};

export const safeStringSchema = safeString({ max: 10000 });

/**
 * Organization name validation
 */
export const orgNameSchema = z
  .string()
  .min(2, 'Organization name must be at least 2 characters')
  .max(100, 'Organization name must be less than 100 characters')
  .regex(/^[\w\s\-\.]+$/, 'Organization name contains invalid characters');

/**
 * User display name validation
 */
export const displayNameSchema = z
  .string()
  .min(1, 'Name is required')
  .max(100, 'Name must be less than 100 characters')
  .regex(/^[\w\s\-\.']+$/u, 'Name contains invalid characters');

/**
 * URL validation
 */
export const urlSchema = z
  .string()
  .url('Invalid URL format')
  .max(2048, 'URL too long')
  .refine((url) => {
    try {
      const parsed = new URL(url);
      return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
      return false;
    }
  }, 'Only HTTP and HTTPS URLs are allowed');

/**
 * Pagination parameters
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).optional(),
});

/**
 * Date range parameters
 */
export const dateRangeSchema = z
  .object({
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
  })
  .refine((data) => {
    if (data.startDate && data.endDate) {
      return data.startDate <= data.endDate;
    }
    return true;
  }, 'Start date must be before end date');

// ============================================
// API-specific schemas
// ============================================

/**
 * Audit log query parameters
 */
export const auditLogQuerySchema = z.object({
  organizationId: uuidSchema,
  userId: uuidSchema.optional(),
  eventType: z.string().max(50).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  ...paginationSchema.shape,
});

/**
 * Create organization request
 */
export const createOrgSchema = z.object({
  name: orgNameSchema,
  plan: z.enum(['basic', 'pro', 'enterprise']).default('basic'),
  industry: z.string().max(100).optional(),
});

/**
 * Update organization request
 */
export const updateOrgSchema = z.object({
  name: orgNameSchema.optional(),
  settings: z.record(z.string(), z.unknown()).optional(),
  branding: z
    .object({
      primaryColor: z
        .string()
        .regex(/^#[0-9A-Fa-f]{6}$/)
        .optional(),
      logo: urlSchema.optional(),
    })
    .optional(),
});

/**
 * Create user request
 */
export const createUserSchema = z.object({
  email: emailSchema,
  name: displayNameSchema,
  role: z.enum(['owner', 'admin', 'member', 'viewer']).default('member'),
});

/**
 * Invite member request
 */
export const inviteMemberSchema = z.object({
  email: emailSchema,
  role: z.enum(['admin', 'member', 'viewer']).default('member'),
  message: safeString({ max: 500 }).optional(),
});

/**
 * Update member role request
 */
export const updateMemberRoleSchema = z.object({
  userId: uuidSchema,
  role: z.enum(['admin', 'member', 'viewer']),
});

/**
 * Control creation request
 */
export const createControlSchema = z.object({
  code: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[\w\-\.]+$/),
  title: safeString({ min: 1, max: 500 }),
  description: safeString({ max: 5000 }).optional(),
  frameworkId: uuidSchema.optional(),
  categoryId: uuidSchema.optional(),
  priority: z.enum(['critical', 'high', 'medium', 'low']).default('medium'),
});

/**
 * Evidence upload request
 */
export const uploadEvidenceSchema = z.object({
  controlId: uuidSchema,
  name: safeString({ min: 1, max: 255 }),
  description: safeString({ max: 2000 }).optional(),
  fileType: z.enum(['pdf', 'docx', 'xlsx', 'png', 'jpg', 'jpeg', 'gif']),
  fileSize: z
    .number()
    .int()
    .min(1)
    .max(50 * 1024 * 1024), // Max 50MB
});

/**
 * Report generation request
 */
export const generateReportSchema = z.object({
  organizationId: uuidSchema,
  frameworkId: uuidSchema.optional(),
  reportType: z.enum(['compliance', 'audit', 'executive', 'detailed']),
  dateRange: dateRangeSchema.optional(),
  format: z.enum(['pdf', 'xlsx', 'csv']).default('pdf'),
});

/**
 * Automation trigger configuration
 */
export const automationTriggerSchema = z.object({
  name: safeString({ min: 1, max: 100 }),
  triggerType: z.enum(['schedule', 'event', 'webhook']),
  schedule: z.string().max(100).optional(), // cron expression
  eventType: z.string().max(100).optional(),
  webhookUrl: urlSchema.optional(),
  actions: z
    .array(
      z.object({
        type: z.string().max(50),
        config: z.record(z.string(), z.unknown()),
      }),
    )
    .max(10),
  enabled: z.boolean().default(true),
});

/**
 * Webhook payload validation
 */
export const webhookPayloadSchema = z.object({
  event: z.string().min(1).max(100),
  timestamp: z.coerce.date(),
  data: z.record(z.string(), z.unknown()),
  signature: z.string().optional(),
});

// ============================================
// Validation helpers
// ============================================

/**
 * Validate and parse request body
 */
export async function validateBody<T>(
  request: Request,
  schema: z.ZodSchema<T>,
): Promise<{ success: true; data: T } | { success: false; error: z.ZodError }> {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);

    if (result.success) {
      return { success: true, data: result.data };
    }

    return { success: false, error: result.error };
  } catch (error) {
    return {
      success: false,
      error: new z.ZodError([
        {
          code: 'custom',
          message: 'Invalid JSON body',
          path: [],
        },
      ]),
    };
  }
}

/**
 * Validate URL search parameters
 */
export function validateSearchParams<T>(
  searchParams: URLSearchParams,
  schema: z.ZodSchema<T>,
): { success: true; data: T } | { success: false; error: z.ZodError } {
  const params: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    params[key] = value;
  });

  const result = schema.safeParse(params);

  if (result.success) {
    return { success: true, data: result.data };
  }

  return { success: false, error: result.error };
}

/**
 * Format Zod errors for API response
 */
export function formatZodError(error: z.ZodError<unknown>): {
  message: string;
  errors: Array<{ path: string; message: string }>;
} {
  const issues = error.issues || [];
  return {
    message: 'Validation failed',
    errors: issues.map((e) => ({
      path: e.path.join('.'),
      message: e.message,
    })),
  };
}

/**
 * Create a validated API handler wrapper
 */
export function withValidation<T>(
  schema: z.ZodSchema<T>,
  handler: (data: T, request: Request) => Promise<Response>,
) {
  return async (request: Request): Promise<Response> => {
    const result = await validateBody(request, schema);

    if (!result.success) {
      return new Response(JSON.stringify(formatZodError(result.error)), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return handler(result.data, request);
  };
}
