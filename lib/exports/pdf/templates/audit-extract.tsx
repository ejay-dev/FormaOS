import React from 'react';
import { Document, Page, Text, View } from '@react-pdf/renderer';
import {
  PageFooter,
  PageHeader,
  formatDate,
  formatTimestamp,
  styles,
} from '../shared';
import type { AuditExtractPdfInput } from '../types';

export function AuditExtractDocument(input: AuditExtractPdfInput) {
  return (
    <Document
      title={`${input.orgName} — Audit Trail Extract`}
      author="FormaOS"
      creator="FormaOS"
      producer="FormaOS"
    >
      <Page size={input.pageSize ?? 'A4'} style={styles.page}>
        <PageHeader title="Audit Trail Extract" orgName={input.orgName} />
        <PageFooter generatedAt={input.generatedAt} />
        <Text style={styles.h1}>Audit Trail Extract</Text>
        <Text style={styles.meta}>
          {input.orgName} · {formatDate(input.range.from)} —{' '}
          {formatDate(input.range.to)} · {input.entries.length} event(s)
        </Text>

        {input.entries.length === 0 ? (
          <Text style={styles.paragraph}>
            No audit events recorded in this range.
          </Text>
        ) : (
          <View style={styles.table}>
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.tableHeaderCell, { flex: 2 }]}>When</Text>
              <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Actor</Text>
              <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Action</Text>
              <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Target</Text>
              <Text style={[styles.tableHeaderCell, { flex: 3 }]}>Detail</Text>
            </View>
            {input.entries.map((e, idx) => (
              <View
                key={`${e.occurredAt}-${idx}`}
                style={styles.tableRow}
                wrap={false}
              >
                <Text style={[styles.tableCell, { flex: 2 }]}>
                  {formatTimestamp(e.occurredAt)}
                </Text>
                <Text style={[styles.tableCell, { flex: 2 }]}>{e.actor}</Text>
                <Text style={[styles.tableCell, { flex: 2 }]}>{e.action}</Text>
                <Text style={[styles.tableCell, { flex: 2 }]}>
                  {e.target ?? '—'}
                </Text>
                <Text style={[styles.tableCell, { flex: 3 }]}>
                  {e.detail ?? ''}
                </Text>
              </View>
            ))}
          </View>
        )}
      </Page>
    </Document>
  );
}
