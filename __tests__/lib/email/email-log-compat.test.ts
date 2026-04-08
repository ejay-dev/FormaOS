/**
 * Tests for lib/email/email-log-compat.ts
 * Focuses on normalizeRecipient, normalizeTimestamp functions and main flows
 */

jest.mock('server-only', () => ({}));

function createBuilder(result: any = { data: null, error: null }) {
  const b: Record<string, any> = {};
  [
    'select',
    'insert',
    'update',
    'delete',
    'eq',
    'neq',
    'in',
    'not',
    'is',
    'order',
    'limit',
    'range',
    'single',
    'maybeSingle',
    'filter',
    'match',
    'gte',
    'lte',
    'gt',
    'lt',
    'or',
    'contains',
    'textSearch',
    'rpc',
  ].forEach((m) => {
    b[m] = jest.fn(() => b);
  });
  b.then = (resolve: (v: any) => void) => resolve(result);
  return b;
}

const mockClient: Record<string, any> = {
  from: jest.fn(() => createBuilder()),
  rpc: jest.fn(() => createBuilder({ data: null, error: null })),
};

jest.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: jest.fn(async () => mockClient),
}));

const mockAdmin: Record<string, any> = {
  from: jest.fn(() => createBuilder()),
};

jest.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: jest.fn(() => mockAdmin),
}));

jest.mock('@/lib/supabase/schema-compat', () => ({
  extractMissingSupabaseColumn: jest.fn(() => null),
  getSupabaseErrorMessage: jest.fn(() => ''),
  isMissingSupabaseColumnError: jest.fn(() => false),
}));

import {
  recordEmailLog,
  getOrganizationEmailLogsCompat,
} from '@/lib/email/email-log-compat';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('recordEmailLog', () => {
  it('logs email via RPC when successful', async () => {
    mockClient.rpc = jest.fn(() => createBuilder({ data: null, error: null }));

    await recordEmailLog({
      emailType: 'welcome',
      recipientEmail: 'test@example.com',
      subject: 'Welcome',
      status: 'sent',
    });

    expect(mockClient.rpc).toHaveBeenCalledWith(
      'log_email_send',
      expect.objectContaining({
        p_email_type: 'welcome',
        p_recipient_email: 'test@example.com',
      }),
    );
  });

  it('throws on RPC error when not a missing column error', async () => {
    const rpcError = { message: 'some error', code: '42000' };
    mockClient.rpc = jest.fn(() =>
      createBuilder({ data: null, error: rpcError }),
    );

    await expect(
      recordEmailLog({
        emailType: 'invite',
        recipientEmail: 'test@example.com',
        subject: 'Invite',
        status: 'sent',
      }),
    ).rejects.toEqual(rpcError);
  });

  it('falls back to legacy insert when email_type column missing', async () => {
    const rpcError = { message: 'email_type column missing', code: '42703' };
    mockClient.rpc = jest.fn(() =>
      createBuilder({ data: null, error: rpcError }),
    );

    const {
      extractMissingSupabaseColumn,
      getSupabaseErrorMessage,
    } = require('@/lib/supabase/schema-compat');
    extractMissingSupabaseColumn.mockReturnValue('email_type');
    getSupabaseErrorMessage.mockReturnValue('email_logs email_type');

    mockAdmin.from = jest.fn(() => createBuilder({ data: null, error: null }));

    await recordEmailLog({
      emailType: 'welcome',
      recipientEmail: 'test@example.com',
      subject: 'Welcome',
      status: 'sent',
      organizationId: 'org-1',
    });

    expect(mockAdmin.from).toHaveBeenCalledWith('email_logs');
  });

  it('throws on legacy insert error', async () => {
    const rpcError = { message: 'email_type column missing', code: '42703' };
    mockClient.rpc = jest.fn(() =>
      createBuilder({ data: null, error: rpcError }),
    );

    const {
      extractMissingSupabaseColumn,
      getSupabaseErrorMessage,
    } = require('@/lib/supabase/schema-compat');
    extractMissingSupabaseColumn.mockReturnValue('email_type');
    getSupabaseErrorMessage.mockReturnValue('email_logs email_type');

    const legacyError = { message: 'insert failed' };
    mockAdmin.from = jest.fn(() =>
      createBuilder({ data: null, error: legacyError }),
    );

    await expect(
      recordEmailLog({
        emailType: 'welcome',
        recipientEmail: 'test@example.com',
        subject: 'Welcome',
        status: 'sent',
        organizationId: 'org-1',
      }),
    ).rejects.toEqual(legacyError);
  });

  it('handles optional params', async () => {
    mockClient.rpc = jest.fn(() => createBuilder({ data: null, error: null }));

    await recordEmailLog({
      emailType: 'reset',
      recipientEmail: 'test@example.com',
      subject: 'Reset',
      status: 'failed',
      resendId: 'resend-123',
      errorMessage: 'SMTP error',
      organizationId: 'org-1',
      userId: 'user-1',
    });

    expect(mockClient.rpc).toHaveBeenCalledWith(
      'log_email_send',
      expect.objectContaining({
        p_resend_id: 'resend-123',
        p_error_message: 'SMTP error',
        p_organization_id: 'org-1',
        p_user_id: 'user-1',
      }),
    );
  });
});

