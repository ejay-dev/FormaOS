/**
 * Branch-coverage tests for lib/ai/embeddings.ts
 * 34 uncovered branches (0% → target ~80%)
 */

const mockEmbedCreate = jest.fn();
jest.mock('openai', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      embeddings: { create: (...args: any[]) => mockEmbedCreate(...args) },
    })),
  };
});

import {
  generateEmbedding,
  generateEmbeddings,
  chunkDocument,
  extractFormSubmissionText,
  stripMarkdown,
} from '@/lib/ai/embeddings';

describe('embeddings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateEmbedding', () => {
    it('returns zero vector for empty text', async () => {
      const result = await generateEmbedding('');
      expect(result).toHaveLength(1536);
      expect(result.every((v: number) => v === 0)).toBe(true);
    });

    it('returns zero vector for whitespace-only text', async () => {
      const result = await generateEmbedding('   \n\n  ');
      expect(result).toHaveLength(1536);
      expect(result.every((v: number) => v === 0)).toBe(true);
    });

    it('calls OpenAI API for valid text', async () => {
      const embedding = new Array(1536).fill(0.1);
      mockEmbedCreate.mockResolvedValue({
        data: [{ embedding }],
      });

      const result = await generateEmbedding('Hello world');
      expect(result).toEqual(embedding);
      expect(mockEmbedCreate).toHaveBeenCalledWith({
        model: 'text-embedding-3-small',
        input: 'Hello world',
      });
    });

    it('cleans excessive newlines', async () => {
      const embedding = new Array(1536).fill(0.2);
      mockEmbedCreate.mockResolvedValue({
        data: [{ embedding }],
      });

      await generateEmbedding('Line1\n\n\n\n\nLine2');
      expect(mockEmbedCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          input: 'Line1\n\nLine2',
        }),
      );
    });
  });

  describe('generateEmbeddings', () => {
    it('generates embeddings for multiple texts', async () => {
      mockEmbedCreate.mockResolvedValue({
        data: [{ embedding: [0.1] }, { embedding: [0.2] }],
      });

      const result = await generateEmbeddings(['text1', 'text2']);
      expect(result).toEqual([[0.1], [0.2]]);
    });

    it('batches large arrays', async () => {
      const texts = Array.from({ length: 150 }, (_, i) => `text${i}`);
      mockEmbedCreate
        .mockResolvedValueOnce({
          data: texts.slice(0, 100).map(() => ({ embedding: [0.1] })),
        })
        .mockResolvedValueOnce({
          data: texts.slice(100).map(() => ({ embedding: [0.2] })),
        });

      const result = await generateEmbeddings(texts);
      expect(result).toHaveLength(150);
      expect(mockEmbedCreate).toHaveBeenCalledTimes(2);
    });
  });

  describe('chunkDocument', () => {
    it('returns empty for empty text', () => {
      expect(chunkDocument('')).toEqual([]);
    });

    it('returns empty for whitespace text', () => {
      expect(chunkDocument('   \n  ')).toEqual([]);
    });

    it('returns single chunk for short text', () => {
      const result = chunkDocument('Short text');
      expect(result).toHaveLength(1);
      expect(result[0].text).toBe('Short text');
      expect(result[0].index).toBe(0);
    });

    it('splits long text into chunks by paragraphs', () => {
      // MAX_CHUNK_TOKENS = 500, each token ~4 chars, so max ~2000 chars per chunk
      const para = 'A'.repeat(800);
      const text = `${para}\n\n${para}\n\n${para}\n\n${para}`;
      const result = chunkDocument(text);
      expect(result.length).toBeGreaterThan(1);
      result.forEach((chunk, i) => {
        expect(chunk.index).toBe(i);
      });
    });

    it('handles very long paragraphs exceeding max by splitting at sentences', () => {
      // Single paragraph longer than 2000 chars
      const sentences = Array.from(
        { length: 40 },
        (_, i) =>
          `Sentence number ${i} is a test sentence that provides content. `,
      );
      const text = sentences.join('');
      const result = chunkDocument(text, { maxTokens: 100 });
      expect(result.length).toBeGreaterThan(1);
    });

    it('uses custom maxTokens and overlapTokens', () => {
      const para = 'B'.repeat(200);
      const text = `${para}\n\n${para}\n\n${para}`;
      const result = chunkDocument(text, { maxTokens: 60, overlapTokens: 10 });
      expect(result.length).toBeGreaterThan(1);
    });

    it('handles text with no paragraph breaks', () => {
      const text = 'Word '.repeat(600);
      const result = chunkDocument(text, { maxTokens: 100 });
      expect(result.length).toBeGreaterThan(1);
    });

    it('splits at sentence boundary with question marks', () => {
      const text = 'Is this a question? ' + 'Y'.repeat(2000);
      const result = chunkDocument(text, { maxTokens: 100 });
      expect(result.length).toBeGreaterThan(1);
    });

    it('handles zero overlap', () => {
      const para = 'C'.repeat(800);
      const text = `${para}\n\n${para}\n\n${para}`;
      const result = chunkDocument(text, { overlapTokens: 0 });
      expect(result.length).toBeGreaterThan(1);
    });

    it('normalizes CRLF', () => {
      const result = chunkDocument('Line1\r\nLine2');
      expect(result[0].text).toContain('Line1\nLine2');
    });
  });

  describe('extractFormSubmissionText', () => {
    it('extracts text from form fields', () => {
      const result = extractFormSubmissionText(
        'Health Check',
        [
          { label: 'Name', id: 'name' },
          { label: 'Age', id: 'age' },
          { label: 'Notes', id: 'notes' },
        ],
        { name: 'John', age: 30, notes: '' },
      );
      expect(result).toContain('Form: Health Check');
      expect(result).toContain('Name: John');
      expect(result).toContain('Age: 30');
      expect(result).not.toContain('Notes:');
    });

    it('handles null and undefined values', () => {
      const result = extractFormSubmissionText(
        'Survey',
        [
          { label: 'Q1', id: 'q1' },
          { label: 'Q2', id: 'q2' },
        ],
        { q1: null, q2: undefined },
      );
      expect(result).toBe('Form: Survey');
    });
  });

  describe('stripMarkdown', () => {
    it('removes headers', () => {
      expect(stripMarkdown('# Header')).toBe('Header');
      expect(stripMarkdown('### Sub Header')).toBe('Sub Header');
    });

    it('removes bold and italic', () => {
      expect(stripMarkdown('**bold** and *italic*')).toBe('bold and italic');
    });

    it('removes links', () => {
      expect(stripMarkdown('[Click here](https://example.com)')).toBe(
        'Click here',
      );
    });

    it('removes code blocks', () => {
      expect(stripMarkdown('Use `code` here')).toBe('Use  here');
    });

    it('removes list markers', () => {
      const md = '- Item 1\n* Item 2\n+ Item 3\n1. Ordered';
      const result = stripMarkdown(md);
      expect(result).toContain('Item 1');
      expect(result).not.toContain('- ');
      expect(result).not.toContain('1. ');
    });

    it('collapses excessive newlines', () => {
      const result = stripMarkdown('A\n\n\n\n\nB');
      expect(result).toBe('A\n\nB');
    });

    it('trims result', () => {
      expect(stripMarkdown('  text  ')).toBe('text');
    });
  });
});
