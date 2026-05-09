/** @jest-environment node */

/**
 * Unit tests for lib/auth/mfa-gate
 *
 * The gate is the bridge between Supabase's password sign-in (which
 * mints a session immediately) and FormaOS's TOTP challenge. These
 * tests would all fail before Blocker 1 was fixed because the module
 * did not exist.
 */

import {
  evaluateMfaGate,
  extractSessionIdFromAccessToken,
  markMfaPassedForCurrentSession,
  recordMfaFailure,
} from '@/lib/auth/mfa-gate';

function encodeJwt(payload: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256' })).toString(
    'base64url',
  );
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  // Signature is irrelevant — the gate intentionally does not verify it.
  return `${header}.${body}.signature-not-checked`;
}

interface FakeRow {
  two_factor_enabled?: boolean | null;
  mfa_passed_session_id?: string | null;
  mfa_failed_attempts?: number | null;
}

interface UpdateCapture {
  values: Record<string, unknown> | null;
  filterColumn: string | null;
  filterValue: unknown;
}

function buildSupabaseStub({
  user,
  accessToken,
  row,
}: {
  user: { id: string } | null;
  accessToken: string | null;
  row: FakeRow | null;
}) {
  const updates: UpdateCapture[] = [];
  let lastSelect: { table: string; selectedColumns: string } | null = null;
  let nextSelectResponse: FakeRow | null = row;

  const client = {
    auth: {
      getSession: async () => ({
        data: {
          session: accessToken
            ? { access_token: accessToken, user: user ?? null }
            : null,
        },
        error: null,
      }),
      getUser: async () => ({
        data: { user: user ? { id: user.id } : null },
        error: null,
      }),
    },
    from(table: string) {
      const filters: Array<{ column: string; value: unknown }> = [];
      const builder: any = {
        select(cols: string) {
          lastSelect = { table, selectedColumns: cols };
          return builder;
        },
        eq(column: string, value: unknown) {
          filters.push({ column, value });
          return builder;
        },
        async maybeSingle() {
          return { data: nextSelectResponse, error: null };
        },
        update(values: Record<string, unknown>) {
          const capture: UpdateCapture = {
            values,
            filterColumn: null,
            filterValue: null,
          };
          updates.push(capture);
          const updateBuilder: any = {
            eq(column: string, value: unknown) {
              capture.filterColumn = column;
              capture.filterValue = value;
              return Promise.resolve({ data: null, error: null });
            },
          };
          return updateBuilder;
        },
      };
      return builder;
    },
  } as any;

  return {
    client,
    updates,
    setNextSelect(value: FakeRow | null) {
      nextSelectResponse = value;
    },
    lastSelect: () => lastSelect,
  };
}

describe('extractSessionIdFromAccessToken', () => {
  it('returns null for null/empty input', () => {
    expect(extractSessionIdFromAccessToken(null)).toBeNull();
    expect(extractSessionIdFromAccessToken(undefined)).toBeNull();
    expect(extractSessionIdFromAccessToken('')).toBeNull();
  });

  it('returns null for malformed JWT (wrong segment count)', () => {
    expect(extractSessionIdFromAccessToken('not-a-jwt')).toBeNull();
    expect(extractSessionIdFromAccessToken('only.two')).toBeNull();
  });

  it('returns the session_id claim when present', () => {
    const token = encodeJwt({ session_id: 'sess-abc-123', sub: 'u1' });
    expect(extractSessionIdFromAccessToken(token)).toBe('sess-abc-123');
  });

  it('returns null when session_id claim is missing', () => {
    const token = encodeJwt({ sub: 'u1' });
    expect(extractSessionIdFromAccessToken(token)).toBeNull();
  });

  it('returns null when session_id claim is non-string', () => {
    const token = encodeJwt({ session_id: 12345 });
    expect(extractSessionIdFromAccessToken(token)).toBeNull();
  });
});

