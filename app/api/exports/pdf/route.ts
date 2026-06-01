import { NextResponse } from 'next/server';
import { generateBoardPack } from '@/lib/executive/board-pack-generator';
import { renderPdf } from '@/lib/exports/pdf/renderer';
import type { BoardPackPdfInput } from '@/lib/exports/pdf/types';
import { validateCsrfOrigin } from '@/lib/security/csrf';
import { rateLimitApi } from '@/lib/security/rate-limiter';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

type BoardPackRequest = {
  kind: 'board-pack';
  dateRange: { from: string; to: string };
  frameworks?: string[];
  includeAppendix?: boolean;
  classification?: string;
  pageSize?: 'A4' | 'LETTER';
};

function isIsoDate(s: unknown): s is string {
  return typeof s === 'string' && !Number.isNaN(new Date(s).getTime());
}

function parseRequest(body: unknown): BoardPackRequest | { error: string } {
  if (!body || typeof body !== 'object') {
    return { error: 'Body must be a JSON object' };
  }
  const b = body as Record<string, unknown>;
  if (b.kind !== 'board-pack') {
    return {
      error:
        'Only kind=board-pack is supported in this release. Posture-report and audit-extract data builders ship in a follow-up.',
    };
  }
  const dr = b.dateRange as { from?: unknown; to?: unknown } | undefined;
  if (!dr || !isIsoDate(dr.from) || !isIsoDate(dr.to)) {
    return { error: 'dateRange.from and dateRange.to must be ISO date strings' };
  }
  return {
    kind: 'board-pack',
    dateRange: { from: dr.from, to: dr.to },
    frameworks: Array.isArray(b.frameworks)
      ? (b.frameworks as string[]).filter((s) => typeof s === 'string')
      : undefined,
    includeAppendix: Boolean(b.includeAppendix),
    classification:
      typeof b.classification === 'string' ? b.classification : undefined,
    pageSize: b.pageSize === 'LETTER' ? 'LETTER' : 'A4',
  };
}

export async function POST(request: Request) {
  const csrfError = validateCsrfOrigin(request);
  if (csrfError) return csrfError;

  // Board-pack PDF generation is CPU-heavy (full document render). Rate-limit
  // it like the other export endpoints so an authenticated member can't spin
  // up unbounded concurrent renders.
  const rate = await rateLimitApi(request);
  if (!rate.success) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
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
  if (!membership?.organization_id) {
    return NextResponse.json({ error: 'No active org' }, { status: 403 });
  }
  const allowedRoles = new Set(['owner', 'admin', 'compliance_lead']);
  if (!allowedRoles.has(String(membership.role))) {
    return NextResponse.json(
      { error: 'Insufficient permissions for export' },
      { status: 403 },
    );
  }

  let requestBody: unknown;
  try {
    requestBody = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = parseRequest(requestBody);
  if ('error' in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const pack = await generateBoardPack(membership.organization_id, {
    dateRange: parsed.dateRange,
    frameworks: parsed.frameworks,
    includeAppendix: parsed.includeAppendix,
    classification: parsed.classification,
  });

  const spec: BoardPackPdfInput = {
    kind: 'board-pack',
    pageSize: parsed.pageSize,
    orgName: pack.orgName,
    generatedAt: pack.generatedAt,
    classification: parsed.classification,
    dateRange: parsed.dateRange,
    sections: pack.sections,
  };
  const pdf = await renderPdf(spec);
  const buffer = Buffer.from(pdf);

  const filename = `board-pack-${parsed.dateRange.from}_${parsed.dateRange.to}.pdf`;
  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length.toString(),
      'Cache-Control': 'no-store',
    },
  });
}
