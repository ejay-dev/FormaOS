import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.formaos.com.au';
const BASE = APP_URL.replace(/\/$/, '');

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
const text = { color: '#cbd5e1', fontSize: '14px', lineHeight: 1.7 };
const cta = {
  display: 'inline-block',
  padding: '14px 32px',
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

type Severity = 'upcoming' | 'soon' | 'imminent';

function severityFromDays(daysUntilExpiry: number): Severity {
  if (daysUntilExpiry <= 7) return 'imminent';
  if (daysUntilExpiry <= 14) return 'soon';
  return 'upcoming';
}

export interface EvidenceExpiringAlertProps {
  recipientName?: string;
  evidenceTitle?: string;
  evidenceType?: string;
  controlName?: string;
  frameworkName?: string;
  daysUntilExpiry?: number;
  expiryDate?: string; // formatted "Sun 18 May 2026"
  evidenceUrl?: string;
}

export function EvidenceExpiringAlertEmail({
  recipientName = 'there',
  evidenceTitle = 'Evidence item',
  evidenceType = 'Document',
  controlName,
  frameworkName,
  daysUntilExpiry = 30,
  expiryDate,
  evidenceUrl,
}: EvidenceExpiringAlertProps) {
  const severity = severityFromDays(daysUntilExpiry);
  const heroTint =
    severity === 'imminent'
      ? {
          bg: 'linear-gradient(135deg,rgba(248,113,113,0.14),rgba(248,113,113,0.05))',
          border: 'rgba(248,113,113,0.3)',
          accent: '#f87171',
          label: 'Imminent',
        }
      : severity === 'soon'
        ? {
            bg: 'linear-gradient(135deg,rgba(251,146,60,0.14),rgba(251,146,60,0.05))',
            border: 'rgba(251,146,60,0.3)',
            accent: '#fb923c',
            label: 'Soon',
          }
        : {
            bg: 'linear-gradient(135deg,rgba(34,211,238,0.12),rgba(34,211,238,0.03))',
            border: 'rgba(34,211,238,0.25)',
            accent: '#22d3ee',
            label: 'Upcoming',
          };

  const heroCard = {
    background: heroTint.bg,
    border: `1px solid ${heroTint.border}`,
    borderRadius: '12px',
    padding: '22px 24px',
    margin: '0 0 22px',
  };

  const chip = {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: '999px',
    border: `1px solid ${heroTint.border}`,
    color: heroTint.accent,
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
    margin: 0,
  };

  const heroValue = {
    color: heroTint.accent,
    fontSize: '44px',
    fontWeight: 800,
    lineHeight: 1,
    margin: '10px 0 4px',
  };

  const metaRow = {
    padding: '10px 14px',
    background: '#0f172a',
    border: '1px solid rgba(148,163,184,0.1)',
    borderRadius: '8px',
    marginBottom: '6px',
  };

  const metaLabel = {
    color: '#64748b',
    fontSize: '11px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    margin: 0,
  };
  const metaValue = {
    color: '#e2e8f0',
    fontSize: '14px',
    margin: '2px 0 0',
  };

  const headline =
    severity === 'imminent'
      ? `${evidenceTitle} expires in ${daysUntilExpiry}d`
      : severity === 'soon'
        ? `${evidenceTitle} expires soon`
        : `Heads up — ${evidenceTitle} is nearing expiry`;

  const ctaHref =
    evidenceUrl ||
    `${BASE}/app/evidence?filter=expiring`;

  return (
    <Html>
      <Head />
      <Preview>{`${evidenceTitle} expires in ${daysUntilExpiry} days`}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={logo}>FormaOS</Heading>
            <Text style={tagline}>Evidence Expiry Alert</Text>
          </Section>

          <Section style={content}>
            <Heading style={h2}>{headline}</Heading>
            <Text style={{ ...text, margin: '0 0 18px' }}>
              Hi {recipientName}, an evidence item linked to your compliance
              posture is approaching its expiry date.
            </Text>

            <Section style={heroCard}>
              <Text style={chip}>{heroTint.label}</Text>
              <Text style={heroValue}>
                {daysUntilExpiry}
                <span style={{ fontSize: '18px', color: '#94a3b8' }}> days</span>
              </Text>
              <Text style={{ ...text, margin: 0, fontSize: '13px' }}>
                {expiryDate ? `Expires ${expiryDate}` : 'until expiry'}
              </Text>
            </Section>

            <Section style={metaRow}>
              <Text style={metaLabel}>Item</Text>
              <Text style={metaValue}>{evidenceTitle}</Text>
            </Section>
            <Section style={metaRow}>
              <Text style={metaLabel}>Type</Text>
              <Text style={metaValue}>{evidenceType}</Text>
            </Section>
            {controlName && (
              <Section style={metaRow}>
                <Text style={metaLabel}>Linked control</Text>
                <Text style={metaValue}>{controlName}</Text>
              </Section>
            )}
            {frameworkName && (
              <Section style={metaRow}>
                <Text style={metaLabel}>Framework</Text>
                <Text style={metaValue}>{frameworkName}</Text>
              </Section>
            )}

            <Section style={{ textAlign: 'center' as const, margin: '28px 0 8px' }}>
              <Button href={ctaHref} style={cta}>
                Renew evidence →
              </Button>
            </Section>

            <Text style={{ ...text, fontSize: '12px', textAlign: 'center' as const, color: '#64748b' }}>
              Or reply to re-assign this item to someone on your team.
            </Text>

            <Hr
              style={{ borderColor: 'rgba(34,211,238,0.1)', margin: '22px 0 14px' }}
            />
            <Text style={footer}>
              You receive evidence expiry alerts for items you own.{' '}
              <a
                href={`${BASE}/app/settings/notifications`}
                style={{ color: '#64748b' }}
              >
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

export default EvidenceExpiringAlertEmail;
