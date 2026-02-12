import { NextResponse } from 'next/server';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { TRUST_SUBPROCESSORS } from '@/lib/trust/subprocessors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function pct(ok: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((ok / total) * 10000) / 100;
}

async function buildVendorTrustPacketPdf(payload: {
  generatedAt: string;
  uptime: {
    last7d: { uptimePercent: number; checks: number };
    last30d: { uptimePercent: number; checks: number };
  };
}) {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const page = pdfDoc.addPage([595.28, 841.89]); // A4
  const { width, height } = page.getSize();
  const margin = 48;
  let y = height - margin;

  const drawH1 = (text: string) => {
    page.drawText(text, { x: margin, y, size: 22, font: fontBold, color: rgb(0.05, 0.05, 0.07) });
    y -= 30;
  };

  const drawH2 = (text: string) => {
    page.drawText(text, { x: margin, y, size: 12, font: fontBold, color: rgb(0.12, 0.12, 0.16) });
    y -= 18;
  };

  const drawP = (text: string) => {
    const size = 10;
    const lineHeight = 14;
    const maxWidth = width - margin * 2;
    const words = text.split(' ');
    let line = '';
    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      const tw = font.widthOfTextAtSize(test, size);
      if (tw > maxWidth) {
        page.drawText(line, { x: margin, y, size, font, color: rgb(0.2, 0.2, 0.24) });
        y -= lineHeight;
        line = w;
      } else {
        line = test;
      }
    }
    if (line) {
      page.drawText(line, { x: margin, y, size, font, color: rgb(0.2, 0.2, 0.24) });
      y -= lineHeight;
    }
  };

  // Header bar
  page.drawRectangle({
    x: 0,
    y: height - 90,
    width,
    height: 90,
    color: rgb(0.06, 0.12, 0.2),
  });
  page.drawText('FormaOS', {
    x: margin,
    y: height - 48,
    size: 20,
    font: fontBold,
    color: rgb(1, 1, 1),
  });
  page.drawText('Vendor Trust Packet', {
    x: margin,
    y: height - 70,
    size: 10,
    font,
    color: rgb(0.85, 0.9, 0.98),
  });

  y = height - 120;

  drawH1('Trust Packet (Procurement Summary)');
  drawP(`Generated: ${new Date(payload.generatedAt).toLocaleString()}`);
  drawP(
    'This document is a procurement-oriented summary of FormaOS security posture and data handling. It describes implemented behavior and safe claim language (aligned vs certified).',
  );

  y -= 8;

  drawH2('Security Posture Overview');
  drawP('Identity: Google OAuth supported. Enterprise plans can enable SAML SSO (SP metadata + ACS endpoints; signed assertion validation).');
  drawP('Access control: Role-based access model with tenant isolation enforced at the database layer (RLS).');
  drawP('Auditability: Sensitive actions are logged and export actions are traceable for audit readiness.');
  drawP('Encryption: Data is encrypted in transit and at rest using infrastructure primitives.');

  y -= 8;

  drawH2('Uptime Signals (Non-SLA)');
  drawP(`Last 24/7 ops signal based on published health checks:`);
  drawP(`7 days uptime: ${payload.uptime.last7d.uptimePercent}% (${payload.uptime.last7d.checks} checks)`);
  drawP(`30 days uptime: ${payload.uptime.last30d.uptimePercent}% (${payload.uptime.last30d.checks} checks)`);

  y -= 8;

  drawH2('Aligned vs Certified (Safe Language)');
  drawP(
    'Aligned: FormaOS can map controls and generate audit artifacts for frameworks like SOC 2 and ISO 27001. Alignment means controls are modeled and operational workflows support evidence generation.',
  );
  drawP(
    'Certified: Certification requires an independent audit of FormaOS as a vendor and issuance of a formal report/certificate. Do not interpret “aligned” as “certified”.',
  );

  // Subprocessors page
  const page2 = pdfDoc.addPage([595.28, 841.89]);
  const { width: w2, height: h2 } = page2.getSize();
  let y2 = h2 - margin;

  const drawH2p2 = (text: string) => {
    page2.drawText(text, { x: margin, y: y2, size: 12, font: fontBold, color: rgb(0.12, 0.12, 0.16) });
    y2 -= 18;
  };

  const drawP2 = (text: string) => {
    const size = 10;
    const lineHeight = 14;
    const maxWidth = w2 - margin * 2;
    const words = text.split(' ');
    let line = '';
    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      const tw = font.widthOfTextAtSize(test, size);
      if (tw > maxWidth) {
        page2.drawText(line, { x: margin, y: y2, size, font, color: rgb(0.2, 0.2, 0.24) });
        y2 -= lineHeight;
        line = w;
      } else {
        line = test;
      }
    }
    if (line) {
      page2.drawText(line, { x: margin, y: y2, size, font, color: rgb(0.2, 0.2, 0.24) });
      y2 -= lineHeight;
    }
  };

  page2.drawText('FormaOS Vendor Trust Packet', {
    x: margin,
    y: h2 - 44,
    size: 16,
    font: fontBold,
    color: rgb(0.05, 0.05, 0.07),
  });
  page2.drawText(`Generated: ${new Date(payload.generatedAt).toLocaleString()}`, {
    x: margin,
    y: h2 - 62,
    size: 9,
    font,
    color: rgb(0.3, 0.3, 0.35),
  });

  y2 = h2 - 100;

  drawH2p2('Subprocessors (Current)');
  drawP2('This list reflects vendors used by the deployed FormaOS system. Roadmap vendors are intentionally excluded.');

  y2 -= 8;

  for (const sp of TRUST_SUBPROCESSORS) {
    if (y2 < margin + 60) {
      // If we overflow, add a third page.
      break;
    }
    page2.drawText(sp.name, { x: margin, y: y2, size: 11, font: fontBold, color: rgb(0.12, 0.12, 0.16) });
    y2 -= 14;
    page2.drawText(`${sp.category} | ${sp.location}`, { x: margin, y: y2, size: 9, font, color: rgb(0.35, 0.35, 0.4) });
    y2 -= 12;
    drawP2(`Purpose: ${sp.purpose}`);
    y2 -= 6;
  }

  page2.drawText('Contact: security@formaos.com.au | privacy@formaos.com.au', {
    x: margin,
    y: margin - 10,
    size: 9,
    font,
    color: rgb(0.35, 0.35, 0.4),
  });

  return await pdfDoc.save();
}

