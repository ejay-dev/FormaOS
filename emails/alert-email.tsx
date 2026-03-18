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

interface AlertEmailProps {
  userName?: string;
  alertType?: 'info' | 'warning' | 'critical';
  alertTitle?: string;
  alertMessage?: string;
  actionUrl?: string;
  actionText?: string;
}

export default function AlertEmail({
  userName = 'there',
  alertType = 'info',
  alertTitle = 'System Notification',
  alertMessage = 'You have a new notification from FormaOS.',
  actionUrl = `${DEFAULT_APP_URL.replace(/\/$/, '')}/app`,
  actionText = 'View Details',
}: AlertEmailProps) {
  const alertConfig = {
    info: {
      bg: 'rgba(34,211,238,0.12)',
      border: '#22d3ee',
      btnBg: '#22d3ee',
      btnColor: '#0f172a',
      icon: 'ℹ️',
    },
    warning: {
      bg: 'rgba(251,146,60,0.12)',
      border: '#fb923c',
      btnBg: '#fb923c',
      btnColor: '#0f172a',
      icon: '⚠️',
    },
    critical: {
      bg: 'rgba(248,113,113,0.12)',
      border: '#f87171',
      btnBg: '#f87171',
      btnColor: '#fff',
      icon: '🚨',
    },
  };

  const { bg, border, btnBg, btnColor, icon } = alertConfig[alertType];

  return (
    <Html>
      <Head />
      <Preview>{alertTitle}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={{ ...header, borderBottomColor: `${border}44` }}>
            <Heading style={logo}>FormaOS</Heading>
            <Text style={tagline}>Compliance Operating System</Text>
          </Section>

          {/* Content */}
          <Section style={content}>
            <Heading style={h2}>
              {icon} {alertTitle}
            </Heading>

            <Text style={text}>Hi {userName},</Text>

            <Section
              style={{
                ...alertBox,
                backgroundColor: bg,
                borderLeft: `4px solid ${border}`,
              }}
            >
              <Text style={alertText}>{alertMessage}</Text>
            </Section>

            {actionUrl && (
              <Section style={buttonContainer}>
                <Button
                  style={{ ...button, backgroundColor: btnBg, color: btnColor }}
                  href={actionUrl}
                >
                  {actionText} →
                </Button>
              </Section>
            )}

            <Text style={smallText}>
              You&apos;re receiving this because you&apos;re a member of an
              organization on FormaOS. Manage your notification preferences in
              account settings.
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
  fontSize: '22px',
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

const alertBox = {
  borderRadius: '8px',
  padding: '18px 20px',
  margin: '20px 0',
};

const alertText = {
  color: '#e2e8f0',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0',
  fontWeight: '500',
};

const buttonContainer = {
  margin: '28px 0',
  textAlign: 'center' as const,
};

const button = {
  borderRadius: '8px',
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
