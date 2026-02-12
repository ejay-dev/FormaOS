/**
 * =========================================================
 * AI-Powered Compliance Insights (OpenAI Integration)
 * =========================================================
 * Uses GPT-4o-mini for cost-efficient compliance analysis:
 * - Evidence quality scoring and recommendations
 * - Audit response narrative generation
 * - Cross-framework control mapping suggestions
 * - Compliance gap prediction and trend analysis
 *
 * Features:
 * - Graceful fallback when OPENAI_API_KEY is not set
 * - 1-hour in-memory result cache to reduce API calls
 * - Rate limiting to 10 requests/minute
 */

import OpenAI from 'openai';
import type { ComplianceFramework } from '@/lib/compliance/scanner';

// ---------------------------------------------------------------------------
// OpenAI client (lazy-initialised, null when key is missing)
// ---------------------------------------------------------------------------

let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI | null {
  if (openaiClient) return openaiClient;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn(
      '[compliance-ai] OPENAI_API_KEY is not set. AI features will use fallback responses.',
    );
    return null;
  }

  openaiClient = new OpenAI({ apiKey });
  return openaiClient;
}

/** Check whether the OpenAI integration is available */
export function isAIAvailable(): boolean {
  return !!process.env.OPENAI_API_KEY;
}

// ---------------------------------------------------------------------------
// Cache layer (1-hour TTL, in-memory)
// ---------------------------------------------------------------------------

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const AI_CACHE_TTL = 60 * 60 * 1000; // 1 hour
const aiCache = new Map<string, CacheEntry<unknown>>();

function getCached<T>(key: string): T | null {
  const entry = aiCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > AI_CACHE_TTL) {
    aiCache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCache<T>(key: string, data: T): void {
  aiCache.set(key, { data, timestamp: Date.now() });

  // Prevent unbounded growth
  if (aiCache.size > 500) {
    const entries = Array.from(aiCache.entries());
    entries
      .sort((a, b) => a[1].timestamp - b[1].timestamp)
      .slice(0, 50)
      .forEach(([k]) => aiCache.delete(k));
  }
}

// ---------------------------------------------------------------------------
// Rate limiter (10 requests / minute, per-process)
// ---------------------------------------------------------------------------

const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

let rateLimitState = {
  count: 0,
  windowStart: Date.now(),
};

function checkAIRateLimit(): boolean {
  const now = Date.now();
  if (now - rateLimitState.windowStart > RATE_LIMIT_WINDOW) {
    rateLimitState = { count: 0, windowStart: now };
  }
  if (rateLimitState.count >= RATE_LIMIT_MAX) {
    return false;
  }
  rateLimitState.count += 1;
  return true;
}

export function getAIRateLimitStatus(): {
  remaining: number;
  resetAt: number;
} {
  const now = Date.now();
  if (now - rateLimitState.windowStart > RATE_LIMIT_WINDOW) {
    return { remaining: RATE_LIMIT_MAX, resetAt: now + RATE_LIMIT_WINDOW };
  }
  return {
    remaining: Math.max(0, RATE_LIMIT_MAX - rateLimitState.count),
    resetAt: rateLimitState.windowStart + RATE_LIMIT_WINDOW,
  };
}

// ---------------------------------------------------------------------------
// Shared helper: call OpenAI with error handling
// ---------------------------------------------------------------------------

const MODEL = 'gpt-4o-mini';

async function callOpenAI(
  systemPrompt: string,
  userPrompt: string,
): Promise<string | null> {
  const client = getOpenAIClient();
  if (!client) return null;

  if (!checkAIRateLimit()) {
    console.warn('[compliance-ai] Rate limit reached. Skipping OpenAI call.');
    return null;
  }

  try {
    const response = await client.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3, // lower temperature for deterministic compliance output
      max_tokens: 1024,
    });

    return response.choices[0]?.message?.content?.trim() ?? null;
  } catch (error) {
    console.error('[compliance-ai] OpenAI API error:', error);
    return null;
  }
}

// ---------------------------------------------------------------------------
// 1. Analyze Evidence Quality
// ---------------------------------------------------------------------------

