/**
 * =========================================================
 * General-purpose Compliance Q&A
 * =========================================================
 *
 * High-20: this assistant is a stateless OpenAI prompt wrapper for
 * compliance-flavored Q&A. It is NOT grounded in the user's org data —
 * the org_context fields passed in are surface-level (industry,
 * memberCount) and never include policies, evidence, or controls.
 *
 * What changed:
 *   - Removed the `confidence: 0.85 | 0.7 | …` literals that were
 *     presented to users as if they were real model confidences.
 *     We do not have a calibrated grounding signal, so we no longer
 *     emit a confidence score at all. UI surfaces should not display
 *     one.
 *   - Renamed the conceptual product surface from "AI Compliance
 *     Assistant" to "General-purpose Compliance Q&A" in copy. The
 *     class name stays for backwards compatibility with existing
 *     imports.
 *
 * If/when RAG is wired up (lib/ai/vector-store.ts +
 * lib/ai/rag-chat.ts already exist but are unused here), confidence
 * can be re-introduced as a real cosine-similarity-derived signal.
 */

import { generateAIText, isAISDKConfigured } from '@/lib/ai/sdk-client';

export interface AIComplianceRequest {
  type: 'analyze' | 'recommend' | 'query' | 'categorize' | 'report';
  context: string;
  data?: unknown;
}

export interface AIComplianceResponse {
  result: unknown;
  /**
   * @deprecated High-20: removed because the value was a hardcoded
   * literal, not a real model confidence. Field kept on the type only
   * for transitional source-compat with consumers; it will be `null`
   * on every response.
   */
  confidence?: null;
  suggestions?: string[];
  reasoning?: string;
  /**
   * Marker so UI consumers can distinguish a grounded answer from a
   * generic Q&A reply. Always `false` until RAG is wired up.
   */
  grounded?: false;
}

/**
 * AI Compliance Assistant using OpenAI
 */
export class AIComplianceAssistant {
  /**
   * Analyze compliance document
   */
  async analyzeDocument(
    content: string,
    documentType: string,
  ): Promise<AIComplianceResponse> {
    const prompt = `You are a compliance expert. Analyze the following ${documentType} document and provide:
1. Key compliance requirements identified
2. Any potential risks or gaps
3. Recommendations for improvement

Document content:
${content}

Provide response in JSON format with keys: requirements (array), risks (array), recommendations (array)`;

    const response = await this.callOpenAI(prompt);

    try {
      const parsed = JSON.parse(response);
      return {
        result: parsed,
        confidence: null, grounded: false,
        reasoning: 'Analysis based on industry compliance standards',
      };
    } catch {
      return {
        result: { analysis: response },
        confidence: null, grounded: false,
      };
    }
  }

  /**
   * Recommend tasks based on organization context
   */
  async recommendTasks(orgContext: {
    industry: string;
    memberCount: number;
    existingTasks: string[];
  }): Promise<AIComplianceResponse> {
    const prompt = `You are a compliance expert. Based on the following organization context, recommend 5 important compliance tasks:

Industry: ${orgContext.industry}
Team Size: ${orgContext.memberCount} members
Existing Tasks: ${orgContext.existingTasks.join(', ')}

Provide recommendations in JSON format with array of objects containing: title, description, priority (high/medium/low), estimatedDays`;

    const response = await this.callOpenAI(prompt);

    try {
      const parsed = JSON.parse(response);
      return {
        result: parsed,
        confidence: null, grounded: false,
        suggestions: [
          'Review and prioritize based on your specific compliance requirements',
          'Assign tasks to appropriate team members',
          'Set realistic deadlines based on team capacity',
        ],
      };
    } catch {
      return {
        result: { recommendations: response },
        confidence: null, grounded: false,
      };
    }
  }

  /**
   * Natural language query
   */
  async query(
    question: string,
    context?: unknown,
  ): Promise<AIComplianceResponse> {
    const contextStr = context ? `\n\nContext: ${JSON.stringify(context)}` : '';
    const prompt = `You are a compliance assistant for FormaOS. Answer the following question concisely and accurately:

Question: ${question}${contextStr}

Provide a clear, actionable answer.`;

    const response = await this.callOpenAI(prompt);

    return {
      result: { answer: response },
      confidence: null, grounded: false,
    };
  }

