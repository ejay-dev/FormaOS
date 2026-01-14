/**
 * =========================================================
 * AI-Powered Compliance Assistant
 * =========================================================
 * OpenAI integration for intelligent compliance automation
 */

export interface AIComplianceRequest {
  type: 'analyze' | 'recommend' | 'query' | 'categorize' | 'report';
  context: string;
  data?: any;
}

export interface AIComplianceResponse {
  result: any;
  confidence: number;
  suggestions?: string[];
  reasoning?: string;
}

/**
 * AI Compliance Assistant using OpenAI
 */
export class AIComplianceAssistant {
  private apiKey: string;
  private baseUrl = 'https://api.openai.com/v1/chat/completions';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.OPENAI_API_KEY || '';
  }

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
        confidence: 0.85,
        reasoning: 'Analysis based on industry compliance standards',
      };
    } catch {
      return {
        result: { analysis: response },
        confidence: 0.7,
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
        confidence: 0.8,
        suggestions: [
          'Review and prioritize based on your specific compliance requirements',
          'Assign tasks to appropriate team members',
          'Set realistic deadlines based on team capacity',
        ],
      };
    } catch {
      return {
        result: { recommendations: response },
        confidence: 0.6,
      };
    }
  }

  /**
   * Natural language query
   */
  async query(question: string, context?: any): Promise<AIComplianceResponse> {
    const contextStr = context ? `\n\nContext: ${JSON.stringify(context)}` : '';
    const prompt = `You are a compliance assistant for FormaOS. Answer the following question concisely and accurately:

Question: ${question}${contextStr}

Provide a clear, actionable answer.`;

    const response = await this.callOpenAI(prompt);

    return {
      result: { answer: response },
      confidence: 0.75,
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
        confidence: parsed.confidence || 0.8,
      };
    } catch {
      return {
        result: { category: 'Other', subcategory: 'Uncategorized' },
        confidence: 0.5,
      };
    }
  }

  /**
   * Generate compliance report
   */
  async generateReport(data: {
    orgName: string;
    metrics: any;
    risks: any[];
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
      confidence: 0.85,
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
        confidence: 0.75,
        reasoning:
          'Prediction based on historical data patterns and compliance best practices',
      };
    } catch {
      return {
        result: { prediction: response },
        confidence: 0.6,
      };
    }
  }

  /**
   * Call OpenAI API
   */
  private async callOpenAI(prompt: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert compliance consultant specializing in workplace safety, certifications, and regulatory requirements.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
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

export async function getTaskRecommendations(orgContext: any) {
  return aiAssistant.recommendTasks(orgContext);
}

export async function askComplianceQuestion(question: string, context?: any) {
  return aiAssistant.query(question, context);
}

export async function categorizeDocument(fileName: string, content?: string) {
  return aiAssistant.categorizeEvidence(fileName, content);
}

export async function generateComplianceReport(data: any) {
  return aiAssistant.generateReport(data);
}

export async function predictComplianceRisk(historicalData: any) {
  return aiAssistant.predictRisk(historicalData);
}
