/**
 * AI Document Indexing Pipeline
 * Indexes evidence, policies, controls, forms, and other documents for RAG
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { indexDocument, deleteDocumentIndex, SourceType } from './vector-store';
import { stripMarkdown } from './embeddings';

// ---- Entity Text Extractors ----

async function extractEvidenceText(
  db: SupabaseClient,
  orgId: string,
  evidenceId: string,
): Promise<{ text: string; metadata: Record<string, unknown> } | null> {
  const { data } = await db
    .from('evidence')
    .select('title, description, file_name, tags, control_id, created_at')
    .eq('id', evidenceId)
    .eq('org_id', orgId)
    .single();

  if (!data) return null;

  const parts = [
    `Evidence: ${data.title}`,
    data.description ? `Description: ${data.description}` : '',
    data.file_name ? `File: ${data.file_name}` : '',
    data.tags?.length ? `Tags: ${data.tags.join(', ')}` : '',
  ].filter(Boolean);

  return {
    text: parts.join('\n'),
    metadata: {
      title: data.title,
      type: 'evidence',
      created_at: data.created_at,
    },
  };
}

async function extractPolicyText(
  db: SupabaseClient,
  orgId: string,
  policyId: string,
): Promise<{ text: string; metadata: Record<string, unknown> } | null> {
  const { data } = await db
    .from('policies')
    .select('title, content, status, version, category, created_at')
    .eq('id', policyId)
    .eq('org_id', orgId)
    .single();

  if (!data) return null;

  const content = stripMarkdown(data.content ?? '');
  const text = `Policy: ${data.title}\nCategory: ${data.category ?? 'General'}\nVersion: ${data.version ?? 1}\n\n${content}`;

  return {
    text,
    metadata: {
      title: data.title,
      type: 'policy',
      category: data.category,
      version: data.version,
      created_at: data.created_at,
    },
  };
}

async function extractControlText(
  db: SupabaseClient,
  orgId: string,
  controlId: string,
): Promise<{ text: string; metadata: Record<string, unknown> } | null> {
  const { data } = await db
    .from('org_compliance_controls')
    .select('control_id, title, description, category, status, framework_id')
    .eq('id', controlId)
    .eq('org_id', orgId)
    .single();

  if (!data) return null;

  const text = [
    `Control: ${data.control_id} - ${data.title}`,
    data.description ? `Description: ${data.description}` : '',
    data.category ? `Category: ${data.category}` : '',
    `Status: ${data.status ?? 'unknown'}`,
  ]
    .filter(Boolean)
    .join('\n');

  return {
    text,
    metadata: {
      title: data.title,
      type: 'control',
      control_id: data.control_id,
      framework_id: data.framework_id,
    },
  };
}

async function extractTaskText(
  db: SupabaseClient,
  orgId: string,
  taskId: string,
): Promise<{ text: string; metadata: Record<string, unknown> } | null> {
  const { data } = await db
    .from('tasks')
    .select('title, description, status, priority, due_date')
    .eq('id', taskId)
    .eq('org_id', orgId)
    .single();

  if (!data) return null;

  const text = [
    `Task: ${data.title}`,
    data.description ? `Description: ${data.description}` : '',
    `Status: ${data.status}`,
    data.priority ? `Priority: ${data.priority}` : '',
    data.due_date ? `Due: ${data.due_date}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  return {
    text,
    metadata: { title: data.title, type: 'task' },
  };
}

async function extractFormSubmissionText(
  db: SupabaseClient,
  orgId: string,
  submissionId: string,
): Promise<{ text: string; metadata: Record<string, unknown> } | null> {
  const { data } = await db
    .from('org_form_submissions')
    .select('data, form:org_forms(title, fields), created_at, respondent_name')
    .eq('id', submissionId)
    .eq('org_id', orgId)
    .single();

  if (!data) return null;

  const form = data.form as any;
  const formData = data.data as Record<string, unknown>;
  const fields = (form?.fields ?? []) as Array<{ id: string; label: string }>;

  const lines = [`Form Submission: ${form?.title ?? 'Unknown Form'}`];
  if (data.respondent_name) lines.push(`Respondent: ${data.respondent_name}`);

  for (const field of fields) {
    const val = formData[field.id];
    if (val !== null && val !== undefined && val !== '') {
      lines.push(`${field.label}: ${String(val)}`);
    }
  }

  return {
    text: lines.join('\n'),
    metadata: {
      title: form?.title ?? 'Form Submission',
      type: 'form_submission',
      created_at: data.created_at,
    },
  };
}

// ---- Public API ----

const EXTRACTORS: Record<
  SourceType,
  (
    db: SupabaseClient,
    orgId: string,
    sourceId: string,
  ) => Promise<{ text: string; metadata: Record<string, unknown> } | null>
> = {
  evidence: extractEvidenceText,
  policy: extractPolicyText,
  control: extractControlText,
  task: extractTaskText,
  form_submission: extractFormSubmissionText,
  care_plan: async () => null, // Extend in Prompt 8
  incident: async () => null, // Extend in Prompt 13
};

/**
 * Index a single document by source type and ID.
 */
