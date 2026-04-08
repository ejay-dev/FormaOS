/**
 * Branch-coverage tests for lib/ai/rag-chat.ts
 * 39 uncovered branches (0% → target ~80%)
 */

jest.mock('@/lib/ai/vector-store', () => ({
  similaritySearch: jest.fn(),
}));
jest.mock('@/lib/ai/usage-meter', () => ({
  trackUsage: jest.fn(),
}));

import {
  buildComplianceContext,
  buildControlContext,
  buildRAGContext,
  buildSystemPrompt,
  formatSourcesForResponse,
} from '@/lib/ai/rag-chat';
import { similaritySearch } from '@/lib/ai/vector-store';

const mockSimilaritySearch = similaritySearch as jest.Mock;

function createMockDb(overrides: Record<string, any> = {}) {
  const chain: Record<string, any> = {};
  ['select', 'eq', 'limit', 'single'].forEach((m) => {
    chain[m] = jest.fn(() => chain);
  });
  chain.then = (resolve: any) =>
    resolve(overrides.result ?? { data: null, error: null, count: null });

  const db: any = {
    from: jest.fn((table: string) => {
      if (overrides[table]) {
        const c: Record<string, any> = {};
        ['select', 'eq', 'limit', 'single'].forEach((m) => {
          c[m] = jest.fn(() => c);
        });
        c.then = (resolve: any) => resolve(overrides[table]);
        return c;
      }
      return chain;
    }),
  };
  return db;
}

