import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Hr,
} from '@react-email/components';
import * as React from 'react';

const DEFAULT_APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.formaos.com.au';

interface InviteEmailProps {
  inviterName?: string;
  inviterEmail?: string;
  organizationName?: string;
  inviteUrl?: string;
  role?: string;
}

export default function InviteEmail({
  inviterName = 'A team member',
  inviterEmail = 'member@formaos.com',
  organizationName = 'Organization',
  inviteUrl = `${DEFAULT_APP_URL.replace(/\/$/, '')}/accept-invite`,
  role = 'member',
}: InviteEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>
        You&apos;ve been invited to join {organizationName} on FormaOS
      </Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={logo}>FormaOS</Heading>
            <Text style={tagline}>Compliance Operating System</Text>
          </Section>

          {/* Content */}
          <Section style={content}>
            <Heading style={h2}>You&apos;ve been invited! 🎉</Heading>

            <Text style={text}>
              <strong style={{ color: '#f1f5f9' }}>{inviterName}</strong>{' '}
              <span style={{ color: '#64748b' }}>({inviterEmail})</span> has
              invited you to join{' '}
              <strong style={{ color: '#22d3ee' }}>{organizationName}</strong>{' '}
              on FormaOS.
            </Text>

            <Section style={infoBox}>
              <Text style={infoRow}>
                <span style={infoLabel}>Organization</span>
                <span style={infoValue}>{organizationName}</span>
              </Text>
              <Hr style={infoHr} />
              <Text style={infoRow}>
                <span style={infoLabel}>Role</span>
                <span style={{ ...infoValue, color: '#22d3ee' }}>
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </span>
              </Text>
              <Hr style={infoHr} />
              <Text style={infoRow}>
                <span style={infoLabel}>Invited by</span>
                <span style={infoValue}>{inviterName}</span>
              </Text>
            </Section>

            <Text style={text}>
              FormaOS is a comprehensive compliance operating system — manage
              governance, policies, evidence, and audit trails all in one place.
            </Text>

            <Section style={buttonContainer}>
              <Button style={button} href={inviteUrl}>
                Accept Invitation →
              </Button>
            </Section>

            <Text style={smallText}>
              This invitation expires in 7 days. If you don&apos;t want to join,
              you can safely ignore this email.
            </Text>

            <Hr style={divider} />
            <Text style={footer}>— The FormaOS Team</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: '#0f172a',
  fontFamily:
    "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};

const container = {
  backgroundColor: '#1e293b',
  margin: '0 auto',
  maxWidth: '600px',
  borderRadius: '12px',
  overflow: 'hidden' as const,
};

const header = {
  background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
  borderBottom: '1px solid rgba(34,211,238,0.2)',
  padding: '32px 40px',
  textAlign: 'center' as const,
};

const logo = {
  color: '#22d3ee',
  fontSize: '28px',
  fontWeight: '800',
  margin: '0',
  letterSpacing: '-0.5px',
};

const tagline = {
  color: '#94a3b8',
  fontSize: '12px',
  margin: '6px 0 0',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.1em',
};

const content = {
  padding: '36px 40px',
};

const h2 = {
  color: '#f1f5f9',
  fontSize: '24px',
  fontWeight: '700',
  lineHeight: '1.3',
  margin: '0 0 20px',
};

const text = {
  color: '#94a3b8',
  fontSize: '15px',
  lineHeight: '1.7',
  margin: '16px 0',
};

const infoBox = {
  backgroundColor: '#0f172a',
  border: '1px solid rgba(34,211,238,0.15)',
  borderRadius: '10px',
  padding: '20px 24px',
  margin: '24px 0',
};

const infoRow = {
  display: 'flex' as const,
  justifyContent: 'space-between' as const,
  margin: '0',
  fontSize: '14px',
};

const infoLabel = {
  color: '#64748b',
  fontWeight: '600',
  textTransform: 'uppercase' as const,
  fontSize: '11px',
  letterSpacing: '0.08em',
};

const infoValue = {
  color: '#e2e8f0',
  fontWeight: '500',
};

const infoHr = {
  borderColor: 'rgba(34,211,238,0.08)',
  margin: '12px 0',
};

const buttonContainer = {
  margin: '32px 0',
  textAlign: 'center' as const,
};

const button = {
  backgroundColor: '#22d3ee',
  borderRadius: '8px',
  color: '#0f172a',
  fontSize: '15px',
  fontWeight: '700',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 32px',
};

const smallText = {
  color: '#475569',
  fontSize: '13px',
  lineHeight: '1.6',
  margin: '16px 0',
};

const divider = {
  borderColor: 'rgba(34,211,238,0.1)',
  margin: '24px 0',
};

const footer = {
  color: '#475569',
  fontSize: '13px',
  fontStyle: 'italic' as const,
};