describe('evaluateMfaGate', () => {
  it('returns required=false when user has no MFA enabled', async () => {
    const stub = buildSupabaseStub({
      user: { id: 'u1' },
      accessToken: encodeJwt({ session_id: 'sess-1' }),
      row: { two_factor_enabled: false, mfa_passed_session_id: null },
    });
    const state = await evaluateMfaGate(stub.client);
    expect(state.required).toBe(false);
    expect(state.passed).toBe(true);
    expect(state.sessionId).toBe('sess-1');
  });

  it('returns required=true, passed=false when MFA is on and session has not cleared', async () => {
    const stub = buildSupabaseStub({
      user: { id: 'u1' },
      accessToken: encodeJwt({ session_id: 'sess-current' }),
      row: {
        two_factor_enabled: true,
        mfa_passed_session_id: 'sess-prior',
      },
    });
    const state = await evaluateMfaGate(stub.client);
    expect(state.required).toBe(true);
    expect(state.passed).toBe(false);
  });

  it('returns required=true, passed=true when MFA is on and session id matches', async () => {
    const stub = buildSupabaseStub({
      user: { id: 'u1' },
      accessToken: encodeJwt({ session_id: 'sess-current' }),
      row: {
        two_factor_enabled: true,
        mfa_passed_session_id: 'sess-current',
      },
    });
    const state = await evaluateMfaGate(stub.client);
    expect(state.required).toBe(true);
    expect(state.passed).toBe(true);
  });

  it('returns required=true, passed=false when access token has no session_id claim', async () => {
    // A pathological token that doesn't carry the claim must NOT be
    // treated as a passing session — fail closed.
    const stub = buildSupabaseStub({
      user: { id: 'u1' },
      accessToken: encodeJwt({ sub: 'u1' }),
      row: {
        two_factor_enabled: true,
        mfa_passed_session_id: 'whatever',
      },
    });
    const state = await evaluateMfaGate(stub.client);
    expect(state.required).toBe(true);
    expect(state.passed).toBe(false);
  });

  it('returns passed=true when there is no authenticated user', async () => {
    const stub = buildSupabaseStub({
      user: null,
      accessToken: null,
      row: null,
    });
    const state = await evaluateMfaGate(stub.client);
    expect(state.required).toBe(false);
    expect(state.passed).toBe(true);
  });
});

describe('markMfaPassedForCurrentSession', () => {
  it('writes the session id and timestamp keyed on user_id', async () => {
    const stub = buildSupabaseStub({
      user: { id: 'u1' },
      accessToken: encodeJwt({ session_id: 'sess-1' }),
      row: null,
    });

    await markMfaPassedForCurrentSession(stub.client, 'u1', 'sess-1');

    expect(stub.updates).toHaveLength(1);
    const [update] = stub.updates;
    expect(update.filterColumn).toBe('user_id');
    expect(update.filterValue).toBe('u1');
    expect(update.values).toMatchObject({
      mfa_passed_session_id: 'sess-1',
      mfa_failed_attempts: 0,
    });
    expect(update.values?.mfa_passed_at).toBeDefined();
  });
});

describe('recordMfaFailure', () => {
  it('increments the existing fail counter', async () => {
    const stub = buildSupabaseStub({
      user: { id: 'u1' },
      accessToken: encodeJwt({ session_id: 'sess-1' }),
      row: { mfa_failed_attempts: 2 },
    });

    await recordMfaFailure(stub.client, 'u1');

    expect(stub.updates).toHaveLength(1);
    expect(stub.updates[0].values).toMatchObject({
      mfa_failed_attempts: 3,
    });
  });

  it('starts the counter at 1 when no row exists', async () => {
    const stub = buildSupabaseStub({
      user: { id: 'u1' },
      accessToken: encodeJwt({ session_id: 'sess-1' }),
      row: null,
    });

    await recordMfaFailure(stub.client, 'u1');

    expect(stub.updates).toHaveLength(1);
    expect(stub.updates[0].values).toMatchObject({
      mfa_failed_attempts: 1,
    });
  });
});
