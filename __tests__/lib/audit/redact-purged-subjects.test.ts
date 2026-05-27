/**
 * Tests for lib/audit/redact-purged-subjects.ts (R1: GDPR export-time
 * redaction).
 *
 * These tests cover the matcher precision contract — over-redaction
 * is a correctness bug (audit data becomes unreadable), under-
 * redaction is a compliance bug (purged subject's PII leaks through
 * the export boundary).
 */

jest.mock('server-only', () => ({}));

jest.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: jest.fn(() => ({
    from: () => ({
      select: () => ({
        then: (resolve: any) => resolve({ data: [], error: null }),
      }),
      upsert: () => ({ error: null }),
    }),
  })),
}));

import {
  REDACTION_MARKER,
  buildRedactorFromRows,
} from '@/lib/audit/redact-purged-subjects';

describe('buildRedactorFromRows — passthrough', () => {
  it('returns identity passthrough when the subject set is empty', () => {
    const redactor = buildRedactorFromRows([]);
    const row = { id: 'r-1', actor: 'alice@example.com', text: 'something' };
    expect(redactor.redactRow(row)).toBe(row);
    expect(redactor.size).toBe(0);
  });
});

describe('buildRedactorFromRows — UUID matching', () => {
  const subjects = [
    {
      user_id: '11111111-2222-4333-8444-555555555555',
      email: null,
      full_name: null,
      extra_identifiers: [],
    },
  ];

  it('exact-matches a UUID in a string field', () => {
    const redactor = buildRedactorFromRows(subjects);
    const row = { id: 'r-1', actor_user_id: '11111111-2222-4333-8444-555555555555' };
    const out = redactor.redactRow(row);
    expect(out.actor_user_id).toBe(REDACTION_MARKER);
    expect(out.id).toBe('r-1');
  });

  it('case-insensitive on UUID — uppercase matches too', () => {
    const redactor = buildRedactorFromRows(subjects);
    const row = { actor: '11111111-2222-4333-8444-555555555555'.toUpperCase() };
    expect(redactor.redactRow(row).actor).toBe(REDACTION_MARKER);
  });

  it('does NOT redact a different UUID that is not in the set', () => {
    const redactor = buildRedactorFromRows(subjects);
    const otherUuid = '99999999-aaaa-4bbb-8ccc-dddddddddddd';
    expect(redactor.redactRow({ actor: otherUuid }).actor).toBe(otherUuid);
  });

  it('redacts a UUID embedded inside a longer string', () => {
    const redactor = buildRedactorFromRows(subjects);
    const text = 'User 11111111-2222-4333-8444-555555555555 created task';
    expect(redactor.redactString(text)).toBe(
      `User ${REDACTION_MARKER} created task`,
    );
  });
});

describe('buildRedactorFromRows — email matching', () => {
  const subjects = [
    {
      user_id: '11111111-2222-4333-8444-555555555555',
      email: 'alice@example.com',
      full_name: null,
      extra_identifiers: [],
    },
  ];

  it('redacts an exact email match', () => {
    const redactor = buildRedactorFromRows(subjects);
    expect(redactor.redactString('contact alice@example.com today')).toBe(
      `contact ${REDACTION_MARKER} today`,
    );
  });

  it('matches case-insensitively', () => {
    const redactor = buildRedactorFromRows(subjects);
    expect(redactor.redactString('ALICE@EXAMPLE.COM')).toBe(REDACTION_MARKER);
  });

  it('does NOT redact a different email', () => {
    const redactor = buildRedactorFromRows(subjects);
    expect(redactor.redactString('bob@example.com')).toBe('bob@example.com');
  });
});

