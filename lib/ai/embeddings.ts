/**
 * AI Embeddings - Generate and manage vector embeddings
 * Uses OpenAI text-embedding-3-small (1536 dimensions)
 */

import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const EMBEDDING_MODEL = 'text-embedding-3-small';
const MAX_CHUNK_TOKENS = 500;
const CHUNK_OVERLAP_TOKENS = 50;
const MAX_BATCH_SIZE = 100;

// ---- Embedding Generation ----

export async function generateEmbedding(text: string): Promise<number[]> {
  const cleaned = text.replace(/\n{3,}/g, '\n\n').trim();
  if (!cleaned) return new Array(1536).fill(0);

  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: cleaned,
  });

  return response.data[0].embedding;
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const results: number[][] = [];

  for (let i = 0; i < texts.length; i += MAX_BATCH_SIZE) {
    const batch = texts
      .slice(i, i + MAX_BATCH_SIZE)
      .map((t) => t.replace(/\n{3,}/g, '\n\n').trim());

    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: batch,
    });

    for (const item of response.data) {
      results.push(item.embedding);
    }
  }

  return results;
}

// ---- Document Chunking ----

interface ChunkOptions {
  maxTokens?: number;
  overlapTokens?: number;
}

export interface TextChunk {
  text: string;
  index: number;
  metadata?: Record<string, unknown>;
}

/**
 * Rough token count approximation (avg 4 chars per token for English).
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Split text into semantic chunks with overlap for context continuity.
 * Tries to split at paragraph boundaries, then sentence boundaries.
 */
export function chunkDocument(
  text: string,
  options: ChunkOptions = {},
): TextChunk[] {
  const maxTokens = options.maxTokens ?? MAX_CHUNK_TOKENS;
  const overlapTokens = options.overlapTokens ?? CHUNK_OVERLAP_TOKENS;
  const maxChars = maxTokens * 4;
  const overlapChars = overlapTokens * 4;

  if (!text || text.trim().length === 0) return [];

  const cleaned = text.replace(/\r\n/g, '\n').trim();

  // If text fits in one chunk, return as-is
  if (estimateTokens(cleaned) <= maxTokens) {
    return [{ text: cleaned, index: 0 }];
  }

  // Split by paragraphs first
  const paragraphs = cleaned.split(/\n\n+/);
  const chunks: TextChunk[] = [];
  let currentChunk = '';
  let chunkIndex = 0;

  for (const para of paragraphs) {
    if (
      currentChunk.length > 0 &&
      currentChunk.length + para.length + 2 > maxChars
    ) {
      chunks.push({ text: currentChunk.trim(), index: chunkIndex++ });

      // Add overlap from the end of current chunk
      if (overlapChars > 0 && currentChunk.length > overlapChars) {
        currentChunk = currentChunk.slice(-overlapChars) + '\n\n' + para;
      } else {
        currentChunk = para;
      }
    } else {
      currentChunk = currentChunk ? currentChunk + '\n\n' + para : para;
    }

    // Handle very long paragraphs that exceed max
    while (currentChunk.length > maxChars) {
      // Try to split at sentence boundary
      const splitPoint = findSentenceBoundary(currentChunk, maxChars);
      chunks.push({
        text: currentChunk.slice(0, splitPoint).trim(),
        index: chunkIndex++,
      });
      currentChunk = currentChunk.slice(splitPoint - overlapChars).trim();
    }
  }

  if (currentChunk.trim()) {
    chunks.push({ text: currentChunk.trim(), index: chunkIndex });
  }

  return chunks;
}

function findSentenceBoundary(text: string, maxPos: number): number {
  // Look for sentence-ending punctuation near maxPos
  const searchStart = Math.max(0, maxPos - 200);
  const searchText = text.slice(searchStart, maxPos);
  const lastPeriod = searchText.lastIndexOf('. ');
  const lastQuestion = searchText.lastIndexOf('? ');
  const lastExclaim = searchText.lastIndexOf('! ');
  const lastNewline = searchText.lastIndexOf('\n');

  const best = Math.max(lastPeriod, lastQuestion, lastExclaim, lastNewline);
  if (best > 0) return searchStart + best + 2;

  // Fallback: split at space
  const lastSpace = text.lastIndexOf(' ', maxPos);
  return lastSpace > 0 ? lastSpace + 1 : maxPos;
}

/**
 * Extract searchable text from structured form submission data
 */
export function extractFormSubmissionText(
  formTitle: string,
  fields: Array<{ label: string; id: string }>,
  data: Record<string, unknown>,
): string {
  const lines = [`Form: ${formTitle}`];
  for (const field of fields) {
    const value = data[field.id];
    if (value !== null && value !== undefined && value !== '') {
      lines.push(`${field.label}: ${String(value)}`);
    }
  }
  return lines.join('\n');
}

/**
 * Strip markdown formatting for cleaner embeddings
 */
export function stripMarkdown(text: string): string {
  return text
    .replace(/#{1,6}\s+/g, '') // headers
    .replace(/\*\*(.+?)\*\*/g, '$1') // bold
    .replace(/\*(.+?)\*/g, '$1') // italic
    .replace(/\[(.+?)\]\(.+?\)/g, '$1') // links
    .replace(/`{1,3}[^`]*`{1,3}/g, '') // code
    .replace(/^\s*[-*+]\s+/gm, '') // list markers
    .replace(/^\s*\d+\.\s+/gm, '') // ordered list markers
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
