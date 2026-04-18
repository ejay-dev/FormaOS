import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Row,
  Section,
  Text,
  Column,
} from '@react-email/components';
import * as React from 'react';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.formaos.com.au';
const BASE = APP_URL.replace(/\/$/, '');

// Shared tokens — keep aligned with lifecycle-emails.tsx
const main = {
  backgroundColor: '#0f172a',
  fontFamily: 'Inter,-apple-system,BlinkMacSystemFont,sans-serif',
};
const container = {
  margin: '0 auto',
  maxWidth: '600px',
  backgroundColor: '#1e293b',
  borderRadius: '12px',
  overflow: 'hidden' as const,
};
const header = {
  padding: '28px 40px 24px',
  background: 'linear-gradient(135deg,#0f172a 0%,#1e293b 100%)',
  borderBottom: '1px solid rgba(34,211,238,0.2)',
};
const logo = {
  color: '#22d3ee',
  fontSize: '24px',
  fontWeight: 800,
  letterSpacing: '-0.5px',
  margin: 0,
};
const tagline = {
  color: '#94a3b8',
  fontSize: '11px',
  letterSpacing: '0.1em',
  textTransform: 'uppercase' as const,
  marginTop: '4px',
};
const content = { padding: '32px 40px' };
const h2 = {
  color: '#f1f5f9',
  fontSize: '22px',
  lineHeight: 1.3,
  marginBottom: '6px',
};
const subline = {
  color: '#94a3b8',
  fontSize: '13px',
  margin: '0 0 20px',
};
const text = { color: '#cbd5e1', fontSize: '14px', lineHeight: 1.7 };
const cta = {
  display: 'inline-block',
  padding: '14px 28px',
  backgroundColor: '#22d3ee',
  borderRadius: '8px',
  color: '#0f172a',
  fontSize: '14px',
  fontWeight: 700,
  textDecoration: 'none',
};
const footer = {
  color: '#475569',
  fontSize: '12px',
  fontStyle: 'italic' as const,
  margin: 0,
};

// Hero readiness tile
const readinessCard = {
  background:
    'linear-gradient(135deg,rgba(34,211,238,0.12) 0%,rgba(136,100,255,0.10) 100%)',
  border: '1px solid rgba(34,211,238,0.25)',
  borderRadius: '12px',
  padding: '22px 24px',
  margin: '0 0 24px',
};
const readinessLabel = {
  color: '#94a3b8',
  fontSize: '11px',
  letterSpacing: '0.12em',
  textTransform: 'uppercase' as const,
  margin: 0,
};
const readinessValue = {
  color: '#22d3ee',
  fontSize: '44px',
  fontWeight: 800,
  lineHeight: 1,
  margin: '6px 0 2px',
};
const readinessDeltaStyle = {
  color: '#94a3b8',
  fontSize: '13px',
  margin: 0,
};

// Bullet row
const bulletRow = {
  padding: '12px 16px',
  background: '#0f172a',
  border: '1px solid rgba(148,163,184,0.1)',
  borderRadius: '10px',
  marginBottom: '8px',
};

const sectionLabel = {
  color: '#94a3b8',
  fontSize: '11px',
  letterSpacing: '0.12em',
  textTransform: 'uppercase' as const,
  margin: '20px 0 10px',
  fontWeight: 700,
};

export interface WeeklyComplianceDigestProps {
  recipientName?: string;
  organizationName?: string;
  readinessPercent?: number;
  readinessDelta?: number; // +/- vs last week
  overdueControls?: Array<{ name: string; owner?: string; daysOverdue: number }>;
  evidenceExpiring?: Array<{ name: string; daysUntilExpiry: number }>;
  tasksAssignedToYou?: Array<{ title: string; dueInDays: number }>;
  weekEndingDate?: string; // e.g. "Sun 20 Apr 2026"
}

