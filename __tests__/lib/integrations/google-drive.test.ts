/** @jest-environment node */

jest.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: jest.fn(),
}));
jest.mock('@/lib/integrations/config-crypto', () => ({
  decodeIntegrationConfig: jest.fn((v: unknown) => v),
}));

const mockFetch = jest.fn();
global.fetch = mockFetch as any;

import {
  listDriveFiles,
  linkDriveFileAsEvidence,
  downloadDriveFile,
} from '@/lib/integrations/google-drive';
import { createSupabaseServerClient } from '@/lib/supabase/server';

function mockSupabase(configData: unknown = null) {
  const configChain: Record<string, jest.Mock> = {};
  configChain.select = jest.fn().mockReturnValue(configChain);
  configChain.eq = jest.fn().mockReturnValue(configChain);
  configChain.maybeSingle = jest.fn().mockResolvedValue({ data: configData });

  const evidenceChain: Record<string, jest.Mock> = {};
  evidenceChain.insert = jest.fn().mockReturnValue(evidenceChain);
  evidenceChain.select = jest.fn().mockReturnValue(evidenceChain);
  evidenceChain.single = jest
    .fn()
    .mockResolvedValue({ data: { id: 'ev1' }, error: null });

  const syncChain = {
    insert: jest.fn().mockResolvedValue({ data: null, error: null }),
  };

  const client = {
    from: jest.fn((table: string) => {
      if (table === 'integration_configs') return configChain;
      if (table === 'org_evidence') return evidenceChain;
      if (table === 'integration_sync_log') return syncChain;
      return configChain;
    }),
  };
  (createSupabaseServerClient as jest.Mock).mockResolvedValue(client);
  return client;
}

const DRIVE_CONFIG = {
  access_token: 'tok',
  refresh_token: 'ref',
  folder_id: 'folder123',
};

