import 'server-only';

import { createSupabaseAdminClient } from '@/lib/supabase/admin';

// R1 (Audit 2026-05-27): GDPR-compliant export-time redaction.
//
// The hash-chained audit tables (audit_log, org_audit_logs,
// admin_audit_log, security_audit_log) are RETAINED at-rest after a
// user purge — mutating rows would break verifyChainIntegrity, which
// is a product feature customers' auditors trust. So we redact at
// the export boundary instead.
//
// Usage:
//   const redactor = await loadRedactor();
//   for (const row of exportRows) {
//     yield redactor.redactRow(row);
//   }
//
// The redactor is constructed once per export job and held in memory
// — it walks every row's text columns + jsonb fields, replacing any
// match against a purged subject's user_id / email / full_name with
// REDACTION_MARKER. At realistic scale (≤ 10k purged subjects) the
// in-memory lookup is constant-time per field.

export const REDACTION_MARKER = '[redacted-by-erasure-request]';

// Names shorter than this trigger no redaction — avoids destroying
// rows that mention common short tokens ("Al", "Jo") that coincide
// with a purged subject's first name. UUIDs and emails always
// redact regardless of length.
const MIN_NAME_LENGTH_FOR_REDACTION = 4;

type PurgedSubjectRow = {
  user_id: string;
  email: string | null;
  full_name: string | null;
  extra_identifiers: unknown;
};

export type Redactor = {
  /**
   * Replace any purged-subject identifier inside `row` with
   * REDACTION_MARKER. Returns a new shallow-cloned row; the input
   * is not mutated. Recurses through jsonb-shaped fields.
   */
  redactRow<T extends Record<string, unknown>>(row: T): T;
  /**
   * Redact a single string the same way redactRow walks string
   * fields. Useful for ad-hoc string serialization in PDF rendering.
   */
  redactString(value: string): string;
  /**
   * Walk an arbitrary value (string | number | object | array) and
   * redact any string leaf. Used for jsonb columns or freeform
   * payloads.
   */
  redactValue<V>(value: V): V;
  /** Count of subjects in the redaction set (for logging). */
  size: number;
};

// Escape a string for safe interpolation into a RegExp. Mirrors the
// well-known utility — pulled in here so we don't need a tiny new
// dependency.
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isUuidLike(value: string): boolean {
  // RFC 4122 v4 shape; not strict version-checking because some
  // tables use v1 / generated UUIDs. We only test FORMAT here — the
  // actual matching is exact equality against known purged ids.
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value,
  );
}

type CompiledMatchers = {
  uuidSet: Set<string>;
  emailRegex: RegExp | null;
  nameRegex: RegExp | null;
};

function compileMatchers(subjects: PurgedSubjectRow[]): CompiledMatchers {
  const uuidSet = new Set<string>();
  const emailLiterals: string[] = [];
  const nameLiterals: string[] = [];

  for (const subject of subjects) {
    uuidSet.add(subject.user_id.toLowerCase());

    if (subject.email && subject.email.trim().length > 0) {
      emailLiterals.push(subject.email.trim().toLowerCase());
    }

    if (
      subject.full_name &&
      subject.full_name.trim().length >= MIN_NAME_LENGTH_FOR_REDACTION
    ) {
      nameLiterals.push(subject.full_name.trim());
    }

    if (Array.isArray(subject.extra_identifiers)) {
      for (const extra of subject.extra_identifiers) {
        if (typeof extra !== 'string') continue;
        const trimmed = extra.trim();
        if (trimmed.length === 0) continue;
        if (isUuidLike(trimmed)) {
          uuidSet.add(trimmed.toLowerCase());
        } else if (trimmed.includes('@')) {
          emailLiterals.push(trimmed.toLowerCase());
        } else if (trimmed.length >= MIN_NAME_LENGTH_FOR_REDACTION) {
          nameLiterals.push(trimmed);
        }
      }
    }
  }

  // Build one big alternation per category — single regex compile
  // beats N individual matches per field. The category split lets us
  // tune word-boundary behaviour separately (emails contain dots and
  // @, which break \b in unhelpful ways).
  const emailRegex =
    emailLiterals.length > 0
      ? new RegExp(
          `(${emailLiterals.map(escapeRegExp).join('|')})`,
          'gi',
        )
      : null;

  const nameRegex =
    nameLiterals.length > 0
      ? new RegExp(
          `\\b(${nameLiterals.map(escapeRegExp).join('|')})\\b`,
          'gi',
        )
      : null;

  return { uuidSet, emailRegex, nameRegex };
}