export interface EvidenceQualityResult {
  score: number; // 0-100
  suggestions: string[];
  summary: string;
}

export async function analyzeEvidenceQuality(evidence: {
  title: string;
  description: string;
  fileType: string;
}): Promise<EvidenceQualityResult> {
  const cacheKey = `evidence-quality:${evidence.title}:${evidence.fileType}`;
  const cached = getCached<EvidenceQualityResult>(cacheKey);
  if (cached) return cached;

  const systemPrompt = `You are an expert compliance auditor evaluating evidence quality for SOC 2, ISO 27001, and GDPR frameworks.
Respond ONLY with valid JSON in this exact schema:
{
  "score": <number 0-100>,
  "suggestions": [<string>, ...],
  "summary": "<one-sentence quality summary>"
}
Do not include any text outside the JSON object.`;

  const userPrompt = `Evaluate the quality of this compliance evidence:
Title: ${evidence.title}
Description: ${evidence.description}
File type: ${evidence.fileType}

Score criteria:
- Relevance to compliance controls (0-25)
- Completeness of documentation (0-25)
- Clarity and auditability (0-25)
- File type appropriateness (0-25)`;

  const raw = await callOpenAI(systemPrompt, userPrompt);

  if (raw) {
    try {
      const parsed = JSON.parse(raw) as EvidenceQualityResult;
      const result: EvidenceQualityResult = {
        score: Math.min(100, Math.max(0, Math.round(parsed.score))),
        suggestions: Array.isArray(parsed.suggestions)
          ? parsed.suggestions.slice(0, 5)
          : [],
        summary: parsed.summary || 'Analysis complete.',
      };
      setCache(cacheKey, result);
      return result;
    } catch {
      console.warn('[compliance-ai] Failed to parse evidence quality response');
    }
  }

  // Fallback: heuristic scoring when OpenAI is unavailable
  const fallback = generateEvidenceQualityFallback(evidence);
  setCache(cacheKey, fallback);
  return fallback;
}

function generateEvidenceQualityFallback(evidence: {
  title: string;
  description: string;
  fileType: string;
}): EvidenceQualityResult {
  let score = 50;
  const suggestions: string[] = [];

  // File type scoring
  const strongFileTypes = ['pdf', 'docx', 'xlsx', 'png', 'jpg', 'jpeg'];
  const weakFileTypes = ['txt', 'csv'];
  const fileExt = evidence.fileType.toLowerCase().replace('.', '');

  if (strongFileTypes.includes(fileExt)) {
    score += 15;
  } else if (weakFileTypes.includes(fileExt)) {
    score += 5;
    suggestions.push(
      'Consider using a more formal document format (PDF or DOCX) for better audit acceptance.',
    );
  } else {
    suggestions.push(
      `File type "${evidence.fileType}" may not be recognized by all auditors. Consider converting to PDF.`,
    );
  }

  // Description scoring
  if (evidence.description.length > 100) {
    score += 15;
  } else if (evidence.description.length > 30) {
    score += 8;
    suggestions.push(
      'Provide a more detailed description to improve auditability.',
    );
  } else {
    suggestions.push(
      'Evidence description is too brief. Include context, dates, and relevant control references.',
    );
  }

  // Title scoring
  if (evidence.title.length > 10) {
    score += 10;
  } else {
    suggestions.push(
      'Use a descriptive title that references the compliance control or requirement.',
    );
  }

  if (suggestions.length === 0) {
    suggestions.push(
      'Evidence meets basic quality standards. Consider adding timestamps and reviewer signatures for stronger audit support.',
    );
  }

  return {
    score: Math.min(100, score),
    suggestions,
    summary: `Heuristic quality assessment: ${score >= 70 ? 'Good' : score >= 40 ? 'Fair' : 'Needs improvement'}.`,
  };
}

// ---------------------------------------------------------------------------
// 2. Generate Compliance Narrative
// ---------------------------------------------------------------------------

export interface ComplianceNarrativeResult {
  narrative: string;
  keyPoints: string[];
  recommendedActions: string[];
}

