import {
  AIComplianceAssistant,
  aiAssistant,
  analyzeComplianceDocument,
  getTaskRecommendations,
  askComplianceQuestion,
  categorizeDocument,
  generateComplianceReport,
  predictComplianceRisk,
} from '@/lib/ai-assistant';

// Mock the AI SDK client
const mockGenerateAIText = jest.fn();
const mockIsConfigured = jest.fn();

jest.mock('@/lib/ai/sdk-client', () => ({
  generateAIText: (...args: any[]) => mockGenerateAIText(...args),
  isAISDKConfigured: () => mockIsConfigured(),
}));

describe('AIComplianceAssistant', () => {
  let assistant: AIComplianceAssistant;

  beforeEach(() => {
    jest.clearAllMocks();
    assistant = new AIComplianceAssistant();
    mockIsConfigured.mockReturnValue(true);
  });

  describe('analyzeDocument', () => {
    it('returns parsed JSON response', async () => {
      const mockResult = {
        requirements: ['req1'],
        risks: ['risk1'],
        recommendations: ['rec1'],
      };
      mockGenerateAIText.mockResolvedValue(JSON.stringify(mockResult));

      const result = await assistant.analyzeDocument(
        'policy content',
        'policy',
      );

      expect(result.result).toEqual(mockResult);
      expect(result.confidence).toBe(0.85);
      expect(result.reasoning).toBeDefined();
    });

    it('handles non-JSON response gracefully', async () => {
      mockGenerateAIText.mockResolvedValue('plain text analysis');

      const result = await assistant.analyzeDocument('doc', 'policy');

      expect(result.result).toEqual({ analysis: 'plain text analysis' });
      expect(result.confidence).toBe(0.7);
    });

    it('throws when AI not configured', async () => {
      mockIsConfigured.mockReturnValue(false);

      await expect(assistant.analyzeDocument('doc', 'policy')).rejects.toThrow(
        'OpenAI API key not configured',
      );
    });

    it('throws on empty response', async () => {
      mockGenerateAIText.mockResolvedValue('');

      await expect(assistant.analyzeDocument('doc', 'policy')).rejects.toThrow(
        'OpenAI API error: empty response',
      );
    });
  });

  describe('recommendTasks', () => {
    it('returns parsed task recommendations', async () => {
      const mockTasks = [
        {
          title: 'Task 1',
          description: 'desc',
          priority: 'high',
          estimatedDays: 5,
        },
      ];
      mockGenerateAIText.mockResolvedValue(JSON.stringify(mockTasks));

      const result = await assistant.recommendTasks({
        industry: 'SaaS',
        memberCount: 10,
        existingTasks: ['Existing Task'],
      });

      expect(result.result).toEqual(mockTasks);
      expect(result.confidence).toBe(0.8);
      expect(result.suggestions).toHaveLength(3);
    });

    it('handles non-JSON response', async () => {
      mockGenerateAIText.mockResolvedValue('Some task recommendations');

      const result = await assistant.recommendTasks({
        industry: 'Healthcare',
        memberCount: 5,
        existingTasks: [],
      });

      expect(result.result).toEqual({
        recommendations: 'Some task recommendations',
      });
      expect(result.confidence).toBe(0.6);
    });
  });

  describe('query', () => {
    it('returns answer with confidence', async () => {
      mockGenerateAIText.mockResolvedValue('The answer is 42');

      const result = await assistant.query('What is the meaning?');

      expect(result.result).toEqual({ answer: 'The answer is 42' });
      expect(result.confidence).toBe(0.75);
    });

    it('includes context in prompt when provided', async () => {
      mockGenerateAIText.mockResolvedValue('Answer with context');

      await assistant.query('question', { org: 'test-org' });

      expect(mockGenerateAIText).toHaveBeenCalledWith(
        expect.objectContaining({
          userPrompt: expect.stringContaining('Context:'),
        }),
      );
    });
  });

  describe('categorizeEvidence', () => {
    it('returns parsed category', async () => {
      const mockCategory = {
        category: 'Certificates',
        subcategory: 'SSL',
        tags: ['ssl', 'cert'],
        confidence: 0.9,
      };
      mockGenerateAIText.mockResolvedValue(JSON.stringify(mockCategory));

      const result = await assistant.categorizeEvidence(
        'cert.pdf',
        'SSL cert content',
      );

      expect(result.result).toEqual(mockCategory);
      expect(result.confidence).toBe(0.9);
    });

    it('handles non-JSON response with fallback', async () => {
      mockGenerateAIText.mockResolvedValue('Unable to categorize');

      const result = await assistant.categorizeEvidence('random.txt');

      expect(result.result.category).toBe('Other');
      expect(result.confidence).toBe(0.5);
    });
  });

  describe('generateReport', () => {
    it('returns report summary with suggestions', async () => {
      mockGenerateAIText.mockResolvedValue('Executive summary report...');

      const result = await assistant.generateReport({
        orgName: 'Acme Corp',
        metrics: { score: 85 },
        risks: [{ name: 'overdue tasks' }],
        period: 'Q1 2025',
      });

      expect(result.result).toEqual({ summary: 'Executive summary report...' });
      expect(result.confidence).toBe(0.85);
      expect(result.suggestions).toHaveLength(3);
    });
  });

  describe('predictRisk', () => {
    it('returns parsed risk prediction', async () => {
      const mockPrediction = {
        riskLevel: 'medium',
        trend: 'improving',
        prediction: 'Risk expected to decrease',
        recommendations: ['Continue monitoring'],
      };
      mockGenerateAIText.mockResolvedValue(JSON.stringify(mockPrediction));

      const result = await assistant.predictRisk({
        overdueTasks: [5, 4, 3, 2, 2, 1],
        expiredCerts: [1, 1, 0, 0, 0, 0],
        completionRates: [70, 75, 80, 82, 85, 88],
      });

      expect(result.result).toEqual(mockPrediction);
      expect(result.confidence).toBe(0.75);
      expect(result.reasoning).toBeDefined();
    });

    it('handles non-JSON response', async () => {
      mockGenerateAIText.mockResolvedValue('Risk is moderate');

      const result = await assistant.predictRisk({
        overdueTasks: [5],
        expiredCerts: [1],
        completionRates: [70],
      });

      expect(result.result).toEqual({ prediction: 'Risk is moderate' });
      expect(result.confidence).toBe(0.6);
    });
  });
});