export async function indexEntity(
  db: SupabaseClient,
  orgId: string,
  sourceType: SourceType,
  sourceId: string,
): Promise<number> {
  const extractor = EXTRACTORS[sourceType];
  if (!extractor) return 0;

  const extracted = await extractor(db, orgId, sourceId);
  if (!extracted) return 0;

  return indexDocument(db, orgId, sourceType, sourceId, extracted.text, {
    metadata: extracted.metadata,
  });
}

/**
 * Remove index for a specific entity.
 */
export async function removeEntityIndex(
  db: SupabaseClient,
  orgId: string,
  sourceType: SourceType,
  sourceId: string,
): Promise<void> {
  await deleteDocumentIndex(db, orgId, sourceType, sourceId);
}

/**
 * Full reindex for an org - indexes all entities of all types.
 */
export async function fullReindex(
  db: SupabaseClient,
  orgId: string,
): Promise<{ indexed: number; errors: number }> {
  let indexed = 0;
  let errors = 0;

  // Index evidence
  const { data: evidence } = await db
    .from('evidence')
    .select('id')
    .eq('org_id', orgId);

  for (const e of evidence ?? []) {
    try {
      await indexEntity(db, orgId, 'evidence', e.id);
      indexed++;
    } catch {
      errors++;
    }
  }

  // Index policies
  const { data: policies } = await db
    .from('policies')
    .select('id')
    .eq('org_id', orgId);

  for (const p of policies ?? []) {
    try {
      await indexEntity(db, orgId, 'policy', p.id);
      indexed++;
    } catch {
      errors++;
    }
  }

  // Index controls
  const { data: controls } = await db
    .from('org_compliance_controls')
    .select('id')
    .eq('org_id', orgId);

  for (const c of controls ?? []) {
    try {
      await indexEntity(db, orgId, 'control', c.id);
      indexed++;
    } catch {
      errors++;
    }
  }

  // Index tasks
  const { data: tasks } = await db
    .from('tasks')
    .select('id')
    .eq('org_id', orgId);

  for (const t of tasks ?? []) {
    try {
      await indexEntity(db, orgId, 'task', t.id);
      indexed++;
    } catch {
      errors++;
    }
  }

  return { indexed, errors };
}

/**
 * Incremental index — only documents created/updated since given timestamp.
 */
export async function incrementalIndex(
  db: SupabaseClient,
  orgId: string,
  since: string,
): Promise<{ indexed: number; errors: number }> {
  let indexed = 0;
  let errors = 0;

  const tables: Array<{ table: string; sourceType: SourceType }> = [
    { table: 'evidence', sourceType: 'evidence' },
    { table: 'policies', sourceType: 'policy' },
    { table: 'tasks', sourceType: 'task' },
  ];

  for (const { table, sourceType } of tables) {
    const { data } = await db
      .from(table)
      .select('id')
      .eq('org_id', orgId)
      .gte('updated_at', since);

    for (const row of data ?? []) {
      try {
        await indexEntity(db, orgId, sourceType, row.id);
        indexed++;
      } catch {
        errors++;
      }
    }
  }

  return { indexed, errors };
}