describe('rag-chat', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('buildComplianceContext', () => {
    it('includes frameworks and their scores', async () => {
      const db = createMockDb({
        org_frameworks: {
          data: [
            { framework_name: 'SOC 2', compliance_score: 85 },
            { framework_name: 'ISO 27001', compliance_score: null },
          ],
        },
        tasks: { data: [] },
        evidence: { data: null, count: 3 },
      });

      const result = await buildComplianceContext(db, 'org-1');
      expect(result).toContain('SOC 2: 85% compliant');
      expect(result).toContain('ISO 27001: 0% compliant');
      expect(result).toContain('Evidence Items: 3');
    });

    it('includes task summary with overdue and open counts', async () => {
      const db = createMockDb({
        org_frameworks: { data: null },
        tasks: {
          data: [
            { status: 'open' },
            { status: 'in_progress' },
            { status: 'overdue' },
            { status: 'past_due' },
            { status: 'completed' },
          ],
        },
        evidence: { data: null, count: 0 },
      });

      const result = await buildComplianceContext(db, 'org-1');
      expect(result).toContain('5 total');
      expect(result).toContain('2 open');
      expect(result).toContain('2 overdue');
    });

    it('handles null frameworks', async () => {
      const db = createMockDb({
        org_frameworks: { data: null },
        tasks: { data: null },
        evidence: { data: null, count: null },
      });

      const result = await buildComplianceContext(db, 'org-1');
      expect(result).toContain('Evidence Items: 0');
      expect(result).not.toContain('Active Compliance Frameworks');
    });

    it('handles empty tasks', async () => {
      const db = createMockDb({
        org_frameworks: { data: [] },
        tasks: { data: [] },
        evidence: { data: null, count: 10 },
      });

      const result = await buildComplianceContext(db, 'org-1');
      expect(result).not.toContain('Task Summary');
      expect(result).toContain('Evidence Items: 10');
    });
  });

  describe('buildControlContext', () => {
    it('builds context with control details and evidence', async () => {
      const callResults: Record<string, any> = {
        org_compliance_controls: {
          data: {
            control_id: 'CC-1.1',
            title: 'Access Control',
            description: 'Manage access',
            category: 'Security',
            status: 'implemented',
          },
        },
        evidence: {
          data: [
            {
              title: 'Access Policy',
              description: 'Policy doc',
              created_at: '2024-01-01',
            },
            {
              title: 'MFA Config',
              description: null,
              created_at: '2024-02-01',
            },
          ],
        },
      };
      const db = createMockDb(callResults);

      const result = await buildControlContext(db, 'org-1', 'ctrl-1');
      expect(result).toContain('CC-1.1 - Access Control');
      expect(result).toContain('Description: Manage access');
      expect(result).toContain('Category: Security');
      expect(result).toContain('Status: implemented');
      expect(result).toContain('Access Policy: Policy doc');
      expect(result).toContain('MFA Config');
    });

    it('returns empty string when control not found', async () => {
      const db = createMockDb({
        org_compliance_controls: { data: null },
      });

      const result = await buildControlContext(db, 'org-1', 'missing');
      expect(result).toBe('');
    });

    it('handles control with null description and category', async () => {
      const db = createMockDb({
        org_compliance_controls: {
          data: {
            control_id: 'CC-2.1',
            title: 'Data Backup',
            description: null,
            category: null,
            status: null,
          },
        },
        evidence: { data: null },
      });

      const result = await buildControlContext(db, 'org-1', 'ctrl-2');
      expect(result).toContain('CC-2.1 - Data Backup');
      expect(result).toContain('Category: General');
      expect(result).toContain('Status: unknown');
      expect(result).not.toContain('Linked Evidence');
    });

    it('handles control with empty evidence list', async () => {
      const db = createMockDb({
        org_compliance_controls: {
          data: {
            control_id: 'CC-3.1',
            title: 'Logging',
            description: 'Log events',
            category: 'Operations',
            status: 'partial',
          },
        },
        evidence: { data: [] },
      });

      const result = await buildControlContext(db, 'org-1', 'ctrl-3');
      expect(result).not.toContain('Linked Evidence');
    });
  });

  describe('buildRAGContext', () => {
    it('builds context with sources and compliance context', async () => {
      mockSimilaritySearch.mockResolvedValue([
        {
          sourceType: 'policy',
          sourceId: 'p1',
          metadata: { title: 'Security Policy' },
          chunkText: 'A'.repeat(300),
          similarity: 0.92,
        },
      ]);

      const db = createMockDb({
        org_frameworks: { data: [] },
        tasks: { data: [] },
        evidence: { data: null, count: 0 },
      });

      const result = await buildRAGContext(db, 'org-1', 'What is our policy?');
      expect(result.sources).toHaveLength(1);
      expect(result.sources[0].title).toBe('Security Policy');
      expect(result.sources[0].snippet.length).toBeLessThanOrEqual(200);
      expect(result.complianceContext).toBeDefined();
    });

    it('uses default maxSources when not provided', async () => {
      mockSimilaritySearch.mockResolvedValue([]);
      const db = createMockDb({
        org_frameworks: { data: null },
        tasks: { data: null },
        evidence: { data: null, count: null },
      });

      await buildRAGContext(db, 'org-1', 'test');
      expect(mockSimilaritySearch).toHaveBeenCalledWith(
        db,
        'org-1',
        'test',
        expect.objectContaining({ limit: 8 }),
      );
    });

    it('passes custom maxSources and sourceTypes', async () => {
      mockSimilaritySearch.mockResolvedValue([]);
      const db = createMockDb({
        org_frameworks: { data: null },
        tasks: { data: null },
        evidence: { data: null, count: null },
      });

      await buildRAGContext(db, 'org-1', 'test', {
        maxSources: 3,
        sourceTypes: ['policy', 'evidence'],
      });

      expect(mockSimilaritySearch).toHaveBeenCalledWith(
        db,
        'org-1',
        'test',
        expect.objectContaining({
          limit: 3,
          sourceTypes: ['policy', 'evidence'],
        }),
      );
    });

    it('includes control context when controlId provided', async () => {
      mockSimilaritySearch.mockResolvedValue([]);
      const db = createMockDb({
        org_frameworks: { data: null },
        tasks: { data: null },
        evidence: { data: null, count: null },
        org_compliance_controls: {
          data: {
            control_id: 'CC-1.1',
            title: 'Test',
            description: 'Test desc',
            category: 'A',
            status: 'ok',
          },
        },
      });

      const result = await buildRAGContext(db, 'org-1', 'test', {
        controlId: 'ctrl-1',
      });
      expect(result.complianceContext).toContain('CC-1.1');
    });

    it('handles source with no metadata title', async () => {
      mockSimilaritySearch.mockResolvedValue([
        {
          sourceType: 'document',
          sourceId: 'd1',
          metadata: null,
          chunkText: 'Some text here',
          similarity: 0.8,
        },
      ]);

      const db = createMockDb({
        org_frameworks: { data: null },
        tasks: { data: null },
        evidence: { data: null, count: null },
      });

      const result = await buildRAGContext(db, 'org-1', 'query');
      expect(result.sources[0].title).toBe('document');
    });
  });

  describe('buildSystemPrompt', () => {
    it('uses default base prompt when none provided', () => {
      const result = buildSystemPrompt({
        sources: [],
        complianceContext: '',
      });
      expect(result).toContain('FormaOS AI');
    });

    it('uses custom base prompt', () => {
      const result = buildSystemPrompt(
        { sources: [], complianceContext: '' },
        'Custom prompt',
      );
      expect(result).toContain('Custom prompt');
      expect(result).not.toContain('FormaOS AI');
    });

    it('includes compliance context', () => {
      const result = buildSystemPrompt({
        sources: [],
        complianceContext: 'SOC 2: 90% compliant',
      });
      expect(result).toContain('Organization Compliance State');
      expect(result).toContain('SOC 2: 90% compliant');
    });

    it('includes relevant documents section', () => {
      const result = buildSystemPrompt({
        sources: [
          {
            sourceType: 'policy',
            sourceId: 'p1',
            title: 'Access Policy',
            snippet: 'Access control rules...',
            similarity: 0.95,
          },
        ],
        complianceContext: '',
      });
      expect(result).toContain('Relevant Documents');
      expect(result).toContain('[POLICY] Access Policy');
      expect(result).toContain('Cite specific documents');
    });

    it('skips documents section when no sources', () => {
      const result = buildSystemPrompt({
        sources: [],
        complianceContext: 'Some context',
      });
      expect(result).not.toContain('Relevant Documents');
    });
  });

  describe('formatSourcesForResponse', () => {
    it('formats sources with rounded relevance', () => {
      const result = formatSourcesForResponse([
        {
          sourceType: 'evidence',
          sourceId: 'e1',
          title: 'MFA Setup',
          snippet: 'ignore',
          similarity: 0.876,
        },
        {
          sourceType: 'policy',
          sourceId: 'p1',
          title: 'Password Policy',
          snippet: 'ignore',
          similarity: 0.923,
        },
      ]);

      expect(result).toEqual([
        { type: 'evidence', id: 'e1', title: 'MFA Setup', relevance: 88 },
        { type: 'policy', id: 'p1', title: 'Password Policy', relevance: 92 },
      ]);
    });

    it('handles empty sources', () => {
      expect(formatSourcesForResponse([])).toEqual([]);
    });
  });
});