  /**
   * Auto-categorize evidence/documents
   */
  async categorizeEvidence(
    fileName: string,
    content?: string,
  ): Promise<AIComplianceResponse> {
    const prompt = `Categorize this compliance document into one of these categories:
- Certificates
- Training Records
- Audit Reports
- Policies & Procedures
- Risk Assessments
- Incident Reports
- Other

File Name: ${fileName}
${content ? `Content Preview: ${content.substring(0, 500)}` : ''}

Respond with JSON: { category: string, subcategory: string, tags: array, confidence: number }`;

    const response = await this.callOpenAI(prompt);

    try {
      const parsed = JSON.parse(response);
      return {
        result: parsed,
        confidence: null, grounded: false,
      };
    } catch {
      return {
        result: { category: 'Other', subcategory: 'Uncategorized' },
        confidence: null, grounded: false,
      };
    }
  }

  /**
   * Generate compliance report
   */
  async generateReport(data: {
    orgName: string;
    metrics: Record<string, unknown>;
    risks: Array<{
      description: string;
      severity?: string;
      likelihood?: string;
    }>;
    period: string;
  }): Promise<AIComplianceResponse> {
    const prompt = `Generate a professional compliance report summary based on this data:

Organization: ${data.orgName}
Period: ${data.period}
Metrics: ${JSON.stringify(data.metrics)}
Risk Factors: ${JSON.stringify(data.risks)}

Create an executive summary (2-3 paragraphs) highlighting:
1. Overall compliance status
2. Key achievements
3. Areas requiring attention
4. Recommended actions

Write in professional, clear language suitable for executives.`;

    const response = await this.callOpenAI(prompt);

    return {
      result: { summary: response },
      confidence: null, grounded: false,
      suggestions: [
        "Review and customize based on your organization's specific needs",
        'Add relevant charts and visualizations',
        'Share with key stakeholders',
      ],
    };
  }

  /**
   * Predict risk based on patterns
   */
  async predictRisk(historicalData: {
    overdueTasks: number[];
    expiredCerts: number[];
    completionRates: number[];
  }): Promise<AIComplianceResponse> {
    const prompt = `As a compliance analytics expert, analyze these trends and predict future risk:

Overdue Tasks (last 6 months): ${historicalData.overdueTasks.join(', ')}
Expired Certificates (last 6 months): ${historicalData.expiredCerts.join(', ')}
Completion Rates (last 6 months): ${historicalData.completionRates.join(', ')}%

Provide JSON response with:
- riskLevel: 'low' | 'medium' | 'high'
- trend: 'improving' | 'stable' | 'declining'
- prediction: string (next 30 days forecast)
- recommendations: array of strings`;

    const response = await this.callOpenAI(prompt);

    try {
      const parsed = JSON.parse(response);
      return {
        result: parsed,
        confidence: null, grounded: false,
        reasoning:
          'Prediction based on historical data patterns and compliance best practices',
      };
    } catch {
      return {
        result: { prediction: response },
        confidence: null, grounded: false,
      };
    }
  }

  /**
   * Call OpenAI API
   */
  private async callOpenAI(prompt: string): Promise<string> {
    if (!isAISDKConfigured()) {
      throw new Error('OpenAI API key not configured');
    }

    const text = await generateAIText({
      name: 'compliance-assistant',
      systemPrompt:
        'You are an expert compliance consultant specializing in workplace safety, certifications, and regulatory requirements.',
      userPrompt: prompt,
      temperature: 0.7,
      maxOutputTokens: 1500,
    });

    if (!text) {
      throw new Error('OpenAI API error: empty response');
    }

    return text;
  }
}

/**
 * Singleton instance
 */
export const aiAssistant = new AIComplianceAssistant();

/**
 * Quick helper functions
 */
export async function analyzeComplianceDocument(content: string, type: string) {
  return aiAssistant.analyzeDocument(content, type);
}

export async function getTaskRecommendations(orgContext: {
  industry: string;
  memberCount: number;
  existingTasks: string[];
}) {
  return aiAssistant.recommendTasks(orgContext);
}

export async function askComplianceQuestion(
  question: string,
  context?: unknown,
) {
  return aiAssistant.query(question, context);
}

export async function categorizeDocument(fileName: string, content?: string) {
  return aiAssistant.categorizeEvidence(fileName, content);
}

export async function generateComplianceReport(data: {
  orgName: string;
  metrics: Record<string, unknown>;
  risks: Array<{ description: string; severity?: string; likelihood?: string }>;
  period: string;
}) {
  return aiAssistant.generateReport(data);
}

export async function predictComplianceRisk(historicalData: {
  overdueTasks: number[];
  expiredCerts: number[];
  completionRates: number[];
}) {
  return aiAssistant.predictRisk(historicalData);
}