function redactStringWith(
  value: string,
  matchers: CompiledMatchers,
): string {
  if (value.length === 0) return value;

  let working = value;

  // Email pass first — emails contain `.` and `@`, so word-boundary
  // anchors are unreliable. We rely on the alternation literal +
  // case-insensitive match.
  if (matchers.emailRegex) {
    working = working.replace(matchers.emailRegex, REDACTION_MARKER);
  }

  // Name pass — word-bounded.
  if (matchers.nameRegex) {
    working = working.replace(matchers.nameRegex, REDACTION_MARKER);
  }

  // UUID pass — exact-match within boundaries. Use a generic UUID
  // capture + Set membership test instead of compiling a huge
  // alternation; UUID set sizes can be large and the alternation
  // pattern matcher in V8 degrades sharply past a few hundred terms.
  if (matchers.uuidSet.size > 0) {
    working = working.replace(
      /\b([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\b/gi,
      (match) =>
        matchers.uuidSet.has(match.toLowerCase()) ? REDACTION_MARKER : match,
    );
  }

  return working;
}

function redactValueWith<V>(value: V, matchers: CompiledMatchers): V {
  if (value === null || value === undefined) return value;

  if (typeof value === 'string') {
    return redactStringWith(value, matchers) as unknown as V;
  }

  if (Array.isArray(value)) {
    return value.map((item) => redactValueWith(item, matchers)) as unknown as V;
  }

  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      // Keys that are themselves a purged UUID get redacted too —
      // protects against details: { "<purged-uuid>": "metadata" }.
      const safeKey =
        matchers.uuidSet.size > 0 && isUuidLike(key) && matchers.uuidSet.has(key.toLowerCase())
          ? REDACTION_MARKER
          : key;
      out[safeKey] = redactValueWith(item, matchers);
    }
    return out as unknown as V;
  }

  return value;
}

function redactRowWith<T extends Record<string, unknown>>(
  row: T,
  matchers: CompiledMatchers,
): T {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    out[key] = redactValueWith(value, matchers);
  }
  return out as T;
}

/**
 * Build a redactor for an export job. Loads every purged subject
 * identifier once, compiles the matchers, returns a sealed object
 * the caller passes each row through.
 *
 * Returns a no-op redactor when no purges have ever happened — so
 * the hot path on a clean tenant is zero overhead.
 */
export async function loadRedactor(): Promise<Redactor> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from('purged_subject_redactions')
    .select('user_id, email, full_name, extra_identifiers');

  if (error) {
    throw new Error(`failed to load redaction set: ${error.message}`);
  }

  const rows = (data ?? []) as PurgedSubjectRow[];
  return buildRedactorFromRows(rows);
}

/**
 * Construct a redactor from an in-memory row set. Exposed for tests
 * and for callers that want to pre-load the set themselves (e.g.,
 * batched exports that loop through orgs).
 */
export function buildRedactorFromRows(rows: PurgedSubjectRow[]): Redactor {
  if (rows.length === 0) {
    const passthrough: Redactor = {
      redactRow: <T extends Record<string, unknown>>(row: T) => row,
      redactString: (value: string) => value,
      redactValue: <V>(value: V) => value,
      size: 0,
    };
    return passthrough;
  }

  const matchers = compileMatchers(rows);
  return {
    redactRow: (row) => redactRowWith(row, matchers),
    redactString: (value) => redactStringWith(value, matchers),
    redactValue: (value) => redactValueWith(value, matchers),
    size: rows.length,
  };
}

/**
 * Insert a redaction row for `subject`. Idempotent on (user_id):
 * a re-run of the same purge will succeed with no-op.
 */
export async function recordSubjectForRedaction(args: {
  userId: string;
  email: string | null;
  fullName: string | null;
  extraIdentifiers?: string[];
  purgeJobId?: string | null;
}): Promise<void> {
  const admin = createSupabaseAdminClient();
  const { error } = await admin.from('purged_subject_redactions').upsert(
    {
      user_id: args.userId,
      email: args.email,
      full_name: args.fullName,
      extra_identifiers: args.extraIdentifiers ?? [],
      purge_job_id: args.purgeJobId ?? null,
    },
    { onConflict: 'user_id' },
  );
  if (error) {
    throw new Error(`failed to record redaction subject: ${error.message}`);
  }
}