describe('getOrganizationEmailLogsCompat', () => {
  it('returns empty array on error', async () => {
    mockClient.from = jest.fn(() =>
      createBuilder({ data: null, error: { message: 'db error' } }),
    );

    const result = await getOrganizationEmailLogsCompat('org-1');
    expect(result).toEqual([]);
  });

  it('normalizes rows from database', async () => {
    mockClient.from = jest.fn(() =>
      createBuilder({
        data: [
          {
            id: '1',
            email_type: 'welcome',
            recipient_email: 'test@example.com',
            subject: 'Hello',
            status: 'sent',
            error_message: null,
            created_at: '2024-01-15T00:00:00Z',
            resend_id: 'rs-1',
            user_id: 'u-1',
          },
          {
            id: '2',
            template: 'invite',
            recipient: ['a@test.com', 'b@test.com'],
            subject: 'Invite',
            status: 'failed',
            error_message: 'bounce',
            sent_at: '2024-01-14T00:00:00Z',
            provider_id: 'prov-1',
            user_id: null,
          },
          {
            id: '3',
            template: 'reset',
            recipients: 42,
            subject: 'Reset',
            status: 'sent',
            updated_at: '2024-01-13T00:00:00Z',
          },
        ],
        error: null,
      }),
    );

    const result = await getOrganizationEmailLogsCompat('org-1');

    expect(result).toHaveLength(3);
    // First (timestamp sorted - most recent first)
    expect(result[0].emailType).toBe('welcome');
    expect(result[0].recipientEmail).toBe('test@example.com');
    expect(result[0].resendId).toBe('rs-1');

    // Second - array recipient normalized
    const inviteLog = result.find((r) => r.emailType === 'invite');
    expect(inviteLog).toBeTruthy();
    expect(inviteLog!.recipientEmail).toBe('a@test.com, b@test.com');
    expect(inviteLog!.resendId).toBe('prov-1');

    // Third - non-string recipient normalized to empty
    const resetLog = result.find((r) => r.emailType === 'reset');
    expect(resetLog).toBeTruthy();
    expect(resetLog!.recipientEmail).toBe('');
  });

  it('handles null data', async () => {
    mockClient.from = jest.fn(() => createBuilder({ data: null, error: null }));

    const result = await getOrganizationEmailLogsCompat('org-1');
    expect(result).toEqual([]);
  });

  it('respects limit parameter', async () => {
    const builder = createBuilder({ data: [], error: null });
    mockClient.from = jest.fn(() => builder);

    await getOrganizationEmailLogsCompat('org-1', 25);
    expect(builder.limit).toHaveBeenCalledWith(25);
  });

  it('normalizes timestamps from different fields', async () => {
    mockClient.from = jest.fn(() =>
      createBuilder({
        data: [{ id: '1', subject: 'test' }],
        error: null,
      }),
    );

    const result = await getOrganizationEmailLogsCompat('org-1');
    expect(result[0].createdAt).toBe(new Date(0).toISOString());
  });
});