describe('aiAssistant singleton', () => {
  it('is an instance of AIComplianceAssistant', () => {
    expect(aiAssistant).toBeInstanceOf(AIComplianceAssistant);
  });
});

describe('helper functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsConfigured.mockReturnValue(true);
    mockGenerateAIText.mockResolvedValue('{}');
  });

  it('analyzeComplianceDocument delegates to assistant', async () => {
    await analyzeComplianceDocument('content', 'policy');
    expect(mockGenerateAIText).toHaveBeenCalled();
  });

  it('getTaskRecommendations delegates to assistant', async () => {
    await getTaskRecommendations({
      industry: 'SaaS',
      memberCount: 5,
      existingTasks: [],
    });
    expect(mockGenerateAIText).toHaveBeenCalled();
  });

  it('askComplianceQuestion delegates to assistant', async () => {
    await askComplianceQuestion('How to comply?');
    expect(mockGenerateAIText).toHaveBeenCalled();
  });

  it('categorizeDocument delegates to assistant', async () => {
    await categorizeDocument('file.pdf');
    expect(mockGenerateAIText).toHaveBeenCalled();
  });

  it('generateComplianceReport delegates to assistant', async () => {
    await generateComplianceReport({
      orgName: 'Test',
      metrics: {},
      risks: [],
      period: 'Q1',
    });
    expect(mockGenerateAIText).toHaveBeenCalled();
  });

  it('predictComplianceRisk delegates to assistant', async () => {
    await predictComplianceRisk({
      overdueTasks: [],
      expiredCerts: [],
      completionRates: [],
    });
    expect(mockGenerateAIText).toHaveBeenCalled();
  });
});
