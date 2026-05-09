import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { rateLimitApi } from '@/lib/security/rate-limiter';
import { routeLog } from '@/lib/monitoring/server-logger';

const log = routeLog('/api/v1/compliance/nsqhs-progress');

// High-15: this endpoint matches NSQHS Standards to org_tasks via regex
// over task titles. That is keyword spotting, not a regulatory NSQHS
// assessment. Until per-standard evaluators exist this surface ships
// with `experimental: true` and is hidden from the default app sidebar.
const EXPERIMENTAL_NOTICE = {
  experimental: true,
  notice:
    'NSQHS Standard progress is computed by keyword-matching task titles. It is not an ACSQHC accreditation evaluation. Do not present to surveyors as accreditation evidence.',
};

const NSQHS_STANDARDS: Array<{ id: string; number: number; title: string; keywords: RegExp }> = [
  { id: '1', number: 1, title: 'Clinical Governance', keywords: /governance|clinical|quality/i },
  { id: '2', number: 2, title: 'Partnering with Consumers', keywords: /consumer|patient|engagement|partnering/i },
  { id: '3', number: 3, title: 'Preventing & Controlling Infections', keywords: /infection|hygiene|sanitation|sterilisation/i },
  { id: '4', number: 4, title: 'Medication Safety', keywords: /medication|pharmaceutical|prescribing|drug/i },
  { id: '5', number: 5, title: 'Comprehensive Care', keywords: /comprehensive|care[-\s]?plan|assessment/i },
  { id: '6', number: 6, title: 'Communicating for Safety', keywords: /communication|handover|escalation/i },
  { id: '7', number: 7, title: 'Blood Management', keywords: /blood|transfusion/i },
  { id: '8', number: 8, title: 'Recognising & Responding to Acute Deterioration', keywords: /deterioration|acute|response|MET/i },
];

export async function GET(request: Request) {
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
    if (!orgId) return NextResponse.json({ ...EXPERIMENTAL_NOTICE, standards: [] });

    const { data: tasks, error } = await supabase
      .from('org_tasks')
      .select('title, status')
      .eq('organization_id', orgId);

    if (error) {
      log.error({ err: error }, 'failed to load tasks');
      return NextResponse.json(
        { ...EXPERIMENTAL_NOTICE, standards: NSQHS_STANDARDS.map(s => ({ id: s.id, number: s.number, title: s.title, progress: 0 })), error: 'tasks_unavailable' },
        { status: 503 },
      );
    }

    const rows = tasks ?? [];
    const standards = NSQHS_STANDARDS.map((s) => {
      const related = rows.filter((t) => s.keywords.test(t.title as string || ''));
      const done = related.filter((t) => t.status === 'completed').length;
      const progress = related.length > 0
        ? Math.round((done / related.length) * 100)
        : 0;
      return {
        id: s.id,
        number: s.number,
        title: s.title,
        progress,
      };
    });

    return NextResponse.json({ ...EXPERIMENTAL_NOTICE, standards });
  } catch (err) {
    log.error({ err }, 'unexpected error');
    return NextResponse.json(
      { ...EXPERIMENTAL_NOTICE, standards: [], error: 'internal_error' },
      { status: 500 },
    );
  }
}
