import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createHash } from 'crypto';

type DuplicateResult = {
  isDuplicate: boolean;
  existingEvidence?: { id: string; title: string; created_at: string };
  similarEvidence?: Array<{ id: string; title: string; similarity: number }>;
};

/**
 * Check if evidence with the same file hash already exists.
 */
export async function checkDuplicate(
  orgId: string,
  fileHash: string,
): Promise<DuplicateResult> {
  const db = createSupabaseAdminClient();

  const { data } = await db
    .from('org_evidence')
    .select('id, title, created_at')
    .eq('organization_id', orgId)
    .eq('file_hash', fileHash)
    .maybeSingle();

  if (data) {
    return {
      isDuplicate: true,
      existingEvidence: {
        id: data.id,
        title: data.title,
        created_at: data.created_at,
      },
    };
  }

  return { isDuplicate: false };
}

/**
 * Find evidence with similar file names (fuzzy matching).
 */
export async function findSimilar(
  orgId: string,
  fileName: string,
): Promise<Array<{ id: string; title: string; similarity: number }>> {
  const db = createSupabaseAdminClient();

  // Strip extension and normalize
  const baseName = fileName
    .replace(/\.[^.]+$/, '')
    .toLowerCase()
    .replace(/[-_]/g, ' ');
  const words = baseName.split(/\s+/).filter((w) => w.length > 2);

  if (words.length === 0) return [];

  // Search for evidence with similar titles
  const { data } = await db
    .from('org_evidence')
    .select('id, title')
    .eq('organization_id', orgId)
    .limit(100);

  if (!data || data.length === 0) return [];

  const results: Array<{ id: string; title: string; similarity: number }> = [];

  for (const evidence of data) {
    const evidenceTitle = (evidence.title ?? '').toLowerCase();
    const matchedWords = words.filter((w) => evidenceTitle.includes(w));
    const similarity =
      words.length > 0 ? matchedWords.length / words.length : 0;

    if (similarity >= 0.4) {
      results.push({ id: evidence.id, title: evidence.title, similarity });
    }
  }

  return results.sort((a, b) => b.similarity - a.similarity).slice(0, 5);
}

/**
 * Compute a SHA-256 hash of file content for duplicate detection.
 */
export function computeFileHash(buffer: ArrayBuffer): string {
  return createHash('sha256').update(Buffer.from(buffer)).digest('hex');
}
