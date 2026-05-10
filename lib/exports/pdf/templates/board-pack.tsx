import React from 'react';
import { Document, Page, Text, View } from '@react-pdf/renderer';
import {
  PageFooter,
  PageHeader,
  formatDate,
  severityColor,
  styles,
} from '../shared';
import type { BoardPackPdfInput } from '../types';

type SummaryData = {
  complianceScore: number;
  totalControls: number;
  satisfiedControls: number;
  evidenceCount: number;
  openTasks: number;
  dateRange: { from: string; to: string };
};

type ScorecardData = Record<
  string,
  { total: number; satisfied: number; score: number }
>;

type RiskRow = {
  id: string;
  title?: string;
  status?: string;
  priority?: string;
  framework_id?: string;
};

type IncidentData = {
  total: number;
  resolved: number;
  open: number;
  bySeverity: Record<string, number>;
};

type RemediationData = {
  total: number;
  completed: number;
  overdue: number;
};

function SummarySection({ data }: { data: SummaryData }) {
  return (
    <View>
      <View style={styles.kvRow}>
        <Text style={styles.kvKey}>Compliance score</Text>
        <Text style={styles.kvValue}>{data.complianceScore}%</Text>
      </View>
      <View style={styles.kvRow}>
        <Text style={styles.kvKey}>Controls satisfied</Text>
        <Text style={styles.kvValue}>
          {data.satisfiedControls} of {data.totalControls}
        </Text>
      </View>
      <View style={styles.kvRow}>
        <Text style={styles.kvKey}>Evidence on file</Text>
        <Text style={styles.kvValue}>{data.evidenceCount}</Text>
      </View>
      <View style={styles.kvRow}>
        <Text style={styles.kvKey}>Open tasks</Text>
        <Text style={styles.kvValue}>{data.openTasks}</Text>
      </View>
      <View style={styles.kvRow}>
        <Text style={styles.kvKey}>Reporting period</Text>
        <Text style={styles.kvValue}>
          {formatDate(data.dateRange.from)} → {formatDate(data.dateRange.to)}
        </Text>
      </View>
    </View>
  );
}

function ScorecardSection({ data }: { data: ScorecardData }) {
  const rows = Object.entries(data);
  if (rows.length === 0) {
    return <Text style={styles.paragraph}>No frameworks in scope.</Text>;
  }
  return (
    <View style={styles.table}>
      <View style={styles.tableHeaderRow}>
        <Text style={[styles.tableHeaderCell, { flex: 3 }]}>Framework</Text>
        <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>
          Score
        </Text>
        <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>
          Satisfied
        </Text>
        <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>
          Total
        </Text>
      </View>
      {rows.map(([fw, score]) => (
        <View key={fw} style={styles.tableRow}>
          <Text style={[styles.tableCell, { flex: 3 }]}>{fw}</Text>
          <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>
            {score.score}%
          </Text>
          <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>
            {score.satisfied}
          </Text>
          <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>
            {score.total}
          </Text>
        </View>
      ))}
    </View>
  );
}

function RiskTable({
  rows,
  emptyMessage,
}: {
  rows: RiskRow[];
  emptyMessage: string;
}) {
  if (rows.length === 0) {
    return <Text style={styles.paragraph}>{emptyMessage}</Text>;
  }
  return (
    <View style={styles.table}>
      <View style={styles.tableHeaderRow}>
        <Text style={[styles.tableHeaderCell, { flex: 4 }]}>Control</Text>
        <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Priority</Text>
        <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Status</Text>
      </View>
      {rows.map((r) => (
        <View key={r.id} style={styles.tableRow} wrap={false}>
          <Text style={[styles.tableCell, { flex: 4 }]}>
            {r.title ?? r.id}
          </Text>
          <Text
            style={[
              styles.tableCell,
              { flex: 1.5, color: severityColor(r.priority ?? 'low') },
            ]}
          >
            {r.priority ?? 'unspecified'}
          </Text>
          <Text style={[styles.tableCell, { flex: 1.5 }]}>
            {r.status ?? 'unknown'}
          </Text>
        </View>
      ))}
    </View>
  );
}

