/** @jest-environment node */

import {
  calculateChecksum,
  compareVersions,
  createFile,
  hasFileChanged,
  pruneOldVersions,
  restoreVersion,
  uploadNewVersion,
} from '@/lib/file-versioning';
import { mockSupabase } from '@/tests/helpers';

const supabase = mockSupabase();
const logActivity = jest.fn();
const sendNotification = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: jest.fn(async () => supabase.client),
}));

jest.mock('@/lib/audit-trail', () => ({
  logActivity: (...args: unknown[]) => logActivity(...args),
}));

jest.mock('@/lib/realtime', () => ({
  sendNotification: (...args: unknown[]) => sendNotification(...args),
}));

describe('file-versioning', () => {
  beforeEach(() => {
    supabase.reset();
    logActivity.mockReset();
    sendNotification.mockReset();
  });

  it('creates file metadata and an initial version record', async () => {
    supabase.setResolver((operation) => {
      if (operation.table === 'file_metadata' && operation.action === 'insert') {
        return {
          data: { id: 'file-1', ...(operation.values as Record<string, unknown>) },
          error: null,
        };
      }
      return { data: null, error: null };
    });

    const file = await createFile('org-1', 'evidence', 'evidence-1', {
      name: 'policy.pdf',
      path: '/files/policy.pdf',
      size: 2048,
      mimeType: 'application/pdf',
      uploadedBy: 'user-1',
      checksum: 'abc123',
    });

    expect(file.id).toBe('file-1');
    expect(
      supabase.operations.some(
        (operation) =>
          operation.table === 'file_versions' &&
          operation.action === 'insert' &&
          (operation.values as Record<string, unknown>).version_number === 1,
      ),
    ).toBe(true);
    expect(logActivity).toHaveBeenCalledWith(
      'org-1',
      'user-1',
      'create',
      'evidence',
      expect.objectContaining({
        entityId: 'file-1',
        entityName: 'policy.pdf',
      }),
    );
  });

  it('uploads a new file version, updates metadata, and notifies the uploader', async () => {
    supabase.setResolver((operation) => {
      if (operation.table === 'file_metadata' && operation.action === 'select') {
        return {
          data: {
            id: 'file-1',
            organization_id: 'org-1',
            entity_id: 'evidence-1',
            current_version: 2,
          },
          error: null,
        };
      }
      if (operation.table === 'file_versions' && operation.action === 'insert') {
        return {
          data: {
            id: 'version-3',
            ...(operation.values as Record<string, unknown>),
            created_at: '2026-03-14T00:00:00.000Z',
          },
          error: null,
        };
      }
      return { data: null, error: null };
    });

    const version = await uploadNewVersion(
      'file-1',
      'user-1',
      {
        name: 'policy-v3.pdf',
        path: '/files/policy-v3.pdf',
        size: 4096,
        mimeType: 'application/pdf',
        checksum: 'checksum-v3',
      },
      'Added approvals section',
    );

    expect(version.version_number).toBe(3);
    expect(
      supabase.operations.some(
        (operation) =>
          operation.table === 'file_metadata' &&
          operation.action === 'update' &&
          (operation.values as Record<string, unknown>).current_version === 3,
      ),
    ).toBe(true);
    expect(sendNotification).toHaveBeenCalledWith(
      'user-1',
      'New File Version',
      'policy-v3.pdf has been updated to version 3',
      'info',
      '/evidence/evidence-1',
    );
  });

  it('compares two versions and reports meaningful differences', async () => {
    supabase.setResolver((operation) => {
      if (operation.table === 'file_versions' && operation.action === 'select') {
        const versionNumber = operation.filters.find(
          (filter) => filter.column === 'version_number',
        )?.value;

        if (versionNumber === 1) {
          return {
            data: {
              file_id: 'file-1',
              version_number: 1,
              file_name: 'policy.pdf',
              file_size: 1000,
              mime_type: 'application/pdf',
              uploaded_by: 'user-1',
              checksum: 'a',
              created_at: '2026-03-10T00:00:00.000Z',
            },
            error: null,
          };
        }

        return {
          data: {
            file_id: 'file-1',
            version_number: 2,
            file_name: 'policy-v2.docx',
            file_size: 1500,
            mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            uploaded_by: 'user-2',
            checksum: 'b',
            created_at: '2026-03-11T12:00:00.000Z',
          },
          error: null,
        };
      }
      return { data: null, error: null };
    });

    const comparison = await compareVersions('file-1', 1, 2);
    expect(comparison?.differences).toEqual(
      expect.objectContaining({
        sizeChange: 500,
        sizeDelta: '+500.00 Bytes',
        nameChanged: true,
        typeChanged: true,
        uploaderChanged: true,
      }),
    );
  });

  it('restores an older version by creating a new current version', async () => {
    supabase.setResolver((operation) => {
      if (operation.table === 'file_versions' && operation.action === 'select') {
        return {
          data: {
            file_id: 'file-1',
            version_number: 2,
            file_name: 'policy-v2.pdf',
            file_path: '/files/policy-v2.pdf',
            file_size: 2048,
            mime_type: 'application/pdf',
            uploaded_by: 'user-1',
            checksum: 'restore-me',
            created_at: '2026-03-11T00:00:00.000Z',
          },
          error: null,
        };
      }
      if (operation.table === 'file_metadata' && operation.action === 'select') {
        return {
          data: {
            id: 'file-1',
            organization_id: 'org-1',
            current_version: 3,
          },
          error: null,
        };
      }
      if (operation.table === 'file_versions' && operation.action === 'insert') {
        return {
          data: {
            id: 'version-4',
            ...(operation.values as Record<string, unknown>),
          },
          error: null,
        };
      }
      return { data: null, error: null };
    });

    const restored = await restoreVersion('file-1', 2, 'user-9', 'Rollback bad change');
    expect(restored.version_number).toBe(4);
    expect(restored.change_summary).toContain('Rollback bad change');
    expect(
      supabase.operations.some(
        (operation) =>
          operation.table === 'file_metadata' &&
          operation.action === 'update' &&
          (operation.values as Record<string, unknown>).current_version === 4,
      ),
    ).toBe(true);
  });

  it('prunes old versions and updates the retained version count', async () => {
    supabase.setResolver((operation) => {
      if (operation.table === 'file_versions' && operation.action === 'select') {
        return {
          data: [
            { id: 'v4', version_number: 4 },
            { id: 'v3', version_number: 3 },
            { id: 'v2', version_number: 2 },
            { id: 'v1', version_number: 1 },
          ],
          error: null,
        };
      }
      return { data: null, error: null };
    });

    await expect(pruneOldVersions('file-1', 2)).resolves.toBe(2);

    const deleteOp = supabase.operations.find(
      (operation) =>
        operation.table === 'file_versions' && operation.action === 'delete',
    );
    expect(deleteOp?.filters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'in',
          column: 'id',
          value: ['v2', 'v1'],
        }),
      ]),
    );
  });

  it('calculates checksums and detects when a file content hash changes', async () => {
    const checksum = await calculateChecksum(Buffer.from('hello world'));
    expect(checksum).toHaveLength(64);

    supabase.setResolver((operation) => {
      if (operation.table === 'file_metadata' && operation.action === 'select') {
        return { data: { current_version: 3 }, error: null };
      }
      if (operation.table === 'file_versions' && operation.action === 'select') {
        return {
          data: {
            file_id: 'file-1',
            version_number: 3,
            checksum,
          },
          error: null,
        };
      }
      return { data: null, error: null };
    });

    await expect(hasFileChanged('file-1', checksum)).resolves.toBe(false);
    await expect(hasFileChanged('file-1', 'different-checksum')).resolves.toBe(true);
  });
});
