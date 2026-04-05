jest.mock('@/lib/ai/sdk-client', () => ({
  generateAIText: jest.fn(),
  isAISDKConfigured: jest.fn(),
}));

import {
  isAIAvailable,
  getAIRateLimitStatus,
  analyzeEvidenceQuality,
  generateComplianceNarrative,
  suggestControlMappings,
  predictComplianceGaps,
  clearAICache,
} from '@/lib/ai/compliance-ai';
import { isAISDKConfigured, generateAIText } from '@/lib/ai/sdk-client';

const mockIsConfigured = isAISDKConfigured as jest.Mock;
const mockGenerateAI = generateAIText as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  clearAICache();
  mockIsConfigured.mockReturnValue(false);
  mockGenerateAI.mockResolvedValue(null);
});

describe('isAIAvailable', () => {
  it('returns false when SDK not configured', () => {
    mockIsConfigured.mockReturnValue(false);
    expect(isAIAvailable()).toBe(false);
  });

  it('returns true when SDK is configured', () => {
    mockIsConfigured.mockReturnValue(true);
    expect(isAIAvailable()).toBe(true);
  });
});

describe('getAIRateLimitStatus', () => {
  it('returns remaining count and reset time', () => {
    const status = getAIRateLimitStatus();
    expect(status).toHaveProperty('remaining');
    expect(status).toHaveProperty('resetAt');
    expect(typeof status.remaining).toBe('number');
    expect(status.remaining).toBeGreaterThanOrEqual(0);
    expect(status.remaining).toBeLessThanOrEqual(10);
  });
});

describe('analyzeEvidenceQuality', () => {
  const evidence = {
    title: 'Security Policy Document',
    description:
      'Comprehensive access control policy covering all systems and user roles for the organization',
    fileType: 'pdf',
  };

  it('returns fallback heuristic when AI unavailable', async () => {
    const result = await analyzeEvidenceQuality(evidence);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.suggestions).toBeInstanceOf(Array);
    expect(result.summary).toBeTruthy();
  });

  it('gives higher score for strong file types (pdf)', async () => {
    const pdfResult = await analyzeEvidenceQuality({
      ...evidence,
      fileType: 'pdf',
    });
    clearAICache();
    const txtResult = await analyzeEvidenceQuality({
      ...evidence,
      fileType: 'txt',
    });
    expect(pdfResult.score).toBeGreaterThan(txtResult.score);
  });

  it('gives higher score for longer descriptions', async () => {
    const longDesc = await analyzeEvidenceQuality(evidence);
    clearAICache();
    const shortDesc = await analyzeEvidenceQuality({
      ...evidence,
      description: 'short',
    });
    expect(longDesc.score).toBeGreaterThan(shortDesc.score);
  });

  it('returns cached result on second call', async () => {
    const first = await analyzeEvidenceQuality(evidence);
    const second = await analyzeEvidenceQuality(evidence);
    expect(first).toEqual(second);
  });

  it('parses AI response when SDK is configured', async () => {
    mockIsConfigured.mockReturnValue(true);
    mockGenerateAI.mockResolvedValue(
      JSON.stringify({
        score: 85,
        suggestions: ['Add timestamps'],
        summary: 'Good quality evidence.',
      }),
    );

    const result = await analyzeEvidenceQuality({
      title: 'Unique AI Test',
      description: 'Test description for AI parsing flow',
      fileType: 'docx',
    });
    expect(result.score).toBe(85);
    expect(result.suggestions).toContain('Add timestamps');
    expect(result.summary).toBe('Good quality evidence.');
  });
});

