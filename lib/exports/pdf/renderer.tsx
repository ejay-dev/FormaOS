import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import { AuditExtractDocument } from './templates/audit-extract';
import { BoardPackDocument } from './templates/board-pack';
import { PostureReportDocument } from './templates/posture-report';
import type { ExportSpec } from './types';

export async function renderPdf(spec: ExportSpec): Promise<Buffer> {
  switch (spec.kind) {
    case 'board-pack':
      return renderToBuffer(<BoardPackDocument {...spec} />);
    case 'posture-report':
      return renderToBuffer(<PostureReportDocument {...spec} />);
    case 'audit-extract':
      return renderToBuffer(<AuditExtractDocument {...spec} />);
  }
}

export type { ExportSpec } from './types';
