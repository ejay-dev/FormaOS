import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { rateLimitApi } from '@/lib/security/rate-limiter';
import { routeLog } from '@/lib/monitoring/server-logger';

const log = routeLog('/api/v1/evidence/upload');
const MAX_FILES = 10;
const MAX_FILE_BYTES = 10 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const rate = await rateLimitApi(request);
    if (!rate.success) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: membership } = await supabase
      .from('org_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .maybeSingle();
    const orgId = membership?.organization_id as string | undefined;
    if (!orgId) return NextResponse.json({ error: 'No organization' }, { status: 400 });

    const formData = await request.formData();
    const obligationId = formData.get('obligationId') as string | null;
    if (!obligationId) {
      return NextResponse.json({ error: 'obligationId required' }, { status: 400 });
    }

    const files = formData.getAll('files').filter((v): v is File => v instanceof File);
    if (files.length === 0) {
      return NextResponse.json({ items: [] });
    }
    if (files.length > MAX_FILES) {
      return NextResponse.json({ error: `Max ${MAX_FILES} files per upload` }, { status: 400 });
    }
    for (const f of files) {
      if (f.size > MAX_FILE_BYTES) {
        return NextResponse.json({ error: `${f.name} exceeds 10MB limit` }, { status: 400 });
      }
    }

    const rows = files.map((f) => ({
      organization_id: orgId,
      task_id: obligationId,
      file_name: f.name,
      file_path: `local/${obligationId}/${f.name}`,
      uploaded_by: user.id,
    }));

    const { data: inserted, error } = await supabase
      .from('org_evidence')
      .insert(rows)
      .select('id, file_name, file_path, created_at');

    if (error) {
      log.error({ err: error }, 'evidence insert failed');
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const items = (inserted ?? []).map((row) => ({
      id: row.id,
      type: 'file' as const,
      name: row.file_name,
      uploadedAt: row.created_at,
      path: row.file_path,
    }));

    return NextResponse.json({ items });
  } catch (err) {
    log.error({ err }, 'unexpected error');
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