function IncidentSection({ data }: { data: IncidentData }) {
  return (
    <View>
      <View style={styles.kvRow}>
        <Text style={styles.kvKey}>Total incidents</Text>
        <Text style={styles.kvValue}>{data.total}</Text>
      </View>
      <View style={styles.kvRow}>
        <Text style={styles.kvKey}>Resolved</Text>
        <Text style={styles.kvValue}>{data.resolved}</Text>
      </View>
      <View style={styles.kvRow}>
        <Text style={styles.kvKey}>Open</Text>
        <Text style={styles.kvValue}>{data.open}</Text>
      </View>
      {Object.entries(data.bySeverity).map(([sev, count]) => (
        <View key={sev} style={styles.kvRow}>
          <Text style={styles.kvKey}>By severity — {sev}</Text>
          <Text style={[styles.kvValue, { color: severityColor(sev) }]}>
            {count}
          </Text>
        </View>
      ))}
    </View>
  );
}

function RemediationSection({ data }: { data: RemediationData }) {
  return (
    <View>
      <View style={styles.kvRow}>
        <Text style={styles.kvKey}>Total tasks</Text>
        <Text style={styles.kvValue}>{data.total}</Text>
      </View>
      <View style={styles.kvRow}>
        <Text style={styles.kvKey}>Completed</Text>
        <Text style={styles.kvValue}>{data.completed}</Text>
      </View>
      <View style={styles.kvRow}>
        <Text style={styles.kvKey}>Overdue</Text>
        <Text style={[styles.kvValue, { color: severityColor('high') }]}>
          {data.overdue}
        </Text>
      </View>
    </View>
  );
}

function AuditReadinessSection({ data }: { data: { readinessPercent: number } }) {
  return (
    <View style={styles.kvRow}>
      <Text style={styles.kvKey}>Readiness</Text>
      <Text style={styles.kvValue}>{data.readinessPercent}%</Text>
    </View>
  );
}

function renderSection(section: BoardPackPdfInput['sections'][number]) {
  switch (section.type) {
    case 'summary':
      return <SummarySection data={section.data as SummaryData} />;
    case 'scorecard':
      return <ScorecardSection data={section.data as ScorecardData} />;
    case 'risk_register':
      return (
        <RiskTable
          rows={(section.data as RiskRow[]) ?? []}
          emptyMessage="No critical or high-priority risks recorded."
        />
      );
    case 'gaps':
      return (
        <RiskTable
          rows={(section.data as RiskRow[]) ?? []}
          emptyMessage="No control gaps recorded."
        />
      );
    case 'audit_readiness':
      return (
        <AuditReadinessSection
          data={section.data as { readinessPercent: number }}
        />
      );
    case 'incidents':
      return <IncidentSection data={section.data as IncidentData} />;
    case 'remediation':
      return <RemediationSection data={section.data as RemediationData} />;
    case 'appendix':
      return (
        <RiskTable
          rows={(section.data as RiskRow[]) ?? []}
          emptyMessage="No appendix data."
        />
      );
    default:
      return null;
  }
}

export function BoardPackDocument(input: BoardPackPdfInput) {
  return (
    <Document
      title={`${input.orgName} — Board Pack`}
      author="FormaOS"
      creator="FormaOS"
      producer="FormaOS"
    >
      <Page size={input.pageSize ?? 'A4'} style={styles.page}>
        <PageHeader
          title="Board Pack"
          orgName={input.orgName}
          classification={input.classification}
        />
        <PageFooter generatedAt={input.generatedAt} />
        <Text style={styles.h1}>Board Compliance Pack</Text>
        <Text style={styles.meta}>
          {input.orgName} · Period {formatDate(input.dateRange.from)} —{' '}
          {formatDate(input.dateRange.to)}
        </Text>
        {input.sections.map((section, i) => (
          <View key={`${section.type}-${i}`} wrap>
            <Text style={styles.h2}>{section.title}</Text>
            {renderSection(section)}
          </View>
        ))}
      </Page>
    </Document>
  );
}
