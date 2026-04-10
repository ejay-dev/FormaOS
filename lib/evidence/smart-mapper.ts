import { createSupabaseAdminClient } from '@/lib/supabase/admin';

/**
 * Suggest control mappings based on file name and content keywords.
 */
export async function suggestControlMappings(
  orgId: string,
  fileName: string,
  fileContent?: string,
): Promise<
  Array<{
    controlId: string;
    code: string;
    title: string;
    confidence: 'high' | 'medium' | 'low';
    reason: string;
  }>
> {
  const db = createSupabaseAdminClient();

  const { data: controls } = await db
    .from('org_controls')
    .select('id, code, title, description')
    .eq('organization_id', orgId);

  if (!controls || controls.length === 0) return [];

  const searchText = `${fileName} ${fileContent ?? ''}`.toLowerCase();
  const suggestions: Array<{
    controlId: string;
    code: string;
    title: string;
    confidence: 'high' | 'medium' | 'low';
    reason: string;
  }> = [];

  for (const control of controls) {
    const code = (control.code ?? '').toLowerCase();
    const title = (control.title ?? '').toLowerCase();
    const _desc = (control.description ?? '').toLowerCase();

    // Exact code match in filename
    if (code && searchText.includes(code)) {
      suggestions.push({
        controlId: control.id,
        code: control.code ?? '',
        title: control.title ?? '',
        confidence: 'high',
        reason: `File references control code "${control.code}"`,
      });
      continue;
    }

    // Title keyword match
    const titleWords = title.split(/\s+/).filter((w: string) => w.length > 4);
    const matchedTitleWords = titleWords.filter((w: string) =>
      searchText.includes(w),
    );
    if (matchedTitleWords.length >= 2) {
      suggestions.push({
        controlId: control.id,
        code: control.code ?? '',
        title: control.title ?? '',
        confidence: 'medium',
        reason: `Content matches control keywords: ${matchedTitleWords.join(', ')}`,
      });
      continue;
    }

    // Keyword mapping for common compliance domains
    const keywordMap: Record<string, string[]> = {
      password: ['AC-7', 'AC-11', 'IA-5'],
      'access control': ['AC-1', 'AC-2', 'AC-3'],
      encryption: ['SC-12', 'SC-13', 'SC-28'],
      backup: ['CP-9', 'CP-10'],
      incident: ['IR-1', 'IR-4', 'IR-5', 'IR-6'],
      training: ['AT-1', 'AT-2', 'AT-3'],
      'risk assessment': ['RA-3', 'RA-5'],
      audit: ['AU-1', 'AU-2', 'AU-3'],
      'change management': ['CM-1', 'CM-3', 'CM-5'],
      privacy: ['IP-1', 'AP-1', 'AR-1'],
    };

    for (const [keyword, codes] of Object.entries(keywordMap)) {
      if (searchText.includes(keyword) && codes.includes(code.toUpperCase())) {
        suggestions.push({
          controlId: control.id,
          code: control.code ?? '',
          title: control.title ?? '',
          confidence: 'medium',
          reason: `File content relates to "${keyword}"`,
        });
        break;
      }
    }
  }

  // Also check historical mappings — what controls have similar files been mapped to?
  const { data: historical } = await db
    .from('org_evidence')
    .select('control_id, title')
    .eq('organization_id', orgId)
    .not('control_id', 'is', null)
    .ilike('title', `%${fileName.replace(/\.[^.]+$/, '')}%`)
    .limit(5);

  for (const h of historical ?? []) {
    if (
      h.control_id &&
      !suggestions.find((s) => s.controlId === h.control_id)
    ) {
      const control = controls.find((c) => c.id === h.control_id);
      if (control) {
        suggestions.push({
          controlId: control.id,
          code: control.code ?? '',
          title: control.title ?? '',
          confidence: 'low',
          reason: `Similar file "${h.title}" was mapped to this control`,
        });
      }
    }
  }

  return suggestions.sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.confidence] - order[b.confidence];
  });
}