export function WeeklyComplianceDigestEmail({
  recipientName = 'there',
  organizationName = 'your organisation',
  readinessPercent = 0,
  readinessDelta = 0,
  overdueControls = [],
  evidenceExpiring = [],
  tasksAssignedToYou = [],
  weekEndingDate = '',
}: WeeklyComplianceDigestProps) {
  const deltaSign = readinessDelta > 0 ? '+' : '';
  const deltaColor =
    readinessDelta > 0 ? '#34d399' : readinessDelta < 0 ? '#f87171' : '#94a3b8';

  return (
    <Html>
      <Head />
      <Preview>{`Your weekly compliance digest for ${organizationName} — readiness ${readinessPercent}%`}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={logo}>FormaOS</Heading>
            <Text style={tagline}>Weekly Compliance Digest</Text>
          </Section>

          <Section style={content}>
            <Heading style={h2}>Good morning, {recipientName}.</Heading>
            <Text style={subline}>
              Your readiness snapshot for {organizationName}
              {weekEndingDate ? ` — week ending ${weekEndingDate}` : ''}.
            </Text>

            {/* Readiness hero */}
            <Section style={readinessCard}>
              <Row>
                <Column>
                  <Text style={readinessLabel}>Overall readiness</Text>
                  <Text style={readinessValue}>{readinessPercent}%</Text>
                  <Text style={{ ...readinessDeltaStyle, color: deltaColor }}>
                    {deltaSign}
                    {readinessDelta} pts vs last week
                  </Text>
                </Column>
              </Row>
            </Section>

            {/* Overdue controls */}
            {overdueControls.length > 0 && (
              <>
                <Text style={sectionLabel}>Overdue controls</Text>
                {overdueControls.slice(0, 3).map((c, i) => (
                  <Section key={i} style={bulletRow}>
                    <Text
                      style={{ ...text, margin: 0, color: '#f1f5f9' }}
                    >
                      <strong>{c.name}</strong>
                      {c.owner ? (
                        <span style={{ color: '#94a3b8' }}> · {c.owner}</span>
                      ) : null}
                    </Text>
                    <Text
                      style={{
                        ...text,
                        fontSize: '12px',
                        color: '#f87171',
                        margin: '4px 0 0',
                      }}
                    >
                      {c.daysOverdue}d overdue
                    </Text>
                  </Section>
                ))}
                {overdueControls.length > 3 && (
                  <Text style={{ ...text, fontSize: '12px' }}>
                    +{overdueControls.length - 3} more overdue control
                    {overdueControls.length - 3 === 1 ? '' : 's'}
                  </Text>
                )}
              </>
            )}

            {/* Evidence expiring */}
            {evidenceExpiring.length > 0 && (
              <>
                <Text style={sectionLabel}>Evidence expiring soon</Text>
                {evidenceExpiring.slice(0, 3).map((e, i) => (
                  <Section key={i} style={bulletRow}>
                    <Text
                      style={{ ...text, margin: 0, color: '#f1f5f9' }}
                    >
                      <strong>{e.name}</strong>
                    </Text>
                    <Text
                      style={{
                        ...text,
                        fontSize: '12px',
                        color: e.daysUntilExpiry <= 7 ? '#f87171' : '#fb923c',
                        margin: '4px 0 0',
                      }}
                    >
                      expires in {e.daysUntilExpiry}d
                    </Text>
                  </Section>
                ))}
              </>
            )}

            {/* Your tasks */}
            {tasksAssignedToYou.length > 0 && (
              <>
                <Text style={sectionLabel}>Assigned to you this week</Text>
                {tasksAssignedToYou.slice(0, 4).map((t, i) => (
                  <Section key={i} style={bulletRow}>
                    <Text
                      style={{ ...text, margin: 0, color: '#f1f5f9' }}
                    >
                      {t.title}
                    </Text>
                    <Text
                      style={{
                        ...text,
                        fontSize: '12px',
                        color:
                          t.dueInDays <= 2
                            ? '#f87171'
                            : t.dueInDays <= 7
                              ? '#fb923c'
                              : '#94a3b8',
                        margin: '4px 0 0',
                      }}
                    >
                      due in {t.dueInDays}d
                    </Text>
                  </Section>
                ))}
              </>
            )}

            {/* Empty state if everything's green */}
            {overdueControls.length === 0 &&
              evidenceExpiring.length === 0 &&
              tasksAssignedToYou.length === 0 && (
                <Text style={{ ...text, textAlign: 'center' as const }}>
                  Nothing overdue. Evidence is current. No assigned tasks this
                  week. Well-governed shop. 🟢
                </Text>
              )}

            <Section style={{ textAlign: 'center' as const, margin: '28px 0 8px' }}>
              <Button href={`${BASE}/app`} style={cta}>
                Open dashboard →
              </Button>
            </Section>

            <Hr
              style={{ borderColor: 'rgba(34,211,238,0.1)', margin: '22px 0 14px' }}
            />
            <Text style={footer}>
              You receive weekly digests because you&apos;re a compliance owner.{' '}
              <a href={`${BASE}/app/settings/notifications`} style={{ color: '#64748b' }}>
                Update preferences
              </a>
              .
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default WeeklyComplianceDigestEmail;
