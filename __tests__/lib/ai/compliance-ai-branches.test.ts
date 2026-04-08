/**
 * Additional branch-coverage tests for lib/ai/compliance-ai.ts
 * Focuses on fallback heuristic paths not covered by existing test
 */

jest.mock('@/lib/ai/sdk-client', () => ({
  isAISDKConfigured: jest.fn(() => false),
  generateAIText: jest.fn(),
}));

import {
  analyzeEvidenceQuality,
  generateComplianceNarrative,
  suggestControlMappings,
  predictComplianceGaps,
  clearAICache,
  getAIRateLimitStatus,
} from '@/lib/ai/compliance-ai';
import { isAISDKConfigured, generateAIText } from '@/lib/ai/sdk-client';

const mockConfigured = isAISDKConfigured as jest.Mock;
const mockAI = generateAIText as jest.Mock;

describe('compliance-ai fallback branches', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearAICache();
    mockConfigured.mockReturnValue(false);
  });

  describe('analyzeEvidenceQuality fallbacks', () => {
    it('strong file type (docx) + long description + long title', async () => {
      const result = await analyzeEvidenceQuality({
        title:
          'Comprehensive Security Audit Report For Branch Coverage Testing',
        description:
          'A very detailed thorough description that goes well over 100 characters explaining the complete scope and methodology of the security audit evidence item collected during the detailed review process',
        fileType: 'docx',
      });
      expect(result.score).toBeGreaterThanOrEqual(90);
      expect(
        result.suggestions.some((s) => s.includes('meets basic quality')),
      ).toBe(true);
    });

    it('weak file type (csv) + medium description', async () => {
      const result = await analyzeEvidenceQuality({
        title: 'CSV evidence medium description test',
        description:
          'This is a medium-length description that is over 30 chars',
        fileType: 'csv',
      });
      expect(
        result.suggestions.some((s) => s.includes('formal document format')),
      ).toBe(true);
      expect(
        result.suggestions.some((s) => s.includes('more detailed description')),
      ).toBe(true);
    });

    it('unknown file type + short description + short title', async () => {
      const result = await analyzeEvidenceQuality({
        title: 'X',
        description: 'Brief',
        fileType: '.bak',
      });
      expect(
        result.suggestions.some((s) => s.includes('may not be recognized')),
      ).toBe(true);
      expect(result.suggestions.some((s) => s.includes('too brief'))).toBe(
        true,
      );
      expect(
        result.suggestions.some((s) => s.includes('descriptive title')),
      ).toBe(true);
    });

    it('summary wording for fair score', async () => {
      const result = await analyzeEvidenceQuality({
        title: 'X',
        description: 'Y',
        fileType: '.zzz_unique',
      });
      expect(result.summary).toContain('Fair');
    });
  });

  describe('generateComplianceNarrative fallbacks', () => {
    it('0% compliance narrative', async () => {
      const controls = [
        { id: 'c1', title: 'A', status: 'non_compliant' },
        { id: 'c2', title: 'B', status: 'non_compliant' },
      ];
      const result = await generateComplianceNarrative('pci_dss', controls, 1);
      expect(result.narrative).toContain('0%');
      expect(result.narrative).toContain('Significant');
    });

    it('empty controls fallback', async () => {
      const result = await generateComplianceNarrative('nist', [], 0);
      expect(result.narrative).toContain('0%');
    });

    it('100% compliance → maintain recommendation', async () => {
      const controls = [{ id: 'c1', title: 'A', status: 'compliant' }];
      const result = await generateComplianceNarrative('iso', controls, 10);
      expect(
        result.recommendedActions.some((a) => a.includes('Maintain')),
      ).toBe(true);
    });
  });

  describe('suggestControlMappings fallback', () => {
    it('returns fallback with 3 mappings', async () => {
      const result = await suggestControlMappings(
        'Unique control mapping description for fallback test',
      );
      expect(result.mappings).toHaveLength(3);
      expect(result.rationale).toContain('Fallback');
    });
  });

  describe('predictComplianceGaps fallback', () => {
    it('empty scores returns scan suggestion', async () => {
      const result = await predictComplianceGaps([]);
      expect(result.predictions).toEqual([]);
      expect(result.urgentActions[0]).toContain('initial compliance scan');
    });

    it('declining trend for score < 50', async () => {
      const result = await predictComplianceGaps([
        {
          framework: 'gap-test-decline',
          score: 35,
          date: '2024-03-01',
          controlsEvaluated: 20,
          nonCompliant: 12,
        },
      ]);
      expect(result.predictions[0].trend).toBe('declining');
      expect(result.predictions[0].predictedScore).toBe(30);
      expect(result.predictions[0].confidence).toBe(0.6);
    });

    it('stable trend for moderate score', async () => {
      const result = await predictComplianceGaps([
        {
          framework: 'gap-test-stable',
          score: 65,
          date: '2024-03-01',
          controlsEvaluated: 30,
          nonCompliant: 0,
        },
      ]);
      expect(result.predictions[0].trend).toBe('stable');
      expect(result.predictions[0].predictedScore).toBe(65);
    });

    it('improving trend with no risk areas when score >= 80 and 0 non-compliant', async () => {
      const result = await predictComplianceGaps([
        {
          framework: 'gap-test-improve',
          score: 90,
          date: '2024-03-01',
          controlsEvaluated: 50,
          nonCompliant: 0,
        },
      ]);
      expect(result.predictions[0].trend).toBe('improving');
      expect(result.predictions[0].riskAreas).toEqual([]);
    });

    it('multiple frameworks deduplicates to latest', async () => {
      const result = await predictComplianceGaps([
        {
          framework: 'gap-dedup',
          score: 40,
          date: '2024-01-01',
          controlsEvaluated: 20,
          nonCompliant: 10,
        },
        {
          framework: 'gap-dedup',
          score: 85,
          date: '2024-06-01',
          controlsEvaluated: 20,
          nonCompliant: 1,
        },
      ]);
      expect(result.predictions).toHaveLength(1);
      expect(result.predictions[0].currentScore).toBe(85);
    });

    it('urgent for low average + declining', async () => {
      const result = await predictComplianceGaps([
        {
          framework: 'gap-urgent',
          score: 25,
          date: '2024-01-01',
          controlsEvaluated: 10,
          nonCompliant: 8,
        },
      ]);
      expect(result.urgentActions.some((a) => a.includes('declining'))).toBe(
        true,
      );
      expect(
        result.urgentActions.some((a) => a.includes('remediation sprint')),
      ).toBe(true);
      expect(result.overallOutlook).toContain('Immediate action');
    });

    it('moderate outlook message for average score 50-80', async () => {
      const result = await predictComplianceGaps([
        {
          framework: 'gap-mod',
          score: 60,
          date: '2024-01-01',
          controlsEvaluated: 30,
          nonCompliant: 5,
        },
      ]);
      expect(result.overallOutlook).toContain('Moderate');
    });

    it('strong outlook for high average >= 80', async () => {
      const result = await predictComplianceGaps([
        {
          framework: 'gap-strong',
          score: 92,
          date: '2024-01-01',
          controlsEvaluated: 50,
          nonCompliant: 0,
        },
      ]);
      expect(result.overallOutlook).toContain('strong posture');
    });
  });

  describe('AI parse error fallback', () => {
    it('analyzeEvidenceQuality falls back on invalid AI JSON', async () => {
      mockConfigured.mockReturnValue(true);
      mockAI.mockResolvedValue('not valid json at all');
      const result = await analyzeEvidenceQuality({
        title: 'AI parse error fallback test evidence item unique',
        description:
          'Test evidence for parse error branch coverage testing path',
        fileType: 'pdf',
      });
      expect(result.score).toBeGreaterThan(0);
    });

    it('suggestControlMappings falls back on invalid AI JSON', async () => {
      mockConfigured.mockReturnValue(true);
      mockAI.mockResolvedValue('{invalid json}}');
      const result = await suggestControlMappings(
        'AI control mapping parse error fallback unique test identifier',
      );
      expect(result.mappings.length).toBeGreaterThan(0);
      expect(result.rationale).toContain('Fallback');
    });

    it('generateComplianceNarrative falls back on invalid AI JSON', async () => {
      mockConfigured.mockReturnValue(true);
      mockAI.mockResolvedValue('oops');
      const controls = [{ id: 'c1', title: 'A', status: 'compliant' }];
      const result = await generateComplianceNarrative(
        'ai-parse-error-narrative',
        controls,
        5,
      );
      expect(result.narrative).toBeTruthy();
    });

    it('predictComplianceGaps falls back on invalid AI JSON', async () => {
      mockConfigured.mockReturnValue(true);
      mockAI.mockResolvedValue('nope');
      const result = await predictComplianceGaps([
        {
          framework: 'ai-parse-gap',
          score: 70,
          date: '2024-01-01',
          controlsEvaluated: 20,
          nonCompliant: 5,
        },
      ]);
      expect(result.predictions.length).toBeGreaterThan(0);
    });
  });

  describe('rate limit status', () => {
    it('returns remaining and resetAt', () => {
      const status = getAIRateLimitStatus();
      expect(status.remaining).toBeGreaterThanOrEqual(0);
      expect(status.remaining).toBeLessThanOrEqual(10);
      expect(typeof status.resetAt).toBe('number');
    });
  });
});
