import { createSupabaseOrgClient } from '@/lib/supabase/org-scoped';

type EntityType =
  | 'task'
  | 'evidence'
  | 'control'
  | 'policy'
  | 'form'
  | 'participant'
  | 'incident'
  | 'member'
  | 'care_plan'
  | 'report'
  | 'certificate';

/**
 * Upsert an entity into the unified search index.
 */
export async function indexEntity(
  _orgId: string,
  entityType: EntityType,
  entityId: string,
  title: string,
  body: string,
  metadata: Record<string, unknown> = {},
) {
  const db = createSupabaseOrgClient(_orgId);
  const cleanBody = stripMarkdown(body);

  // org_id is stamped automatically by the org-scoped wrapper.
  const { error } = await db.from('search_index').upsert(
    {
      entity_type: entityType,
      entity_id: entityId,
      title,
      body: cleanBody,
      metadata,
      last_indexed_at: new Date().toISOString(),
    },
    { onConflict: 'org_id,entity_type,entity_id' },
  );

  if (error) throw new Error(`Indexing failed: ${error.message}`);
}

/**
 * Remove an entity from the search index.
 */
export async function removeEntity(
  _orgId: string,
  entityType: EntityType,
  entityId: string,
) {
  const db = createSupabaseOrgClient(_orgId);
  await db
    .from('search_index')
    .delete()
    .eq('entity_type', entityType)
    .eq('entity_id', entityId);
}

/**
 * Rebuild the search index for all entities of a given type in an org.
 */
export async function reindexEntityType(_orgId: string, entityType: EntityType) {
  const extractor = ENTITY_EXTRACTORS[entityType];
  if (!extractor) return;

  const db = createSupabaseOrgClient(_orgId);
  const entities = await extractor(db, _orgId);

  for (const e of entities) {
    await indexEntity(_orgId, entityType, e.id, e.title, e.body, e.metadata);
  }
}

/**
 * Full reindex for an entire org — all entity types.
 */
export async function fullReindex(_orgId: string) {
  const types = Object.keys(ENTITY_EXTRACTORS) as EntityType[];
  for (const t of types) {
    await reindexEntityType(_orgId, t);
  }
}

// --- Entity extractors ---

type ExtractedEntity = {
  id: string;
  title: string;
  body: string;
  metadata: Record<string, unknown>;
};
type SupabaseClient = ReturnType<typeof createSupabaseOrgClient>;

const ENTITY_EXTRACTORS: Partial<
  Record<
    EntityType,
    (db: SupabaseClient, _orgId: string) => Promise<ExtractedEntity[]>
  >
> = {
  async task(db, _orgId) {
    const { data } = await db
      .from('org_tasks')
      .select('id, title, description, status, priority, assigned_to');
    return (data ?? []).map((t: { [k: string]: any }) => ({
      id: t.id,
      title: t.title ?? 'Untitled task',
      body: t.description ?? '',
      metadata: {
        status: t.status,
        priority: t.priority,
        assigned_to: t.assigned_to,
      },
    }));
  },

  async evidence(db, _orgId) {
    const { data } = await db
      .from('org_evidence')
      .select('id, title, description, status, file_type');
    return (data ?? []).map((e: { [k: string]: any }) => ({
      id: e.id,
      title: e.title ?? 'Untitled evidence',
      body: e.description ?? '',
      metadata: { status: e.status, file_type: e.file_type },
    }));
  },

  async control(db, _orgId) {
    const { data } = await db
      .from('org_controls')
      .select('id, title, description, status, code');
    return (data ?? []).map((c: { [k: string]: any }) => ({
      id: c.id,
      title: `${c.code ?? ''} ${c.title ?? ''}`.trim(),
      body: c.description ?? '',
      metadata: { status: c.status, code: c.code },
    }));
  },

  async policy(db, _orgId) {
    const { data } = await db
      .from('org_policies')
      .select('id, title, content, status, version');
    return (data ?? []).map((p: { [k: string]: any }) => ({
      id: p.id,
      title: p.title ?? 'Untitled policy',
      body: p.content ?? '',
      metadata: { status: p.status, version: p.version },
    }));
  },

  async form(db, _orgId) {
    // wrapper auto-filters org_id; the explicit .eq below was redundant.
    const { data } = await db
      .from('org_forms')
      .select('id, title, description, status');
    return (data ?? []).map((f: { [k: string]: any }) => ({
      id: f.id,
      title: f.title ?? 'Untitled form',
      body: f.description ?? '',
      metadata: { status: f.status },
    }));
  },

  async participant(db, _orgId) {
    const { data } = await db
      .from('org_participants')
      .select('id, first_name, last_name, ndis_number, status');
    return (data ?? []).map((p: { [k: string]: any }) => ({
      id: p.id,
      title: `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim(),
      body: `NDIS: ${p.ndis_number ?? 'N/A'}`,
      metadata: { status: p.status },
    }));
  },

  async incident(db, _orgId) {
    const { data } = await db
      .from('org_incidents')
      .select('id, title, description, severity, status');
    return (data ?? []).map((i: { [k: string]: any }) => ({
      id: i.id,
      title: i.title ?? 'Untitled incident',
      body: i.description ?? '',
      metadata: { severity: i.severity, status: i.status },
    }));
  },

  async care_plan(db, _orgId) {
    const { data } = await db
      .from('org_care_plans')
      .select('id, plan_name, notes, status');
    return (data ?? []).map((cp: { [k: string]: any }) => ({
      id: cp.id,
      title: cp.plan_name ?? 'Untitled care plan',
      body: cp.notes ?? '',
      metadata: { status: cp.status },
    }));
  },
};

// --- Helpers ---

function stripMarkdown(text: string): string {
  return text
    .replace(/#{1,6}\s/g, '') // headers
    .replace(/\*\*(.+?)\*\*/g, '$1') // bold
    .replace(/\*(.+?)\*/g, '$1') // italic
    .replace(/`{1,3}[^`]*`{1,3}/g, '') // code
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1') // images
    .replace(/[-*+]\s/g, '') // list markers
    .replace(/>\s/g, '') // blockquotes
    .replace(/\n{2,}/g, '\n') // multiple newlines
    .trim();
}
