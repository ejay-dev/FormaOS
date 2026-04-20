import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { rateLimitApi } from '@/lib/security/rate-limiter';
import { routeLog } from '@/lib/monitoring/server-logger';

const log = routeLog('/api/v1/evidence/suggest-mappings');

const KEYWORD_RULES: Array<{
  pattern: RegExp;
  controlCode: string;
  confidence: 'high' | 'medium' | 'low';
  reason: string;
}> = [
  {
    pattern: /access[-_\s]?control|iam|rbac/i,
    controlCode: 'A.9',
    confidence: 'high',
    reason: 'File name references access control or identity management',
  },
  {
    pattern: /incident|breach|report/i,
    controlCode: 'A.16',
    confidence: 'high',
    reason: 'File name references incident management or breach reporting',
  },
  {
    pattern: /backup|recovery|disaster/i,
    controlCode: 'A.17',
    confidence: 'high',
    reason: 'File name references business continuity or disaster recovery',
  },
  {
    pattern: /encryption|crypto|tls|ssl/i,
    controlCode: 'A.10',
    confidence: 'medium',
    reason: 'File name references cryptographic controls',
  },
  {
    pattern: /audit|log|monitoring/i,
    controlCode: 'A.12',
    confidence: 'medium',
    reason: 'File name references operations security or monitoring',
  },
  {
    pattern: /policy|procedure|standard/i,
    controlCode: 'A.5',
    confidence: 'medium',
    reason: 'File name references information security policies',
  },
  {
    pattern: /training|awareness/i,
    controlCode: 'A.7',
    confidence: 'low',
    reason: 'File name references human resource security or training',
  },
];

export async function POST(request: Request) {
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
    if (!user) return NextResponse.json({ suggestions: [] }, { status: 401 });

    const body = (await request.json().catch(() => ({}))) as {
      fileName?: string;
    };
    const fileName = body.fileName || '';

    const matches = KEYWORD_RULES.filter((r) => r.pattern.test(fileName));
    if (matches.length === 0) {
      return NextResponse.json({ suggestions: [] });
    }

    const { data: membership } = await supabase
      .from('org_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .maybeSingle();
    const orgId = membership?.organization_id as string | undefined;
    if (!orgId) return NextResponse.json({ suggestions: [] });

    const codes = matches.map((m) => m.controlCode);
    const { data: controls } = await supabase
      .from('org_controls')
      .select('id, code, title, control_key')
      .eq('organization_id', orgId)
      .in('code', codes)
      .limit(20);

    const suggestions = (controls ?? []).map((c) => {
      const rule = matches.find((m) => m.controlCode === c.code);
      return {
        controlId: c.id as string,
        code: c.code as string,
        title: (c.title as string | null) ?? '',
        confidence: rule?.confidence ?? 'low',
        reason: rule?.reason ?? '',
      };
    });

    return NextResponse.json({ suggestions });
  } catch (err) {
    log.error({ err }, 'suggest-mappings failed');
    return NextResponse.json({ suggestions: [] });
  }
}
