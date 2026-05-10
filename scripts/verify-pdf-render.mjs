// Renders each PDF template against fixture data and writes the resulting
// bytes to /tmp. Use this to spot-check the actual @react-pdf/renderer
// output, since Jest's CJS environment cannot load @react-pdf/renderer
// (pure ESM). Run with: npx tsx scripts/verify-pdf-render.mjs

import { writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';

const NOW = '2026-05-10T12:00:00Z';
const OUT_DIR = path.join(tmpdir(), 'formaos-pdf-verify');

async function loadTemplates() {
  // tsx is required to import .tsx — invoke this script via `npx tsx`.
  const board = await import('../lib/exports/pdf/templates/board-pack.tsx');
  const posture = await import('../lib/exports/pdf/templates/posture-report.tsx');
  const audit = await import('../lib/exports/pdf/templates/audit-extract.tsx');
  return {
    BoardPackDocument: board.BoardPackDocument,
    PostureReportDocument: posture.PostureReportDocument,
    AuditExtractDocument: audit.AuditExtractDocument,
  };
}

const boardPackInput = {
  kind: 'board-pack',
  orgName: 'Acme Health',
  generatedAt: NOW,
  classification: 'CONFIDENTIAL',
  dateRange: { from: '2026-01-01', to: '2026-04-30' },
  sections: [
    {
      title: 'Executive Summary',
      type: 'summary',
      data: {
        complianceScore: 78,
        totalControls: 64,
        satisfiedControls: 50,
        evidenceCount: 312,
        openTasks: 9,
        dateRange: { from: '2026-01-01', to: '2026-04-30' },
      },
    },
    {
      title: 'Compliance Scorecard',
      type: 'scorecard',
      data: {
        'soc2-tsc': { total: 61, satisfied: 47, score: 77 },
        'iso27001-2022': { total: 93, satisfied: 71, score: 76 },
      },
    },
    {
      title: 'Risk Register',
      type: 'risk_register',
      data: [
        { id: 'r-1', title: 'CC6.1 — Logical access security', status: 'partial', priority: 'high' },
        { id: 'r-2', title: 'A.8.13 — Information backup', status: 'gap', priority: 'critical' },
      ],
    },
    { title: 'Audit Readiness', type: 'audit_readiness', data: { readinessPercent: 78 } },
    {
      title: 'Incident Summary',
      type: 'incidents',
      data: { total: 4, resolved: 3, open: 1, bySeverity: { high: 1, medium: 2, low: 1 } },
    },
    { title: 'Remediation Tracker', type: 'remediation', data: { total: 22, completed: 13, overdue: 2 } },
  ],
};

const postureInput = {
  kind: 'posture-report',
  orgName: 'Acme Health',
  generatedAt: NOW,
  frameworks: [
    {
      code: 'soc2-tsc',
      name: 'SOC 2 TSC',
      score: 77,
      totalControls: 61,
      satisfiedControls: 47,
      partialControls: 5,
      notAssessedControls: 9,
    },
    {
      code: 'iso27001-2022',
      name: 'ISO 27001:2022',
      score: 76,
      totalControls: 93,
      satisfiedControls: 71,
      partialControls: 8,
      notAssessedControls: 14,
    },
  ],
  topGaps: [
    { controlCode: 'CC6.1', title: 'Logical access security', framework: 'soc2-tsc', severity: 'high' },
    { controlCode: 'A.8.13', title: 'Information backup', framework: 'iso27001-2022', severity: 'critical' },
  ],
  notes: 'Scope finalised 2026-04-30.',
};

const auditInput = {
  kind: 'audit-extract',
  orgName: 'Acme Health',
  generatedAt: NOW,
  range: { from: '2026-04-01', to: '2026-04-30' },
  entries: Array.from({ length: 35 }).map((_, i) => ({
    occurredAt: `2026-04-${String((i % 28) + 1).padStart(2, '0')}T08:${String(i % 60).padStart(2, '0')}:00Z`,
    actor: `user-${(i % 5) + 1}@acme.test`,
    action: i % 3 === 0 ? 'control.evaluated' : 'evidence.uploaded',
    target: `control-${i + 1}`,
    detail: `Detail line ${i + 1}`,
  })),
};

function checkPdfShape(label, buf) {
  const head = buf.subarray(0, 8).toString('utf8');
  const tail = buf.subarray(buf.length - 8).toString('utf8');
  const text = buf.toString('latin1');
  const pageCount = (text.match(/\/Type\s*\/Page[^s]/g) ?? []).length;
  const issues = [];
  if (!head.startsWith('%PDF-')) issues.push('missing %PDF header');
  if (!tail.includes('%%EOF')) issues.push('missing %%EOF trailer');
  if (pageCount === 0) issues.push('no pages detected');
  return { ok: issues.length === 0, issues, pageCount, bytes: buf.length };
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const tpl = await loadTemplates();

  const cases = [
    { name: 'board-pack', el: React.createElement(tpl.BoardPackDocument, boardPackInput) },
    { name: 'posture-report', el: React.createElement(tpl.PostureReportDocument, postureInput) },
    { name: 'audit-extract', el: React.createElement(tpl.AuditExtractDocument, auditInput) },
  ];

  let allOk = true;
  for (const c of cases) {
    const buf = await renderToBuffer(c.el);
    const out = path.join(OUT_DIR, `${c.name}.pdf`);
    await writeFile(out, buf);
    const shape = checkPdfShape(c.name, buf);
    if (!shape.ok) allOk = false;
    console.log(
      `[${shape.ok ? 'OK' : 'FAIL'}] ${c.name} — ${shape.bytes} bytes, ${shape.pageCount} page(s) → ${out}` +
        (shape.issues.length ? `  issues: ${shape.issues.join(', ')}` : ''),
    );
  }

  if (!allOk) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