export async function generateComplianceNarrative(
  framework: ComplianceFramework | string,
  controls: Array<{ id: string; title: string; status: string }>,
  evidenceCount: number,
): Promise<ComplianceNarrativeResult> {
  const cacheKey = `narrative:${framework}:${controls.length}:${evidenceCount}`;
  const cached = getCached<ComplianceNarrativeResult>(cacheKey);
  if (cached) return cached;

  const controlSummary = controls
    .slice(0, 20) // limit context window
    .map((c) => `- ${c.id}: ${c.title} [${c.status}]`)
    .join('\n');

  const systemPrompt = `You are a compliance officer drafting an audit response narrative.
Respond ONLY with valid JSON:
{
  "narrative": "<2-3 paragraph professional narrative>",
  "keyPoints": ["<string>", ...],
  "recommendedActions": ["<string>", ...]
}
Do not include any text outside the JSON object.`;

  const userPrompt = `Generate an audit response narrative for a ${framework.toUpperCase()} compliance assessment.

Controls evaluated: ${controls.length}
Evidence items collected: ${evidenceCount}

Control status breakdown:
${controlSummary}

The narrative should address:
1. Current compliance posture and readiness
2. Key strengths and areas meeting requirements
3. Identified gaps and remediation timeline`;

  const raw = await callOpenAI(systemPrompt, userPrompt);

  if (raw) {
    try {
      const parsed = JSON.parse(raw) as ComplianceNarrativeResult;
      const result: ComplianceNarrativeResult = {
        narrative: parsed.narrative || '',
        keyPoints: Array.isArray(parsed.keyPoints)
          ? parsed.keyPoints.slice(0, 5)
          : [],
        recommendedActions: Array.isArray(parsed.recommendedActions)
          ? parsed.recommendedActions.slice(0, 5)
          : [],
      };
      setCache(cacheKey, result);
      return result;
    } catch {
      console.warn('[compliance-ai] Failed to parse narrative response');
    }
  }

  // Fallback narrative
  const compliant = controls.filter((c) => c.status === 'compliant').length;
  const total = controls.length;
  const pct = total > 0 ? Math.round((compliant / total) * 100) : 0;

  const fallback: ComplianceNarrativeResult = {
    narrative: `The organization has undergone a ${framework.toUpperCase()} compliance assessment covering ${total} controls with ${evidenceCount} supporting evidence items. Currently, ${compliant} of ${total} controls (${pct}%) meet compliance requirements. ${pct >= 80 ? 'The organization demonstrates strong compliance posture with minor areas for improvement.' : pct >= 50 ? 'Several controls require additional attention to achieve full compliance.' : 'Significant remediation efforts are needed to meet the compliance threshold.'}`,
    keyPoints: [
      `${compliant} of ${total} controls are compliant (${pct}%)`,
      `${evidenceCount} evidence items have been collected`,
      `Framework: ${framework.toUpperCase()}`,
    ],
    recommendedActions:
      pct < 100
        ? [
            'Address non-compliant controls starting with highest severity',
            'Upload additional evidence for partially compliant controls',
            'Schedule follow-up assessment within 30 days',
          ]
        : ['Maintain current compliance posture through regular reviews'],
  };

  setCache(cacheKey, fallback);
  return fallback;
}

// ---------------------------------------------------------------------------
// 3. Suggest Control Mappings
// ---------------------------------------------------------------------------

export interface ControlMappingSuggestion {
  framework: string;
  controlId: string;
  controlTitle: string;
  relevance: number; // 0-100
}

export interface ControlMappingResult {
  mappings: ControlMappingSuggestion[];
  rationale: string;
}

