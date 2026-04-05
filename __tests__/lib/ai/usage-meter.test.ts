import {
  MODEL_REGISTRY,
  trackUsage,
  getOrgUsage,
  getUserUsage,
  checkUsageLimit,
  getUsageSummary,
} from '@/lib/ai/usage-meter';

function createMockDB(data: any[] = []) {
  const chain: any = {};
  chain.from = jest.fn(() => chain);
  chain.insert = jest.fn(() => chain);
  chain.select = jest.fn(() => chain);
  chain.eq = jest.fn(() => chain);
  chain.gte = jest.fn(() => chain);
  chain.lte = jest.fn(() => chain);
  chain.then = jest.fn((resolve: any) => resolve({ data, error: null }));
  return chain;
}

describe('MODEL_REGISTRY', () => {
  it('contains gpt-4o-mini', () => {
    const model = MODEL_REGISTRY['gpt-4o-mini'];
    expect(model).toBeDefined();
    expect(model.name).toBe('GPT-4o Mini');
    expect(model.inputCostPer1K).toBeGreaterThan(0);
    expect(model.outputCostPer1K).toBeGreaterThan(0);
    expect(model.maxContextTokens).toBe(128000);
  });

  it('contains gpt-4o', () => {
    const model = MODEL_REGISTRY['gpt-4o'];
    expect(model).toBeDefined();
    expect(model.inputCostPer1K).toBeGreaterThan(
      MODEL_REGISTRY['gpt-4o-mini'].inputCostPer1K,
    );
  });

  it('contains text-embedding-3-small with zero output cost', () => {
    const model = MODEL_REGISTRY['text-embedding-3-small'];
    expect(model).toBeDefined();
    expect(model.outputCostPer1K).toBe(0);
  });
});

describe('trackUsage', () => {
  it('inserts usage record with calculated cost', async () => {
    const db = createMockDB();
    await trackUsage(db, 'org-1', 'user-1', 'gpt-4o-mini', 1000, 500);

    expect(db.from).toHaveBeenCalledWith('ai_usage_log');
    expect(db.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        org_id: 'org-1',
        user_id: 'user-1',
        model: 'gpt-4o-mini',
        input_tokens: 1000,
        output_tokens: 500,
        total_tokens: 1500,
        feature: 'chat',
      }),
    );
    // Verify cost calculation
    const insertArg = db.insert.mock.calls[0][0];
    expect(insertArg.cost_usd).toBeGreaterThan(0);
  });

  it('passes optional conversationId and feature', async () => {
    const db = createMockDB();
    await trackUsage(
      db,
      'org-1',
      'user-1',
      'gpt-4o',
      100,
      50,
      'conv-123',
      'analysis',
    );
    const insertArg = db.insert.mock.calls[0][0];
    expect(insertArg.conversation_id).toBe('conv-123');
    expect(insertArg.feature).toBe('analysis');
  });

  it('sets cost to 0 for unknown model', async () => {
    const db = createMockDB();
    await trackUsage(db, 'org-1', 'user-1', 'unknown-model', 100, 50);
    const insertArg = db.insert.mock.calls[0][0];
    expect(insertArg.cost_usd).toBe(0);
  });
});

describe('getOrgUsage', () => {
  it('returns aggregated usage data', async () => {
    const rows = [
      {
        model: 'gpt-4o-mini',
        total_tokens: 1000,
        cost_usd: '0.05',
        created_at: '2024-01-15T10:00:00Z',
      },
      {
        model: 'gpt-4o-mini',
        total_tokens: 2000,
        cost_usd: '0.10',
        created_at: '2024-01-15T11:00:00Z',
      },
      {
        model: 'gpt-4o',
        total_tokens: 500,
        cost_usd: '0.20',
        created_at: '2024-01-16T10:00:00Z',
      },
    ];
    const db = createMockDB(rows);

    const result = await getOrgUsage(db, 'org-1', {
      from: '2024-01-01',
      to: '2024-01-31',
    });
    expect(result.totalMessages).toBe(3);
    expect(result.totalTokens).toBe(3500);
    expect(result.totalCost).toBeCloseTo(0.35);
    expect(result.byModel['gpt-4o-mini'].messages).toBe(2);
    expect(result.byModel['gpt-4o'].messages).toBe(1);
    expect(result.byDay).toHaveLength(2);
    expect(result.byDay[0].date).toBe('2024-01-15');
  });

  it('handles empty data', async () => {
    const db = createMockDB([]);
    const result = await getOrgUsage(db, 'org-1', {
      from: '2024-01-01',
      to: '2024-01-31',
    });
    expect(result.totalMessages).toBe(0);
    expect(result.totalTokens).toBe(0);
    expect(result.byDay).toEqual([]);
  });
});

describe('getUserUsage', () => {
  it('returns user-level aggregation', async () => {
    const rows = [
      { total_tokens: 500, cost_usd: '0.02' },
      { total_tokens: 300, cost_usd: '0.01' },
    ];
    const db = createMockDB(rows);

    const result = await getUserUsage(db, 'org-1', 'user-1', {
      from: '2024-01-01',
      to: '2024-01-31',
    });
    expect(result.totalMessages).toBe(2);
    expect(result.totalTokens).toBe(800);
    expect(result.totalCost).toBeCloseTo(0.03);
  });
});

describe('checkUsageLimit', () => {
  it('allows usage under limit for starter plan', async () => {
    const db = createMockDB([]);
    const result = await checkUsageLimit(db, 'org-1', 'starter');
    expect(result.allowed).toBe(true);
    expect(result.messagesUsed).toBe(0);
    expect(result.messagesLimit).toBe(1000);
    expect(result.percentUsed).toBe(0);
  });

  it('allows unlimited usage for enterprise plan', async () => {
    const db = createMockDB([]);
    const result = await checkUsageLimit(db, 'org-1', 'enterprise');
    expect(result.allowed).toBe(true);
    expect(result.messagesLimit).toBe(-1);
    expect(result.percentUsed).toBe(0);
  });

  it('defaults to starter for unknown plan', async () => {
    const db = createMockDB([]);
    const result = await checkUsageLimit(db, 'org-1', 'nonexistent');
    expect(result.messagesLimit).toBe(1000);
  });
});

describe('getUsageSummary', () => {
  it('returns summary with remaining counts', async () => {
    const db = createMockDB([]);
    const result = await getUsageSummary(db, 'org-1', 'pro');
    expect(result.currentPeriod.messages).toBe(0);
    expect(result.remaining.messages).toBe(10000);
    expect(result.percentUsed).toBe(0);
  });

  it('returns -1 remaining for enterprise unlimited', async () => {
    const db = createMockDB([]);
    const result = await getUsageSummary(db, 'org-1', 'enterprise');
    expect(result.remaining.messages).toBe(-1);
    expect(result.remaining.tokens).toBe(-1);
  });
});
