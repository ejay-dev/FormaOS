import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { rateLimitApi } from '@/lib/security/rate-limiter';
import { routeLog } from '@/lib/monitoring/server-logger';
import { logAuditEvent } from '@/app/app/actions/audit-events';
import { validateCsrfOrigin } from '@/lib/security/csrf';

const log = routeLog('/api/v1/evidence/upload');
const MAX_FILES = 10;
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const STORAGE_BUCKET = 'evidence';

type UploadedItem = {
  id: string;
  type: 'file';
  title: string;
  description: string | null;
  submittedBy: { name: string };
  submittedAt: string;
  locked: boolean;
  filePath: string;
  fileName: string;
};

export async function POST(request: Request) {
  try {
    const csrfError = validateCsrfOrigin(request);
    if (csrfError) return csrfError;

    const rate = await rateLimitApi(request);
    if (!rate.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 },
      );
    }

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: membership } = await supabase
      .from('org_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .maybeSingle();
    const orgId = membership?.organization_id as string | undefined;
    if (!orgId) {
      return NextResponse.json({ error: 'No organization' }, { status: 400 });
    }

    const formData = await request.formData();
    const obligationId =
      (formData.get('obligationId') as string | null) ||
      (formData.get('taskId') as string | null);
    const entityId = formData.get('entityId') as string | null;
    const entityType = (formData.get('entityType') as string | null) || null;

    if (!obligationId && !entityId) {
      return NextResponse.json(
        { error: 'obligationId or entityId required' },
        { status: 400 },
      );
    }

    const files = formData
      .getAll('files')
      .filter((v): v is File => v instanceof File);
    if (files.length === 0) {
      return NextResponse.json(
        { error: 'At least one file is required' },
        { status: 400 },
      );
    }
    if (files.length > MAX_FILES) {
      return NextResponse.json(
        { error: `Max ${MAX_FILES} files per upload` },
        { status: 400 },
      );
    }
    for (const f of files) {
      if (f.size > MAX_FILE_BYTES) {
        return NextResponse.json(
          { error: `${f.name} exceeds 10MB limit` },
          { status: 400 },
        );
      }
      if (f.size === 0) {
        return NextResponse.json(
          { error: `${f.name} is empty` },
          { status: 400 },
        );
      }
    }

    // Verify the parent record exists in this org before persisting evidence
    if (obligationId) {
      const { data: task } = await supabase
        .from('org_tasks')
        .select('id')
        .eq('id', obligationId)
        .eq('organization_id', orgId)
        .maybeSingle();

      if (!task) {
        return NextResponse.json(
          { error: 'Obligation not found' },
          { status: 404 },
        );
      }
    } else if (entityId && entityType === 'incident') {
      const { data: incident } = await supabase
        .from('org_incidents')
        .select('id')
        .eq('id', entityId)
        .eq('organization_id', orgId)
        .maybeSingle();

      if (!incident) {
        return NextResponse.json(
          { error: 'Incident not found' },
          { status: 404 },
        );
      }
    } else if (entityId && entityType === 'staff_credential') {
      const { data: credential } = await supabase
        .from('org_staff_credentials')
        .select('id')
        .eq('id', entityId)
        .eq('organization_id', orgId)
        .maybeSingle();

      if (!credential) {
        return NextResponse.json(
          { error: 'Staff credential not found' },
          { status: 404 },
        );
      }
    } else if (entityId && entityType === 'capa') {
      const { data: capa } = await supabase
        .from('org_capa_items')
        .select('id')
        .eq('id', entityId)
        .eq('organization_id', orgId)
        .maybeSingle();

      if (!capa) {
        return NextResponse.json({ error: 'CAPA not found' }, { status: 404 });
      }
    } else if (entityId) {
      // Unknown entity type — refuse rather than write orphan evidence
      return NextResponse.json(
        { error: 'Unsupported entityType' },
        { status: 400 },
      );
    }

    const items: UploadedItem[] = [];
    const uploadedPaths: string[] = [];

    for (const file of files) {
      const ext = file.name.includes('.')
        ? file.name.slice(file.name.lastIndexOf('.') + 1)
        : '';
      const safeExt = ext.replace(/[^a-zA-Z0-9]/g, '').slice(0, 12);
      const objectName = safeExt ? `${randomUUID()}.${safeExt}` : randomUUID();
      const pathScope = obligationId
        ? `obligations/${obligationId}`
        : entityType && entityId
          ? `${entityType}/${entityId}`
          : `general/${randomUUID()}`;
      const filePath = `${orgId}/${pathScope}/${objectName}`;

      const buffer = Buffer.from(await file.arrayBuffer());
      const { error: storageError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, buffer, {
          contentType: file.type || 'application/octet-stream',
          upsert: false,
        });

      if (storageError) {
        log.error({ err: storageError }, 'storage upload failed');
        // Roll back any earlier uploads in this batch
        for (const path of uploadedPaths) {
          await supabase.storage.from(STORAGE_BUCKET).remove([path]);
        }
        return NextResponse.json(
          { error: `Upload failed: ${storageError.message}` },
          { status: 500 },
        );
      }
      uploadedPaths.push(filePath);

      // Schema-tolerant insert. The deep-workflow migration adds
      // title/file_type/file_size/verification_status; the polymorphism
      // migration drops task_id NOT NULL and adds entity_type. If the
      // migrations have not been applied yet we fall back to a minimal
      // payload so uploads continue to work in the meantime.
      const fullPayload: Record<string, unknown> = {
        organization_id: orgId,
        task_id: obligationId ?? null,
        entity_id: obligationId ? null : entityId,
        entity_type: obligationId ? null : entityType,
        title: file.name,
        file_name: file.name,
        file_path: filePath,
        file_type: file.type || safeExt || 'unknown',
        file_size: file.size,
        uploaded_by: user.id,
        verification_status: 'pending',
      };

      // The route already authenticated the user and verified org
      // membership + parent record ownership above. Use the admin client
      // for the actual DB write so we are not at the mercy of stricter
      // remote RLS variants — this is the trusted boundary.
      const admin = createSupabaseAdminClient();

      const insertWithRetry = async () => {
        let payload: Record<string, unknown> = { ...fullPayload };
        for (let attempt = 0; attempt < 8; attempt++) {
          const { data, error } = await admin
            .from('org_evidence')
            .insert(payload)
            .select('id, file_name, file_path, created_at')
            .maybeSingle();

          if (!error && data) return { data, error: null as null };

          const message = error?.message ?? '';
          // PG: 'Could not find the X column of Y in the schema cache'
          // or '... column "X" of relation ... does not exist'
          const missingMatch =
            message.match(/Could not find the ['"]([^'"]+)['"] column/i) ||
            message.match(/column ['"]([^'"]+)['"]/i);
          const missingCol = missingMatch?.[1];

          if (missingCol && missingCol in payload && missingCol !== 'task_id') {
            // Drop the missing column and retry with the smaller payload.
            const next = { ...payload };
            delete next[missingCol];
            payload = next;
            continue;
          }

          // task_id NOT NULL on legacy schema + entity-based upload.
          // Without the polymorphism migration, the task_id column is
          // required, so we cannot persist non-obligation evidence yet.
          if (
            !obligationId &&
            (message.includes('task_id') || /not[- ]null/i.test(message))
          ) {
            return {
              data: null,
              error: new Error(
                'Entity-based evidence requires the 20260425_evidence_entity_polymorphism migration. Apply it via the Supabase Dashboard SQL editor, then retry.',
              ),
            };
          }

          return { data: null, error: error ?? new Error('Insert failed') };
        }
        return {
          data: null,
          error: new Error('Insert retry budget exhausted'),
        };
      };

      const { data: row, error: insertError } = await insertWithRetry();

      if (insertError || !row) {
        log.error(
          { err: insertError },
          'evidence row insert failed; rolling back storage',
        );
        for (const path of uploadedPaths) {
          await supabase.storage.from(STORAGE_BUCKET).remove([path]);
        }
        return NextResponse.json(
          {
            error: `Failed to record evidence: ${insertError?.message ?? 'unknown'}`,
          },
          { status: 500 },
        );
      }

      const rowTitle = (row as Record<string, unknown>).title as
        | string
        | undefined;
      items.push({
        id: row.id as string,
        type: 'file',
        title: rowTitle || (row.file_name as string),
        description: null,
        submittedBy: {
          name: user.email ?? user.id.slice(0, 8),
        },
        submittedAt: (row.created_at as string) ?? new Date().toISOString(),
        locked: false,
        filePath: row.file_path as string,
        fileName: row.file_name as string,
      });

      await logAuditEvent(
        {
          organizationId: orgId,
          actorUserId: user.id,
          actorRole: (membership?.role as string | null) ?? null,
          entityType: 'evidence',
          entityId: row.id as string,
          actionType: 'EVIDENCE_UPLOADED',
          afterState: {
            obligation_id: obligationId,
            entity_id: entityId,
            entity_type: entityType,
            file_name: file.name,
            file_size: file.size,
          },
          reason: obligationId
            ? 'obligation_attachment'
            : entityType
              ? `${entityType}_attachment`
              : 'general_attachment',
        },
        { required: true },
      );

      if (entityId && entityType) {
        await logAuditEvent(
          {
            organizationId: orgId,
            actorUserId: user.id,
            actorRole: (membership?.role as string | null) ?? null,
            entityType,
            entityId,
            actionType:
              entityType === 'capa'
                ? 'CAPA_EVIDENCE_UPLOADED'
                : 'ENTITY_EVIDENCE_UPLOADED',
            afterState: {
              evidence_id: row.id,
              file_name: file.name,
              file_size: file.size,
            },
            reason: `${entityType}_attachment`,
          },
          { required: true },
        );
      }
    }

    return NextResponse.json({ items });
  } catch (err) {
    log.error({ err }, 'unexpected error');
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