describe('generateComplianceNarrative', () => {
  const controls = [
    { id: 'CC1.1', title: 'Control Environment', status: 'compliant' },
    { id: 'CC1.2', title: 'Board Oversight', status: 'non_compliant' },
    { id: 'CC1.3', title: 'Management Philosophy', status: 'compliant' },
  ];

  it('generates fallback narrative when AI unavailable', async () => {
    const result = await generateComplianceNarrative('soc2', controls, 10);
    expect(result.narrative).toContain('SOC2');
    expect(result.narrative).toContain('3 controls');
    expect(result.keyPoints).toBeInstanceOf(Array);
    expect(result.keyPoints.length).toBeGreaterThan(0);
    expect(result.recommendedActions).toBeInstanceOf(Array);
  });

  it('includes compliance percentage in fallback', async () => {
    const result = await generateComplianceNarrative('soc2', controls, 10);
    // 2 out of 3 = 67%
    expect(result.narrative).toContain('67%');
  });

  it('returns 100% message when all compliant', async () => {
    clearAICache();
    const allCompliant = controls.map((c) => ({ ...c, status: 'compliant' }));
    const result = await generateComplianceNarrative(
      'iso27001',
      allCompliant,
      5,
    );
    expect(result.recommendedActions).toEqual(
      expect.arrayContaining([expect.stringContaining('Maintain')]),
    );
  });
});

describe('suggestControlMappings', () => {
  it('returns fallback mappings when AI unavailable', async () => {
    const result = await suggestControlMappings(
      'Access control policy for user authentication',
    );
    expect(result.mappings).toBeInstanceOf(Array);
    expect(result.mappings.length).toBeGreaterThan(0);
    expect(result.rationale).toContain('Fallback');
    for (const mapping of result.mappings) {
      expect(mapping).toHaveProperty('framework');
      expect(mapping).toHaveProperty('controlId');
      expect(mapping).toHaveProperty('relevance');
      expect(mapping.relevance).toBeGreaterThanOrEqual(0);
      expect(mapping.relevance).toBeLessThanOrEqual(100);
    }
  });
});

describe('predictComplianceGaps', () => {
  it('returns empty predictions with guidance for empty scores', async () => {
    const result = await predictComplianceGaps([]);
    expect(result.predictions).toEqual([]);
    expect(result.overallOutlook).toContain('No compliance data');
    expect(result.urgentActions).toHaveLength(1);
  });

  it('generates fallback predictions from score data', async () => {
    const scores = [
      {
        framework: 'soc2',
        score: 85,
        date: '2024-01-15',
        controlsEvaluated: 50,
        nonCompliant: 3,
      },
      {
        framework: 'iso27001',
        score: 45,
        date: '2024-01-15',
        controlsEvaluated: 80,
        nonCompliant: 20,
      },
    ];
    const result = await predictComplianceGaps(scores);
    expect(result.predictions).toHaveLength(2);

    const soc2Pred = result.predictions.find((p) => p.framework === 'soc2');
    expect(soc2Pred).toBeDefined();
    expect(soc2Pred!.trend).toBe('improving');
    expect(soc2Pred!.predictedScore).toBeGreaterThan(soc2Pred!.currentScore);

    const isoPred = result.predictions.find((p) => p.framework === 'iso27001');
    expect(isoPred).toBeDefined();
    expect(isoPred!.trend).toBe('declining');
    expect(isoPred!.riskAreas.length).toBeGreaterThan(0);
  });

  it('includes overall outlook with average score', async () => {
    const scores = [
      {
        framework: 'soc2',
        score: 90,
        date: '2024-01-15',
        controlsEvaluated: 50,
        nonCompliant: 1,
      },
    ];
    const result = await predictComplianceGaps(scores);
    expect(result.overallOutlook).toContain('90%');
  });
});

describe('clearAICache', () => {
  it('clears the cache so next calls fetch fresh data', async () => {
    await analyzeEvidenceQuality({
      title: 'Cache Test',
      description: 'testing cache clearing',
      fileType: 'pdf',
    });
    clearAICache();
    // After clearing, calling with same args should still work
    const result = await analyzeEvidenceQuality({
      title: 'Cache Test',
      description: 'testing cache clearing',
      fileType: 'pdf',
    });
    expect(result.score).toBeGreaterThan(0);
  });
});
