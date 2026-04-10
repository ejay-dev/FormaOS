/** @jest-environment node */

jest.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: jest.fn(),
}));

import { compareVersions } from '@/lib/evidence/diff-engine';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

function mockDb(versions: unknown[] = []) {
  const chain: Record<string, jest.Mock> = {};
  chain.select = jest.fn().mockReturnValue(chain);
  chain.eq = jest.fn().mockReturnValue(chain);
  chain.in = jest.fn().mockReturnValue(chain);
  chain.order = jest.fn().mockResolvedValue({ data: versions });
  const db = { from: jest.fn().mockReturnValue(chain) };
  (createSupabaseAdminClient as jest.Mock).mockReturnValue(db);
  return db;
}

describe('lib/evidence/diff-engine', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns empty diffs when versions not found', async () => {
    mockDb([]);
    const result = await compareVersions('org1', 'ev1', 'v1', 'v2');
    expect(result.metadataChanges).toEqual([]);
    expect(result.textChanges).toEqual([]);
  });

  it('detects metadata changes between versions', async () => {
    mockDb([
      {
        version_id: 'v1',
        metadata: {
          title: 'Old Title',
          description: 'desc',
          tags: ['a'],
          control_mappings: [],
          status: 'draft',
        },
        text_content: '',
      },
      {
        version_id: 'v2',
        metadata: {
          title: 'New Title',
          description: 'desc',
          tags: ['a', 'b'],
          control_mappings: [],
          status: 'approved',
        },
        text_content: '',
      },
    ]);

    const result = await compareVersions('org1', 'ev1', 'v1', 'v2');
    expect(result.metadataChanges.length).toBeGreaterThan(0);
    const titleChange = result.metadataChanges.find((c) => c.field === 'title');
    expect(titleChange).toBeDefined();
    expect(titleChange?.oldValue).toBe('Old Title');
    expect(titleChange?.newValue).toBe('New Title');
  });

  it('detects text changes', async () => {
    mockDb([
      {
        version_id: 'v1',
        metadata: {},
        text_content: 'Line 1\nLine 2\nLine 3',
      },
      {
        version_id: 'v2',
        metadata: {},
        text_content: 'Line 1\nLine Modified\nLine 3\nLine 4',
      },
    ]);

    const result = await compareVersions('org1', 'ev1', 'v1', 'v2');
    expect(result.textChanges.some((c) => c.type === 'removed')).toBe(true);
    expect(result.textChanges.some((c) => c.type === 'added')).toBe(true);
    expect(result.textChanges.some((c) => c.type === 'unchanged')).toBe(true);
  });

  it('handles versions with no text content', async () => {
    mockDb([
      { version_id: 'v1', metadata: { title: 'A' }, text_content: null },
      { version_id: 'v2', metadata: { title: 'A' }, text_content: null },
    ]);

    const result = await compareVersions('org1', 'ev1', 'v1', 'v2');
    expect(result.textChanges).toEqual([]);
    expect(result.metadataChanges).toEqual([]);
  });

  it('handles one version longer than the other in text', async () => {
    mockDb([
      { version_id: 'v1', metadata: {}, text_content: 'Line 1' },
      {
        version_id: 'v2',
        metadata: {},
        text_content: 'Line 1\nLine 2\nLine 3',
      },
    ]);

    const result = await compareVersions('org1', 'ev1', 'v1', 'v2');
    const addedLines = result.textChanges.filter((c) => c.type === 'added');
    expect(addedLines.length).toBe(2);
  });
});