export async function suggestControlMappings(
  controlDescription: string,
): Promise<ControlMappingResult> {
  const cacheKey = `mapping:${controlDescription.slice(0, 80)}`;
  const cached = getCached<ControlMappingResult>(cacheKey);
  if (cached) return cached;

  const systemPrompt = `You are a compliance mapping specialist. Given a control description, suggest equivalent controls in other frameworks.
Respond ONLY with valid JSON:
{
  "mappings": [
    {
      "framework": "<SOC2|ISO27001|HIPAA|GDPR|PCI_DSS|NIST>",
      "controlId": "<e.g., CC6.1 or A.8.1>",
      "controlTitle": "<title>",
      "relevance": <0-100>
    }
  ],
  "rationale": "<brief explanation of mapping logic>"
}
Return up to 6 mappings, highest relevance first. Do not include any text outside the JSON object.`;

  const userPrompt = `Suggest cross-framework control mappings for this control:

"${controlDescription}"

Map to: SOC 2, ISO 27001, HIPAA, GDPR, PCI DSS, NIST 800-53`;

  const raw = await callOpenAI(systemPrompt, userPrompt);

  if (raw) {
    try {
      const parsed = JSON.parse(raw) as ControlMappingResult;
      const result: ControlMappingResult = {
        mappings: Array.isArray(parsed.mappings)
          ? parsed.mappings.slice(0, 6).map((m) => ({
              framework: m.framework || 'Unknown',
              controlId: m.controlId || '',
              controlTitle: m.controlTitle || '',
              relevance: Math.min(100, Math.max(0, Math.round(m.relevance))),
            }))
          : [],
        rationale: parsed.rationale || '',
      };
      setCache(cacheKey, result);
      return result;
    } catch {
      console.warn('[compliance-ai] Failed to parse mapping response');
    }
  }

  // Fallback: common cross-framework mappings
  const fallback: ControlMappingResult = {
    mappings: [
      {
        framework: 'SOC2',
        controlId: 'CC6.1',
        controlTitle: 'Logical and Physical Access Controls',
        relevance: 65,
      },
      {
        framework: 'ISO27001',
        controlId: 'A.8.1',
        controlTitle: 'User Endpoint Devices',
        relevance: 60,
      },
      {
        framework: 'NIST',
        controlId: 'AC-1',
        controlTitle: 'Access Control Policy and Procedures',
        relevance: 55,
      },
    ],
    rationale:
      'Fallback mappings based on common cross-framework alignment patterns. Enable AI for precise mapping suggestions.',
  };

  setCache(cacheKey, fallback);
  return fallback;
}

// ---------------------------------------------------------------------------
// 4. Predict Compliance Gaps
// ---------------------------------------------------------------------------

export interface ComplianceScore {
  framework: string;
  score: number;
  date: string;
  controlsEvaluated: number;
  nonCompliant: number;
}

export interface GapPrediction {
  framework: string;
  currentScore: number;
  predictedScore: number;
  trend: 'improving' | 'stable' | 'declining';
  riskAreas: string[];
  confidence: number; // 0-1
}

export interface GapPredictionResult {
  predictions: GapPrediction[];
  overallOutlook: string;
  urgentActions: string[];
}

