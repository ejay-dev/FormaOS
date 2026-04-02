/**
 * RAG-Enhanced Chat - Context-aware AI with document retrieval
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { similaritySearch, SearchResult } from './vector-store';
import { trackUsage } from './usage-meter';

// ---- Types ----

interface RAGContext {
  sources: RAGSource[];
  complianceContext: string;
}

export interface RAGSource {
  sourceType: string;
  sourceId: string;
  title: string;
  snippet: string;
  similarity: number;
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface RAGChatOptions {
  sourceTypes?: string[];
  controlId?: string;
  maxSources?: number;
  model?: string;
}

// ---- Compliance Context Builder ----

export async function buildComplianceContext(
  db: SupabaseClient,
  orgId: string,
): Promise<string> {
  const lines: string[] = [];

  // Get active frameworks
  const { data: frameworks } = await db
    .from('org_frameworks')
    .select('framework_name, compliance_score')
    .eq('org_id', orgId)
    .eq('status', 'active');

  if (frameworks?.length) {
    lines.push('Active Compliance Frameworks:');
    for (const fw of frameworks) {
      lines.push(
        `- ${fw.framework_name}: ${fw.compliance_score ?? 0}% compliant`,
      );
    }
  }

  // Get task summary
  const { data: tasks } = await db
    .from('tasks')
    .select('status')
    .eq('org_id', orgId);

  if (tasks?.length) {
    const overdue = tasks.filter(
      (t) => t.status === 'overdue' || t.status === 'past_due',
    ).length;
    const open = tasks.filter(
      (t) => t.status === 'open' || t.status === 'in_progress',
    ).length;
    lines.push(
      `\nTask Summary: ${tasks.length} total, ${open} open, ${overdue} overdue`,
    );
  }

  // Get evidence count
  const { count: evidenceCount } = await db
    .from('evidence')
    .select('id', { count: 'exact', head: true })
    .eq('org_id', orgId);

  lines.push(`Evidence Items: ${evidenceCount ?? 0}`);

  return lines.join('\n');
}

export async function buildControlContext(
  db: SupabaseClient,
  orgId: string,
  controlId: string,
): Promise<string> {
  const { data: control } = await db
    .from('org_compliance_controls')
    .select('control_id, title, description, category, status')
    .eq('id', controlId)
    .eq('org_id', orgId)
    .single();

  if (!control) return '';

  const lines = [
    `Control: ${control.control_id} - ${control.title}`,
    control.description ? `Description: ${control.description}` : '',
    `Category: ${control.category ?? 'General'}`,
    `Status: ${control.status ?? 'unknown'}`,
  ];

  // Get linked evidence
  const { data: evidence } = await db
    .from('evidence')
    .select('title, description, created_at')
    .eq('org_id', orgId)
    .eq('control_id', controlId)
    .limit(5);

  if (evidence?.length) {
    lines.push('\nLinked Evidence:');
    for (const e of evidence) {
      lines.push(`- ${e.title}${e.description ? ': ' + e.description : ''}`);
    }
  }

  return lines.filter(Boolean).join('\n');
}

// ---- RAG Chat Pipeline ----

/**
 * Build context for a chat message using RAG retrieval.
 */
export async function buildRAGContext(
  db: SupabaseClient,
  orgId: string,
  userMessage: string,
  options: RAGChatOptions = {},
): Promise<RAGContext> {
  const maxSources = options.maxSources ?? 8;

  // 1. Retrieve relevant documents via similarity search
  const searchResults = await similaritySearch(db, orgId, userMessage, {
    sourceTypes: options.sourceTypes as any,
    limit: maxSources,
    similarityThreshold: 0.65,
  });

  // 2. Enrich results with titles
  const sources: RAGSource[] = searchResults.map((r) => ({
    sourceType: r.sourceType,
    sourceId: r.sourceId,
    title: (r.metadata?.title as string) ?? r.sourceType,
    snippet: r.chunkText.slice(0, 200),
    similarity: r.similarity,
  }));

  // 3. Build compliance context
  let complianceContext = await buildComplianceContext(db, orgId);

  // 4. If control-specific, add control context
  if (options.controlId) {
    const controlCtx = await buildControlContext(db, orgId, options.controlId);
    if (controlCtx) {
      complianceContext += '\n\n' + controlCtx;
    }
  }

  return { sources, complianceContext };
}

/**
 * Build the system prompt with RAG context injected.
 */
export function buildSystemPrompt(
  context: RAGContext,
  basePrompt?: string,
): string {
  const parts: string[] = [];

  parts.push(
    basePrompt ??
      'You are FormaOS AI, a compliance and governance intelligence assistant. Help users understand their compliance posture, analyze evidence, identify gaps, and provide actionable recommendations. Always cite your sources when referencing specific documents.',
  );

  if (context.complianceContext) {
    parts.push(
      `\n\n--- Organization Compliance State ---\n${context.complianceContext}`,
    );
  }

  if (context.sources.length > 0) {
    parts.push('\n\n--- Relevant Documents ---');
    for (const source of context.sources) {
      parts.push(
        `[${source.sourceType.toUpperCase()}] ${source.title}: ${source.snippet}`,
      );
    }
    parts.push(
      '\nUse the above documents as context. Cite specific documents when referencing them.',
    );
  }

  return parts.join('\n');
}

/**
 * Format sources for the response.
 */
export function formatSourcesForResponse(sources: RAGSource[]): Array<{
  type: string;
  id: string;
  title: string;
  relevance: number;
}> {
  return sources.map((s) => ({
    type: s.sourceType,
    id: s.sourceId,
    title: s.title,
    relevance: Math.round(s.similarity * 100),
  }));
}
