/**
 * AI Usage Metering - Track token usage, costs, and plan limits
 */

import { SupabaseClient } from '@supabase/supabase-js';

// ---- Model Pricing (per 1K tokens) ----

interface ModelConfig {
  name: string;
  inputCostPer1K: number;
  outputCostPer1K: number;
  maxContextTokens: number;
}

export const MODEL_REGISTRY: Record<string, ModelConfig> = {
  'gpt-4o-mini': {
    name: 'GPT-4o Mini',
    inputCostPer1K: 0.00015,
    outputCostPer1K: 0.0006,
    maxContextTokens: 128000,
  },
  'gpt-4o': {
    name: 'GPT-4o',
    inputCostPer1K: 0.0025,
    outputCostPer1K: 0.01,
    maxContextTokens: 128000,
  },
  'text-embedding-3-small': {
    name: 'Embedding Small',
    inputCostPer1K: 0.00002,
    outputCostPer1K: 0,
    maxContextTokens: 8191,
  },
};

// ---- Plan Limits ----

interface PlanLimits {
  messagesPerMonth: number;
  tokensPerMonth: number;
  modelsAllowed: string[];
}

const PLAN_LIMITS: Record<string, PlanLimits> = {
  starter: {
    messagesPerMonth: 1000,
    tokensPerMonth: 500000,
    modelsAllowed: ['gpt-4o-mini'],
  },
  pro: {
    messagesPerMonth: 10000,
    tokensPerMonth: 5000000,
    modelsAllowed: ['gpt-4o-mini', 'gpt-4o'],
  },
  enterprise: {
    messagesPerMonth: -1, // unlimited
    tokensPerMonth: -1,
    modelsAllowed: ['gpt-4o-mini', 'gpt-4o'],
  },
};

// ---- Usage Tracking ----

export async function trackUsage(
  db: SupabaseClient,
  orgId: string,
  userId: string,
  model: string,
  inputTokens: number,
  outputTokens: number,
  conversationId?: string,
  feature?: string,
): Promise<void> {
  const config = MODEL_REGISTRY[model];
  const totalTokens = inputTokens + outputTokens;
  const costUsd = config
    ? (inputTokens / 1000) * config.inputCostPer1K +
      (outputTokens / 1000) * config.outputCostPer1K
    : 0;

  await db.from('ai_usage_log').insert({
    org_id: orgId,
    user_id: userId,
    model,
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    total_tokens: totalTokens,
    cost_usd: costUsd,
    conversation_id: conversationId ?? null,
    feature: feature ?? 'chat',
  });
}

// ---- Usage Queries ----

export async function getOrgUsage(
  db: SupabaseClient,
  orgId: string,
  period: { from: string; to: string },
): Promise<{
  totalMessages: number;
  totalTokens: number;
  totalCost: number;
  byModel: Record<string, { tokens: number; cost: number; messages: number }>;
  byDay: Array<{
    date: string;
    tokens: number;
    cost: number;
    messages: number;
  }>;
}> {
  const { data } = await db
    .from('ai_usage_log')
    .select('model, total_tokens, cost_usd, created_at')
    .eq('org_id', orgId)
    .gte('created_at', period.from)
    .lte('created_at', period.to);

  const rows = data ?? [];
  const byModel: Record<
    string,
    { tokens: number; cost: number; messages: number }
  > = {};
  const byDayMap: Record<
    string,
    { tokens: number; cost: number; messages: number }
  > = {};

  let totalTokens = 0;
  let totalCost = 0;

  for (const row of rows) {
    totalTokens += row.total_tokens;
    totalCost += Number(row.cost_usd);

    // By model
    if (!byModel[row.model]) {
      byModel[row.model] = { tokens: 0, cost: 0, messages: 0 };
    }
    byModel[row.model].tokens += row.total_tokens;
    byModel[row.model].cost += Number(row.cost_usd);
    byModel[row.model].messages += 1;

    // By day
    const day = row.created_at.slice(0, 10);
    if (!byDayMap[day]) {
      byDayMap[day] = { tokens: 0, cost: 0, messages: 0 };
    }
    byDayMap[day].tokens += row.total_tokens;
    byDayMap[day].cost += Number(row.cost_usd);
    byDayMap[day].messages += 1;
  }

  const byDay = Object.entries(byDayMap)
    .map(([date, stats]) => ({ date, ...stats }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    totalMessages: rows.length,
    totalTokens,
    totalCost,
    byModel,
    byDay,
  };
}

export async function getUserUsage(
  db: SupabaseClient,
  orgId: string,
  userId: string,
  period: { from: string; to: string },
): Promise<{ totalMessages: number; totalTokens: number; totalCost: number }> {
  const { data } = await db
    .from('ai_usage_log')
    .select('total_tokens, cost_usd')
    .eq('org_id', orgId)
    .eq('user_id', userId)
    .gte('created_at', period.from)
    .lte('created_at', period.to);

  const rows = data ?? [];
  return {
    totalMessages: rows.length,
    totalTokens: rows.reduce((sum, r) => sum + r.total_tokens, 0),
    totalCost: rows.reduce((sum, r) => sum + Number(r.cost_usd), 0),
  };
}

export async function checkUsageLimit(
  db: SupabaseClient,
  orgId: string,
  planCode: string,
): Promise<{
  allowed: boolean;
  messagesUsed: number;
  messagesLimit: number;
  tokensUsed: number;
  tokensLimit: number;
  percentUsed: number;
}> {
  const limits = PLAN_LIMITS[planCode] ?? PLAN_LIMITS.starter;

  // Current month range
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const to = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
    23,
    59,
    59,
  ).toISOString();

  const usage = await getOrgUsage(db, orgId, { from, to });

  const messagesLimit = limits.messagesPerMonth;
  const tokensLimit = limits.tokensPerMonth;
  const allowed =
    (messagesLimit === -1 || usage.totalMessages < messagesLimit) &&
    (tokensLimit === -1 || usage.totalTokens < tokensLimit);

  const percentUsed =
    messagesLimit === -1
      ? 0
      : Math.round((usage.totalMessages / messagesLimit) * 100);

  return {
    allowed,
    messagesUsed: usage.totalMessages,
    messagesLimit,
    tokensUsed: usage.totalTokens,
    tokensLimit,
    percentUsed,
  };
}

export async function getUsageSummary(
  db: SupabaseClient,
  orgId: string,
  planCode: string,
): Promise<{
  currentPeriod: { messages: number; tokens: number; cost: number };
  remaining: { messages: number; tokens: number };
  percentUsed: number;
}> {
  const limitCheck = await checkUsageLimit(db, orgId, planCode);

  return {
    currentPeriod: {
      messages: limitCheck.messagesUsed,
      tokens: limitCheck.tokensUsed,
      cost: 0, // Calculated separately if needed
    },
    remaining: {
      messages:
        limitCheck.messagesLimit === -1
          ? -1
          : Math.max(0, limitCheck.messagesLimit - limitCheck.messagesUsed),
      tokens:
        limitCheck.tokensLimit === -1
          ? -1
          : Math.max(0, limitCheck.tokensLimit - limitCheck.tokensUsed),
    },
    percentUsed: limitCheck.percentUsed,
  };
}
