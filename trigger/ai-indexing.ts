import { task } from '@trigger.dev/sdk';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import {
  indexEntity,
  removeEntityIndex,
  fullReindex,
} from '@/lib/ai/indexing-pipeline';

export const indexDocumentTask = task({
  id: 'ai-index-document',
  maxDuration: 120,
  retry: { maxAttempts: 3 },
  run: async (payload: {
    orgId: string;
    sourceType:
      | 'evidence'
      | 'policy'
      | 'control'
      | 'task'
      | 'form_submission'
      | 'care_plan'
      | 'incident';
    sourceId: string;
  }) => {
    const db = createSupabaseAdminClient();
    await indexEntity(db, payload.orgId, payload.sourceType, payload.sourceId);
    return {
      indexed: true,
      sourceType: payload.sourceType,
      sourceId: payload.sourceId,
    };
  },
});

export const removeDocumentIndexTask = task({
  id: 'ai-remove-document-index',
  maxDuration: 30,
  retry: { maxAttempts: 2 },
  run: async (payload: {
    orgId: string;
    sourceType: string;
    sourceId: string;
  }) => {
    const db = createSupabaseAdminClient();
    await removeEntityIndex(
      db,
      payload.orgId,
      payload.sourceType,
      payload.sourceId,
    );
    return { removed: true };
  },
});

export const fullReindexTask = task({
  id: 'ai-full-reindex',
  maxDuration: 600,
  retry: { maxAttempts: 1 },
  run: async (payload: { orgId: string }) => {
    const db = createSupabaseAdminClient();
    const result = await fullReindex(db, payload.orgId);
    return result;
  },
});