export async function GET() {
  const admin = createSupabaseAdminClient();
  const generatedAt = new Date().toISOString();

  const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [{ data: d7 }, { data: d30 }] = await Promise.all([
    admin
      .from('public_uptime_checks')
      .select('ok, checked_at')
      .gte('checked_at', since7d)
      .order('checked_at', { ascending: false })
      .limit(5000),
    admin
      .from('public_uptime_checks')
      .select('ok, checked_at')
      .gte('checked_at', since30d)
      .order('checked_at', { ascending: false })
      .limit(20000),
  ]);

  const rows7 = (d7 ?? []) as Array<{ ok: boolean }>;
  const rows30 = (d30 ?? []) as Array<{ ok: boolean }>;

  const uptime = {
    last7d: {
      uptimePercent: pct(rows7.filter((r) => r.ok).length, rows7.length),
      checks: rows7.length,
    },
    last30d: {
      uptimePercent: pct(rows30.filter((r) => r.ok).length, rows30.length),
      checks: rows30.length,
    },
  };

  const bytes = await buildVendorTrustPacketPdf({ generatedAt, uptime });
  const buffer = Buffer.from(bytes);
  const filename = `FormaOS_Vendor_Trust_Packet_${new Date().toISOString().slice(0, 10)}.pdf`;

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
