import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { rateLimitApi } from '@/lib/security/rate-limiter';
import { routeLog } from '@/lib/monitoring/server-logger';
import { validateCsrfOrigin } from '@/lib/security/csrf';

const log = routeLog('/api/policies/update');

export async function POST(request: Request) {
  const csrfError = validateCsrfOrigin(request);
  if (csrfError) return csrfError;

  try {
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
    if (!user)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: membership } = await supabase
      .from('org_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .maybeSingle();
    const orgId = membership?.organization_id as string | undefined;
    if (!orgId)
      return NextResponse.json({ error: 'No organization' }, { status: 400 });

    const body = (await request.json().catch(() => ({}))) as {
      policyId?: string;
      html?: string;
      title?: string;
    };
    if (!body.policyId) {
      return NextResponse.json({ error: 'policyId required' }, { status: 400 });
    }

    // Fetch current policy to create a version snapshot before updating
    const { data: currentPolicy } = await supabase
      .from('org_policies')
      .select('title, content, version_number')
      .eq('id', body.policyId)
      .eq('organization_id', orgId)
      .maybeSingle();

    if (!currentPolicy) {
      return NextResponse.json({ error: 'Policy not found' }, { status: 404 });
    }

    // Insert a version record before overwriting
    const currentVersion =
      (currentPolicy as { version_number?: number }).version_number ?? 1;
    await supabase
      .from('policy_versions')
      .insert({
        org_id: orgId,
        policy_id: body.policyId,
        version_number: currentVersion,
        title: (currentPolicy as { title: string }).title,
        content: (currentPolicy as { content?: string }).content ?? '',
        status: 'archived',
        created_by: user.id,
      })
      .throwOnError();

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
      updated_by: user.id,
      version_number: currentVersion + 1,
    };
    if (typeof body.html === 'string') updates.content = body.html;
    if (typeof body.title === 'string' && body.title.trim()) {
      updates.title = body.title.trim();
    }

    const { error } = await supabase
      .from('org_policies')
      .update(updates)
      .eq('id', body.policyId)
      .eq('organization_id', orgId);

    if (error) {
      log.error({ err: error }, 'failed to update policy');
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, savedAt: updates.updated_at });
  } catch (err) {
    log.error({ err }, 'unexpected error');
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