describe('buildRedactorFromRows — name matching', () => {
  const subjects = [
    {
      user_id: '11111111-2222-4333-8444-555555555555',
      email: null,
      full_name: 'Alice Wonderland',
      extra_identifiers: [],
    },
  ];

  it('redacts a name at word boundary', () => {
    const redactor = buildRedactorFromRows(subjects);
    expect(
      redactor.redactString('Approved by Alice Wonderland on 2026-05-27'),
    ).toBe(`Approved by ${REDACTION_MARKER} on 2026-05-27`);
  });

  it('does NOT redact a substring match within another word', () => {
    const redactor = buildRedactorFromRows(subjects);
    expect(redactor.redactString('Aliceland is a place')).toBe(
      'Aliceland is a place',
    );
  });

  it('does NOT register short names — min length 4 guard', () => {
    const redactor = buildRedactorFromRows([
      {
        user_id: '11111111-2222-4333-8444-555555555555',
        email: null,
        full_name: 'Jo',
        extra_identifiers: [],
      },
    ]);
    expect(redactor.redactString('Jo opened the door')).toBe(
      'Jo opened the door',
    );
  });
});

describe('buildRedactorFromRows — JSONB recursion', () => {
  const subjects = [
    {
      user_id: '11111111-2222-4333-8444-555555555555',
      email: 'alice@example.com',
      full_name: 'Alice Wonderland',
      extra_identifiers: [],
    },
  ];

  it('recurses into nested objects and arrays', () => {
    const redactor = buildRedactorFromRows(subjects);
    const row = {
      id: 'r-1',
      details: {
        actor: {
          id: '11111111-2222-4333-8444-555555555555',
          email: 'alice@example.com',
        },
        notes: [
          'Reviewed by Alice Wonderland',
          { signed_by: 'alice@example.com' },
        ],
      },
    };
    const out = redactor.redactRow(row) as typeof row;
    expect(out.details.actor.id).toBe(REDACTION_MARKER);
    expect(out.details.actor.email).toBe(REDACTION_MARKER);
    expect(out.details.notes[0]).toBe(
      `Reviewed by ${REDACTION_MARKER}`,
    );
    expect((out.details.notes[1] as { signed_by: string }).signed_by).toBe(
      REDACTION_MARKER,
    );
  });

  it('redacts a UUID used as an object key', () => {
    const redactor = buildRedactorFromRows(subjects);
    const row = {
      acl: {
        '11111111-2222-4333-8444-555555555555': 'admin',
        '99999999-aaaa-4bbb-8ccc-dddddddddddd': 'member',
      },
    };
    const out = redactor.redactRow(row) as typeof row;
    expect(Object.keys(out.acl)).toEqual(
      expect.arrayContaining([
        REDACTION_MARKER,
        '99999999-aaaa-4bbb-8ccc-dddddddddddd',
      ]),
    );
  });

  it('returns a shallow-cloned row — input is not mutated', () => {
    const redactor = buildRedactorFromRows(subjects);
    const row = {
      id: 'r-1',
      actor: 'alice@example.com',
      details: { note: 'Approved by Alice Wonderland' },
    };
    const originalActor = row.actor;
    const originalNote = row.details.note;
    redactor.redactRow(row);
    expect(row.actor).toBe(originalActor);
    expect(row.details.note).toBe(originalNote);
  });
});

describe('buildRedactorFromRows — multi-subject + extra_identifiers', () => {
  it('redacts identifiers from multiple subjects in one pass', () => {
    const redactor = buildRedactorFromRows([
      {
        user_id: '11111111-2222-4333-8444-555555555555',
        email: 'alice@example.com',
        full_name: 'Alice',
        extra_identifiers: [],
      },
      {
        user_id: '99999999-aaaa-4bbb-8ccc-dddddddddddd',
        email: 'bob@example.com',
        full_name: 'Robert',
        extra_identifiers: ['+61400123456'],
      },
    ]);
    const out = redactor.redactString(
      'alice@example.com and bob@example.com (also Robert) — UUID 99999999-aaaa-4bbb-8ccc-dddddddddddd',
    );
    expect(out).toContain(REDACTION_MARKER);
    expect(out).not.toContain('alice@example.com');
    expect(out).not.toContain('bob@example.com');
    expect(out).not.toContain('Robert');
    expect(out).not.toContain('99999999-aaaa-4bbb-8ccc-dddddddddddd');
  });
});
