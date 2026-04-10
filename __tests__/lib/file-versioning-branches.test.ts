/**
 * Branch-coverage tests for lib/file-versioning.ts
 * Targets additional uncovered branches beyond existing test file
 * Focuses on restoreVersion without reason, compareVersions edge cases
 */

jest.mock('server-only', () => ({}));

function createBuilder(result: any = { data: null, error: null }) {
  const b: Record<string, any> = {};
  [
    'select',
    'insert',
    'update',
    'delete',
    'upsert',
    'eq',
    'neq',
    'in',
    'lt',
    'lte',
    'gt',
    'gte',
    'not',
    'is',
    'order',
    'limit',
    'range',
    'filter',
    'match',
    'or',
    'single',
    'maybeSingle',
  ].forEach((m) => {
    b[m] = jest.fn(() => b);
  });
  b.then = (resolve: (v: any) => void) => resolve(result);
  return b;
}

let callIdx = 0;
let builders: any[] = [];
jest.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: jest.fn(async () => ({
    from: jest.fn(() => {
      const idx = callIdx++;
      return builders[idx] || createBuilder();
    }),
  })),
}));

jest.mock('@/lib/audit-trail', () => ({
  logActivity: jest.fn(),
}));

jest.mock('@/lib/realtime', () => ({
  sendNotification: jest.fn(),
}));

import {
  createFile,
  uploadNewVersion,
  getFileVersions,
  restoreVersion,
  compareVersions,
} from '@/lib/file-versioning';

describe('file-versioning additional branches', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    callIdx = 0;
    builders = [];
  });

  it('createFile with document entity type', async () => {
    builders = [
      createBuilder({ data: { id: 'f1', current_version: 1 }, error: null }),
      createBuilder({ data: null, error: null }),
    ];
    const result = await createFile('org1', 'document', 'doc1', {
      name: 'doc.txt',
      path: '/uploads/doc.txt',
      size: 512,
      mimeType: 'text/plain',
      uploadedBy: 'u1',
      checksum: 'abc',
    });
    expect(result.id).toBe('f1');
  });

  it('createFile with certificate entity type', async () => {
    builders = [
      createBuilder({ data: { id: 'f2', current_version: 1 }, error: null }),
      createBuilder({ data: null, error: null }),
    ];
    const result = await createFile('org1', 'certificate', 'cert1', {
      name: 'cert.pem',
      path: '/uploads/cert.pem',
      size: 256,
      mimeType: 'application/x-pem-file',
      uploadedBy: 'u1',
      checksum: 'xyz',
    });
    expect(result.id).toBe('f2');
  });

  it('uploadNewVersion without change summary', async () => {
    builders = [
      createBuilder({
        data: {
          id: 'f1',
          current_version: 1,
          organization_id: 'org1',
          entity_id: 'ent1',
        },
        error: null,
      }),
      createBuilder({ data: { id: 'v2', version_number: 2 }, error: null }),
      createBuilder({ data: null, error: null }),
    ];
    const result = await uploadNewVersion('f1', 'u1', {
      name: 'updated.pdf',
      path: '/uploads/updated.pdf',
      size: 2048,
      mimeType: 'application/pdf',
      checksum: 'newchk',
    });
    expect(result.version_number).toBe(2);
  });

  it('restoreVersion without reason', async () => {
    builders = [
      createBuilder({
        data: {
          id: 'v1',
          version_number: 1,
          file_name: 'old.pdf',
          file_path: '/old',
          file_size: 100,
          mime_type: 'application/pdf',
          checksum: 'aaa',
        },
        error: null,
      }),
      createBuilder({
        data: { id: 'f1', current_version: 3, organization_id: 'o1' },
        error: null,
      }),
      createBuilder({ data: { id: 'v4', version_number: 4 }, error: null }),
      createBuilder({ data: null, error: null }),
    ];
    const result = await restoreVersion('f1', 1, 'u1');
    expect(result.version_number).toBe(4);
  });

  it('restoreVersion with reason', async () => {
    builders = [
      createBuilder({
        data: {
          id: 'v2',
          version_number: 2,
          file_name: 'v2.pdf',
          file_path: '/v2',
          file_size: 200,
          mime_type: 'application/pdf',
          checksum: 'bbb',
        },
        error: null,
      }),
      createBuilder({
        data: { id: 'f1', current_version: 3, organization_id: 'o1' },
        error: null,
      }),
      createBuilder({ data: { id: 'v4', version_number: 4 }, error: null }),
      createBuilder({ data: null, error: null }),
    ];
    const result = await restoreVersion('f1', 2, 'u1', 'compliance rollback');
    expect(result.version_number).toBe(4);
  });

  it('compareVersions with identical files', async () => {
    builders = [
      createBuilder({
        data: {
          id: 'v1',
          version_number: 1,
          file_name: 'same.pdf',
          file_path: '/a',
          file_size: 100,
          mime_type: 'application/pdf',
          uploaded_by: 'u1',
          checksum: 'aaa',
          created_at: '2024-01-01T00:00:00Z',
        },
        error: null,
      }),
      createBuilder({
        data: {
          id: 'v2',
          version_number: 2,
          file_name: 'same.pdf',
          file_path: '/a',
          file_size: 100,
          mime_type: 'application/pdf',
          uploaded_by: 'u1',
          checksum: 'aaa',
          created_at: '2024-01-02T00:00:00Z',
        },
        error: null,
      }),
    ];
    const result = await compareVersions('f1', 1, 2);
    expect(result.differences.nameChanged).toBe(false);
    expect(result.differences.typeChanged).toBe(false);
    expect(result.differences.uploaderChanged).toBe(false);
    expect(result.differences.sizeChange).toBe(0);
  });

  it('compareVersions version1 not found returns null', async () => {
    builders = [createBuilder({ data: null, error: null })];
    const result = await compareVersions('f1', 1, 2);
    expect(result).toBeNull();
  });

  it('compareVersions version2 not found returns null', async () => {
    builders = [
      createBuilder({ data: { id: 'v1', file_name: 'a' }, error: null }),
      createBuilder({ data: null, error: null }),
    ];
    const result = await compareVersions('f1', 1, 2);
    expect(result).toBeNull();
  });

  it('getFileVersions returns empty array on null data', async () => {
    builders = [createBuilder({ data: null, error: null })];
    const result = await getFileVersions('f1');
    expect(result).toEqual([]);
  });
});
