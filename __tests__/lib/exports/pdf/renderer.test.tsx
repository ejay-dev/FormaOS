/**
 * @jest-environment node
 *
 * Unit tests verify the renderer dispatches to the right template with the
 * right props. The actual @react-pdf/renderer library is pure ESM and cannot
 * load under Jest's CJS environment without significant infra changes, so a
 * real end-to-end render is exercised in scripts/verify-pdf-render.mjs.
 */

jest.mock('@react-pdf/renderer', () => {
  const React = require('react');
  return {
    __esModule: true,
    renderToBuffer: jest.fn(async () => Buffer.from('%PDF-1.4 mock')),
    Document: ({ children, ...props }: any) =>
      React.createElement('Document', props, children),
    Page: ({ children, ...props }: any) =>
      React.createElement('Page', props, children),
    View: ({ children, ...props }: any) =>
      React.createElement('View', props, children),
    Text: ({ children, ...props }: any) =>
      React.createElement('Text', props, children),
    StyleSheet: { create: (styles: any) => styles },
    Font: { register: jest.fn(), registerHyphenationCallback: jest.fn() },
  };
});

// eslint-disable-next-line @typescript-eslint/no-var-requires
const reactPdfMock = require('@react-pdf/renderer');
const renderToBufferMock = reactPdfMock.renderToBuffer as jest.Mock;

import { renderPdf } from '@/lib/exports/pdf/renderer';
import type {
  AuditExtractPdfInput,
  BoardPackPdfInput,
  PostureReportPdfInput,
} from '@/lib/exports/pdf/types';

const FIXED_NOW = '2026-05-10T12:00:00Z';

function callShape() {
  expect(renderToBufferMock).toHaveBeenCalledTimes(1);
  return renderToBufferMock.mock.calls[0][0];
}

beforeEach(() => {
  renderToBufferMock.mockClear();
});

describe('renderPdf — dispatch and props', () => {
  it('dispatches a board-pack spec to BoardPackDocument with all sections', async () => {
    const input: BoardPackPdfInput = {
      kind: 'board-pack',
      orgName: 'Acme Health',
      generatedAt: FIXED_NOW,
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
            {
              id: 'r-1',
              title: 'CC6.1 — Logical access security',
              status: 'partial',
              priority: 'high',
            },
          ],
        },
        {
          title: 'Audit Readiness',
          type: 'audit_readiness',
          data: { readinessPercent: 78 },
        },
        {
          title: 'Incident Summary',
          type: 'incidents',
          data: {
            total: 4,
            resolved: 3,
            open: 1,
            bySeverity: { high: 1, medium: 2, low: 1 },
          },
        },
        {
          title: 'Remediation Tracker',
          type: 'remediation',
          data: { total: 22, completed: 13, overdue: 2 },
        },
      ],
    };
    const buf = await renderPdf(input);
    expect(Buffer.isBuffer(buf)).toBe(true);
    const element = callShape();
    expect(element.type.name).toBe('BoardPackDocument');
    expect(element.props.orgName).toBe('Acme Health');
    expect(element.props.sections).toHaveLength(6);
    expect(element.props.classification).toBe('CONFIDENTIAL');
  });

  it('dispatches a posture-report spec to PostureReportDocument', async () => {
    const input: PostureReportPdfInput = {
      kind: 'posture-report',
      orgName: 'Acme Health',
      generatedAt: FIXED_NOW,
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
      ],
      topGaps: [
        {
          controlCode: 'CC6.1',
          title: 'Logical access security',
          framework: 'soc2-tsc',
          severity: 'high',
        },
      ],
    };
    await renderPdf(input);
    const element = callShape();
    expect(element.type.name).toBe('PostureReportDocument');
    expect(element.props.orgName).toBe('Acme Health');
    expect(element.props.frameworks).toHaveLength(1);
  });

  it('dispatches an audit-extract spec to AuditExtractDocument', async () => {
    const input: AuditExtractPdfInput = {
      kind: 'audit-extract',
      orgName: 'Acme Health',
      generatedAt: FIXED_NOW,
      range: { from: '2026-04-01', to: '2026-04-30' },
      entries: [
        {
          occurredAt: '2026-04-15T08:00:00Z',
          actor: 'user@acme.test',
          action: 'control.evaluated',
          target: 'CC6.1',
          detail: 'Evaluation refreshed',
        },
      ],
    };
    await renderPdf(input);
    const element = callShape();
    expect(element.type.name).toBe('AuditExtractDocument');
    expect(element.props.entries).toHaveLength(1);
    expect(element.props.range.from).toBe('2026-04-01');
  });

  it('handles an audit-extract with zero entries (empty-state passes through)', async () => {
    const input: AuditExtractPdfInput = {
      kind: 'audit-extract',
      orgName: 'Acme Health',
      generatedAt: FIXED_NOW,
      range: { from: '2026-04-01', to: '2026-04-30' },
      entries: [],
    };
    const buf = await renderPdf(input);
    expect(Buffer.isBuffer(buf)).toBe(true);
    expect(renderToBufferMock).toHaveBeenCalledTimes(1);
  });
});
