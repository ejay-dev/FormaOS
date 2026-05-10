import React from 'react';
import { Document, Page, Text, View } from '@react-pdf/renderer';
import {
  PageFooter,
  PageHeader,
  formatTimestamp,
  severityColor,
  styles,
} from '../shared';
import type { PostureReportPdfInput } from '../types';

export function PostureReportDocument(input: PostureReportPdfInput) {
  return (
    <Document
      title={`${input.orgName} — Compliance Posture`}
      author="FormaOS"
      creator="FormaOS"
      producer="FormaOS"
    >
      <Page size={input.pageSize ?? 'A4'} style={styles.page}>
        <PageHeader title="Compliance Posture" orgName={input.orgName} />
        <PageFooter generatedAt={input.generatedAt} />
        <Text style={styles.h1}>Compliance Posture Report</Text>
        <Text style={styles.meta}>
          {input.orgName} · As of {formatTimestamp(input.generatedAt)}
        </Text>

        <Text style={styles.h2}>Framework scores</Text>
        {input.frameworks.length === 0 ? (
          <Text style={styles.paragraph}>No frameworks in scope.</Text>
        ) : (
          <View style={styles.table}>
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.tableHeaderCell, { flex: 3 }]}>Framework</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>Score</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>Pass</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>Partial</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>Not assessed</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>Total</Text>
            </View>
            {input.frameworks.map((fw) => (
              <View key={fw.code} style={styles.tableRow} wrap={false}>
                <Text style={[styles.tableCell, { flex: 3 }]}>
                  {fw.name} ({fw.code})
                </Text>
                <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>
                  {fw.score}%
                </Text>
                <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>
                  {fw.satisfiedControls}
                </Text>
                <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>
                  {fw.partialControls}
                </Text>
                <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>
                  {fw.notAssessedControls}
                </Text>
                <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>
                  {fw.totalControls}
                </Text>
              </View>
            ))}
          </View>
        )}

        <Text style={styles.h2}>Top gaps</Text>
        {input.topGaps.length === 0 ? (
          <Text style={styles.paragraph}>No outstanding gaps.</Text>
        ) : (
          <View style={styles.table}>
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Code</Text>
              <Text style={[styles.tableHeaderCell, { flex: 4 }]}>Control</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Framework</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1.2 }]}>Severity</Text>
            </View>
            {input.topGaps.map((g) => (
              <View key={`${g.framework}-${g.controlCode}`} style={styles.tableRow} wrap={false}>
                <Text style={[styles.tableCell, { flex: 1 }]}>{g.controlCode}</Text>
                <Text style={[styles.tableCell, { flex: 4 }]}>{g.title}</Text>
                <Text style={[styles.tableCell, { flex: 1.5 }]}>{g.framework}</Text>
                <Text
                  style={[
                    styles.tableCell,
                    { flex: 1.2, color: severityColor(g.severity) },
                  ]}
                >
                  {g.severity}
                </Text>
              </View>
            ))}
          </View>
        )}

        {input.notes ? (
          <View>
            <Text style={styles.h2}>Notes</Text>
            <Text style={styles.paragraph}>{input.notes}</Text>
          </View>
        ) : null}
      </Page>
    </Document>
  );
}