export async function predictComplianceGaps(
  scores: ComplianceScore[],
): Promise<GapPredictionResult> {
  if (scores.length === 0) {
    return {
      predictions: [],
      overallOutlook: 'No compliance data available for trend analysis.',
      urgentActions: [
        'Run an initial compliance scan to establish a baseline',
      ],
    };
  }

  const cacheKey = `gaps:${scores.map((s) => `${s.framework}:${s.score}`).join(',')}`;
  const cached = getCached<GapPredictionResult>(cacheKey);
  if (cached) return cached;

  const scoresSummary = scores
    .map(
      (s) =>
        `${s.framework.toUpperCase()}: ${s.score}% (${s.date}, ${s.controlsEvaluated} controls, ${s.nonCompliant} non-compliant)`,
    )
    .join('\n');

  const systemPrompt = `You are a compliance risk analyst predicting compliance gaps and trends.
Respond ONLY with valid JSON:
{
  "predictions": [
    {
      "framework": "<name>",
      "currentScore": <number>,
      "predictedScore": <number for 30 days ahead>,
      "trend": "<improving|stable|declining>",
      "riskAreas": ["<string>", ...],
      "confidence": <0-1>
    }
  ],
  "overallOutlook": "<1-2 sentence summary>",
  "urgentActions": ["<string>", ...]
}
Do not include any text outside the JSON object.`;

  const userPrompt = `Analyze these compliance scores and predict 30-day trends:

${scoresSummary}

Consider:
1. Score trajectory per framework
2. Non-compliant control concentration
3. Cross-framework risk correlation
4. Seasonal compliance patterns`;

  const raw = await callOpenAI(systemPrompt, userPrompt);

  if (raw) {
    try {
      const parsed = JSON.parse(raw) as GapPredictionResult;
      const result: GapPredictionResult = {
        predictions: Array.isArray(parsed.predictions)
          ? parsed.predictions.slice(0, 6).map((p) => ({
              framework: p.framework || 'Unknown',
              currentScore: Math.round(p.currentScore),
              predictedScore: Math.round(p.predictedScore),
              trend: (['improving', 'stable', 'declining'] as const).includes(
                p.trend,
              )
                ? p.trend
                : 'stable',
              riskAreas: Array.isArray(p.riskAreas)
                ? p.riskAreas.slice(0, 5)
                : [],
              confidence: Math.min(1, Math.max(0, p.confidence)),
            }))
          : [],
        overallOutlook:
          parsed.overallOutlook || 'Analysis complete.',
        urgentActions: Array.isArray(parsed.urgentActions)
          ? parsed.urgentActions.slice(0, 5)
          : [],
      };
      setCache(cacheKey, result);
      return result;
    } catch {
      console.warn('[compliance-ai] Failed to parse gap prediction response');
    }
  }

  // Fallback: simple heuristic prediction
  const fallback = generateGapPredictionFallback(scores);
  setCache(cacheKey, fallback);
  return fallback;
}

function generateGapPredictionFallback(
  scores: ComplianceScore[],
): GapPredictionResult {
  // Group by framework and pick latest per framework
  const byFramework = new Map<string, ComplianceScore>();
  for (const s of scores) {
    const existing = byFramework.get(s.framework);
    if (!existing || new Date(s.date) > new Date(existing.date)) {
      byFramework.set(s.framework, s);
    }
  }

  const predictions: GapPrediction[] = Array.from(byFramework.values()).map(
    (s) => {
      const trend: GapPrediction['trend'] =
        s.score >= 80 ? 'improving' : s.score >= 50 ? 'stable' : 'declining';
      const predictedDelta =
        trend === 'improving' ? 3 : trend === 'declining' ? -5 : 0;

      const riskAreas: string[] = [];
      if (s.nonCompliant > 0) {
        riskAreas.push(`${s.nonCompliant} non-compliant controls require attention`);
      }
      if (s.score < 70) {
        riskAreas.push('Below recommended compliance threshold of 70%');
      }

      return {
        framework: s.framework,
        currentScore: s.score,
        predictedScore: Math.min(100, Math.max(0, s.score + predictedDelta)),
        trend,
        riskAreas,
        confidence: 0.6, // lower confidence for heuristic predictions
      };
    },
  );

  const avgScore =
    predictions.length > 0
      ? Math.round(
          predictions.reduce((sum, p) => sum + p.currentScore, 0) /
            predictions.length,
        )
      : 0;

  const urgentActions: string[] = [];
  if (predictions.some((p) => p.trend === 'declining')) {
    urgentActions.push(
      'Review declining frameworks and prioritize non-compliant controls',
    );
  }
  if (avgScore < 70) {
    urgentActions.push(
      'Schedule remediation sprint to address critical compliance gaps',
    );
  }
  urgentActions.push(
    'Enable AI analysis for more accurate trend predictions',
  );

  return {
    predictions,
    overallOutlook: `Average compliance score is ${avgScore}%. ${avgScore >= 80 ? 'Maintaining strong posture.' : avgScore >= 50 ? 'Moderate compliance level with room for improvement.' : 'Immediate action required to improve compliance posture.'}`,
    urgentActions,
  };
}

// ---------------------------------------------------------------------------
// Utility: Clear AI cache (for admin/testing)
// ---------------------------------------------------------------------------

export function clearAICache(): void {
  aiCache.clear();
}
