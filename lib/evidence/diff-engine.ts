import { createSupabaseAdminClient } from '@/lib/supabase/admin';

type DiffResult = {
  evidenceId: string;
  versionA: string;
  versionB: string;
  metadataChanges: Array<{
    field: string;
    oldValue: unknown;
    newValue: unknown;
  }>;
  textChanges: Array<{
    type: 'added' | 'removed' | 'unchanged';
    content: string;
    lineNumber: number;
  }>;
};

/**
 * Compare two versions of an evidence item.
 * Returns metadata diffs and text-level diffs where possible.
 */
export async function compareVersions(
  orgId: string,
  evidenceId: string,
  versionA: string,
  versionB: string,
): Promise<DiffResult> {
  const db = createSupabaseAdminClient();

  // Get both versions from file_versions or evidence history
  const { data: versions } = await db
    .from('org_file_versions')
    .select('*')
    .eq('evidence_id', evidenceId)
    .in('version_id', [versionA, versionB])
    .order('created_at', { ascending: true });

  const verA = versions?.find((v) => v.version_id === versionA);
  const verB = versions?.find((v) => v.version_id === versionB);

  const metadataChanges: DiffResult['metadataChanges'] = [];
  const textChanges: DiffResult['textChanges'] = [];

  if (verA && verB) {
    // Compare metadata fields
    const metaFields = [
      'title',
      'description',
      'tags',
      'control_mappings',
      'status',
    ];
    for (const field of metaFields) {
      const metaA = verA.metadata?.[field];
      const metaB = verB.metadata?.[field];
      if (JSON.stringify(metaA) !== JSON.stringify(metaB)) {
        metadataChanges.push({ field, oldValue: metaA, newValue: metaB });
      }
    }

    // Simple line-level text diff if text content is available
    const textA = (verA.text_content ?? '').split('\n');
    const textB = (verB.text_content ?? '').split('\n');

    const maxLines = Math.max(textA.length, textB.length);
    for (let i = 0; i < maxLines; i++) {
      const lineA = textA[i] ?? '';
      const lineB = textB[i] ?? '';
      if (lineA === lineB) {
        if (lineA)
          textChanges.push({
            type: 'unchanged',
            content: lineA,
            lineNumber: i + 1,
          });
      } else {
        if (lineA)
          textChanges.push({
            type: 'removed',
            content: lineA,
            lineNumber: i + 1,
          });
        if (lineB)
          textChanges.push({
            type: 'added',
            content: lineB,
            lineNumber: i + 1,
          });
      }
    }
  }

  return { evidenceId, versionA, versionB, metadataChanges, textChanges };
}
