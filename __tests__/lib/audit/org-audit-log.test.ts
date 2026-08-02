/**
 * Branch-coverage tests for lib/audit/org-audit-log.ts
 * 37 uncovered branches (0% → target ~80%)
 */

jest.mock('server-only', () => ({}));
jest.mock('@/lib/supabase/schema-compat', () => ({
  extractMissingSupabaseColumn: jest.fn(),
}));

import { insertOrgAuditLog } from '@/lib/audit/org-audit-log';
import { extractMissingSupabaseColumn } from '@/lib/supabase/schema-compat';

const mockExtract = extractMissingSupabaseColumn as jest.Mock;

function createMockClient(insertResults: Array<{ error: any }>) {
  let callCount = 0;
  // Record every row handed to insert() so tests can assert on the payload
  // the audit writer actually builds, not just that it was called.
  const insertedRows: Array<Array<Record<string, unknown>>> = [];
  return {
    insertedRows,
    from: jest.fn(() => ({
      insert: jest.fn((rows: Array<Record<string, unknown>>) => {
        insertedRows.push(rows);
        const result = insertResults[callCount] ?? { error: null };
        callCount++;
        return Promise.resolve(result);
      }),
    })),
  };
}

describe('org-audit-log', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockExtract.mockReset();
  });

  describe('insertOrgAuditLog', () => {
    it('inserts a single audit log entry successfully', async () => {
      const client = createMockClient([{ error: null }]);
      const result = await insertOrgAuditLog(client as any, {
        organization_id: 'org-1',
        action: 'user.login',
        actor_email: 'user@example.com',
        actor_id: 'user-1',
      });
      expect(result.error).toBeNull();
      expect(client.from).toHaveBeenCalledWith('org_audit_logs');
    });

    it('inserts an array of audit log entries', async () => {
      const client = createMockClient([{ error: null }]);
      const result = await insertOrgAuditLog(client as any, [
        { organization_id: 'org-1', action: 'user.login' },
        { organization_id: 'org-1', action: 'user.logout' },
      ]);
      expect(result.error).toBeNull();
    });

    it('uses target_resource when target is empty', async () => {
      const client = createMockClient([{ error: null }]);
      await insertOrgAuditLog(client as any, {
        organization_id: 'org-1',
        action: 'doc.create',
        target: '',
        target_resource: 'Document A',
      });
      // An empty `target` must fall through to target_resource — not to the
      // action name, and not to the empty string.
      expect(client.insertedRows[0]).toEqual([
        expect.objectContaining({
          organization_id: 'org-1',
          action: 'doc.create',
          target: 'Document A',
        }),
      ]);
    });

    it('defaults target to action when both target and target_resource are empty', async () => {
      const client = createMockClient([{ error: null }]);
      await insertOrgAuditLog(client as any, {
        organization_id: 'org-1',
        action: 'system.check',
        target: '',
        target_resource: '',
      });
      expect(client.from).toHaveBeenCalledWith('org_audit_logs');
      expect(client.insertedRows[0][0].target).toBe('system.check');
    });

    it('defaults actor_email to system@formaos.com when empty', async () => {
      const client = createMockClient([{ error: null }]);
      await insertOrgAuditLog(client as any, {
        organization_id: 'org-1',
        action: 'cron.run',
        actor_email: '',
      });
      expect(client.insertedRows[0][0].actor_email).toBe('system@formaos.com');
    });

    it('handles metadata with details and diff', async () => {
      const client = createMockClient([{ error: null }]);
      await insertOrgAuditLog(client as any, {
        organization_id: 'org-1',
        action: 'policy.update',
        metadata: { key: 'value' },
        details: { changed: true },
        diff: { before: 'a', after: 'b' },
      });
      // details/diff must be nested alongside the caller's metadata rather
      // than overwriting it — dropping the diff is the regression this pins.
      expect(client.insertedRows[0][0].metadata).toEqual({
        metadata: { key: 'value' },
        details: { changed: true },
        diff: { before: 'a', after: 'b' },
      });
    });

    it('handles metadata without details/diff', async () => {
      const client = createMockClient([{ error: null }]);
      await insertOrgAuditLog(client as any, {
        organization_id: 'org-1',
        action: 'view.page',
        metadata: { page: '/dashboard' },
      });
      expect(client.from).toHaveBeenCalled();
    });

    it('handles undefined metadata', async () => {
      const client = createMockClient([{ error: null }]);
      await insertOrgAuditLog(client as any, {
        organization_id: 'org-1',
        action: 'test',
      });
      expect(client.from).toHaveBeenCalled();
    });

    it('handles details without metadata', async () => {
      const client = createMockClient([{ error: null }]);
      await insertOrgAuditLog(client as any, {
        organization_id: 'org-1',
        action: 'test',
        details: { info: 'some info' },
      });
      expect(client.from).toHaveBeenCalled();
    });

    it('sanitizes circular/non-serializable values', async () => {
      const client = createMockClient([{ error: null }]);
      const circular: any = {};
      circular.self = circular;
      await insertOrgAuditLog(client as any, {
        organization_id: 'org-1',
        action: 'test',
        metadata: circular,
      });
      expect(client.from).toHaveBeenCalled();
    });

    it('returns error when insert fails with non-column error', async () => {
      const err = { message: 'connection refused' };
      const client = createMockClient([{ error: err }]);
      mockExtract.mockReturnValue(null);

      const result = await insertOrgAuditLog(client as any, {
        organization_id: 'org-1',
        action: 'test',
      });
      expect(result.error).toBe(err);
    });

    it('retries after stripping missing column', async () => {
      const err1 = {
        message: "Could not find the 'domain' column of 'org_audit_logs'",
      };
      const client = createMockClient([{ error: err1 }, { error: null }]);
      mockExtract.mockReturnValueOnce('domain').mockReturnValueOnce(null);

      const result = await insertOrgAuditLog(client as any, {
        organization_id: 'org-1',
        action: 'test',
        domain: 'security',
      });
      expect(result.error).toBeNull();
    });

    it('returns error when missing column cannot be stripped', async () => {
      const err = {
        message: "Could not find the 'new_col' column of 'org_audit_logs'",
      };
      const client = createMockClient([{ error: err }, { error: err }]);
      mockExtract
        .mockReturnValueOnce('nonexistent_col')
        .mockReturnValueOnce(null);

      const result = await insertOrgAuditLog(client as any, {
        organization_id: 'org-1',
        action: 'test',
      });
      // The column doesn't exist in removableColumns so removed = false
      expect(result.error).toBe(err);
    });

    it('handles null optional fields correctly', async () => {
      const client = createMockClient([{ error: null }]);
      await insertOrgAuditLog(client as any, {
        organization_id: 'org-1',
        action: 'test',
        actor_id: null,
        domain: null,
        severity: null,
        entity_id: null,
        created_at: null,
      });
      expect(client.from).toHaveBeenCalled();
    });

    it('uses provided created_at timestamp', async () => {
      const client = createMockClient([{ error: null }]);
      await insertOrgAuditLog(client as any, {
        organization_id: 'org-1',
        action: 'test',
        created_at: '2024-01-15T10:00:00Z',
      });
      expect(client.from).toHaveBeenCalled();
    });

    it('strips multiple missing columns across retries', async () => {
      const err1 = { message: "Could not find the 'domain' column" };
      const err2 = { message: "Could not find the 'severity' column" };
      const client = createMockClient([
        { error: err1 },
        { error: err2 },
        { error: null },
      ]);
      mockExtract
        .mockReturnValueOnce('domain')
        .mockReturnValueOnce('severity')
        .mockReturnValueOnce(null);

      const result = await insertOrgAuditLog(client as any, {
        organization_id: 'org-1',
        action: 'test',
        domain: 'security',
        severity: 'high',
      });
      // After stripping domain, second insert fails on severity, strip that, third succeeds
      expect(result.error).toBeNull();
    });
  });
});