describe('lib/integrations/google-drive', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockReset();
  });

  describe('listDriveFiles', () => {
    it('returns error when not configured', async () => {
      mockSupabase(null);
      const result = await listDriveFiles('org1');
      expect(result.success).toBe(false);
      expect(result.error).toContain('not configured');
    });

    it('lists files successfully', async () => {
      mockSupabase({ config: DRIVE_CONFIG });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          files: [{ id: 'f1', name: 'doc.pdf' }],
          nextPageToken: 'next',
        }),
      });

      const result = await listDriveFiles('org1');
      expect(result.success).toBe(true);
      expect(result.files).toHaveLength(1);
      expect(result.nextPageToken).toBe('next');
    });

    it('handles query filter', async () => {
      mockSupabase({ config: DRIVE_CONFIG });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ files: [], nextPageToken: undefined }),
      });

      await listDriveFiles('org1', { query: 'test-doc' });
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('test-doc');
    });

    it('sanitizes query input', async () => {
      mockSupabase({ config: DRIVE_CONFIG });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ files: [] }),
      });

      await listDriveFiles('org1', { query: "test' OR 1=1 --" });
      const url = mockFetch.mock.calls[0][0] as string;
      // SQL injection chars should be stripped
      expect(url).not.toContain("'");
    });

    it('handles mimeType filter', async () => {
      mockSupabase({ config: DRIVE_CONFIG });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ files: [] }),
      });

      await listDriveFiles('org1', { mimeType: 'application/pdf' });
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('application%2Fpdf');
    });

    it('handles Drive API error', async () => {
      mockSupabase({ config: DRIVE_CONFIG });
      mockFetch.mockResolvedValueOnce({ ok: false, status: 403 });

      const result = await listDriveFiles('org1');
      expect(result.success).toBe(false);
      expect(result.error).toContain('403');
    });

    it('handles fetch error', async () => {
      mockSupabase({ config: DRIVE_CONFIG });
      mockFetch.mockRejectedValueOnce(new Error('Network fail'));

      const result = await listDriveFiles('org1');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Network fail');
    });

    it('handles pageToken and pageSize', async () => {
      mockSupabase({ config: DRIVE_CONFIG });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ files: [] }),
      });

      await listDriveFiles('org1', { pageToken: 'abc', pageSize: 50 });
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('pageToken=abc');
    });

    it('works without folder_id in config', async () => {
      mockSupabase({ config: { access_token: 'tok', refresh_token: 'ref' } });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ files: [{ id: 'f1', name: 'doc.pdf' }] }),
      });

      const result = await listDriveFiles('org1');
      expect(result.success).toBe(true);
    });
  });

  describe('linkDriveFileAsEvidence', () => {
    it('returns error when not configured', async () => {
      mockSupabase(null);
      const result = await linkDriveFileAsEvidence('org1', 'file1', 'ctrl1');
      expect(result.success).toBe(false);
    });

    it('links file successfully', async () => {
      mockSupabase({ config: DRIVE_CONFIG });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'file1',
          name: 'doc.pdf',
          mimeType: 'application/pdf',
          size: '1024',
          webViewLink: 'https://drive.google.com/file1',
          md5Checksum: 'abc123',
        }),
      });

      const result = await linkDriveFileAsEvidence('org1', 'file1', 'ctrl1');
      expect(result.success).toBe(true);
      expect(result.evidenceId).toBe('ev1');
    });

    it('handles Drive API error on file fetch', async () => {
      mockSupabase({ config: DRIVE_CONFIG });
      mockFetch.mockResolvedValueOnce({ ok: false, status: 404 });

      const result = await linkDriveFileAsEvidence('org1', 'file1', 'ctrl1');
      expect(result.success).toBe(false);
      expect(result.error).toContain('404');
    });

    it('handles evidence insert error', async () => {
      const client = mockSupabase({ config: DRIVE_CONFIG });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'file1',
          name: 'doc.pdf',
          mimeType: 'application/pdf',
          size: '1024',
          webViewLink: 'https://drive.google.com/file1',
        }),
      });

      // Override evidence insert to return an error
      const evChain: Record<string, jest.Mock> = {};
      evChain.insert = jest.fn().mockReturnValue(evChain);
      evChain.select = jest.fn().mockReturnValue(evChain);
      evChain.single = jest
        .fn()
        .mockResolvedValue({ data: null, error: { message: 'db error' } });
      client.from = jest.fn((table: string) => {
        if (table === 'org_evidence') return evChain;
        // Re-use for config
        const cc: Record<string, jest.Mock> = {};
        cc.select = jest.fn().mockReturnValue(cc);
        cc.eq = jest.fn().mockReturnValue(cc);
        cc.maybeSingle = jest
          .fn()
          .mockResolvedValue({ data: { config: DRIVE_CONFIG } });
        return cc;
      });

      const result = await linkDriveFileAsEvidence('org1', 'file1', 'ctrl1');
      expect(result.success).toBe(false);
      expect(result.error).toContain('db error');
    });
  });

  describe('downloadDriveFile', () => {
    it('returns error when not configured', async () => {
      mockSupabase(null);
      const result = await downloadDriveFile('org1', 'file1');
      expect(result.success).toBe(false);
    });

    it('downloads file successfully', async () => {
      mockSupabase({ config: DRIVE_CONFIG });
      const buffer = new ArrayBuffer(8);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        arrayBuffer: async () => buffer,
        headers: {
          get: (h: string) => (h === 'content-type' ? 'application/pdf' : null),
        },
      });

      const result = await downloadDriveFile('org1', 'file1');
      expect(result.success).toBe(true);
      expect(result.content).toBe(buffer);
      expect(result.mimeType).toBe('application/pdf');
    });

    it('handles download error', async () => {
      mockSupabase({ config: DRIVE_CONFIG });
      mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });

      const result = await downloadDriveFile('org1', 'file1');
      expect(result.success).toBe(false);
      expect(result.error).toContain('500');
    });

    it('handles fetch exception', async () => {
      mockSupabase({ config: DRIVE_CONFIG });
      mockFetch.mockRejectedValueOnce(new Error('Timeout'));

      const result = await downloadDriveFile('org1', 'file1');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Timeout');
    });
  });
});
