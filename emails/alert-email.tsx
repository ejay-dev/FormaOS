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
} from '@react-email/components';
import * as React from 'react';

const DEFAULT_APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.formaos.com.au';

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
  const alertColors = {
    info: { bg: '#e6f2ff', border: '#4facfe', icon: 'ℹ️' },
    warning: { bg: '#fff4e6', border: '#ffa500', icon: '⚠️' },
    critical: { bg: '#ffe6e6', border: '#ff4444', icon: '🚨' },
  };

  const { bg, border, icon } = alertColors[alertType];

  return (
    <Html>
      <Head />
      <Preview>{alertTitle}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={h1}>FormaOS</Heading>
          </Section>

          <Section style={content}>
            <Heading style={h2}>
              {icon} {alertTitle}
            </Heading>
            
            <Text style={text}>
              Hi {userName},
            </Text>

            <Section style={{ ...alertBox, backgroundColor: bg, borderLeft: `4px solid ${border}` }}>
              <Text style={alertText}>{alertMessage}</Text>
            </Section>

            {actionUrl && (
              <Section style={buttonContainer}>
                <Button style={button} href={actionUrl}>
                  {actionText}
                </Button>
              </Section>
            )}

            <Text style={smallText}>
              You're receiving this notification because you're a member of an organization on FormaOS.
              You can manage your notification preferences in your account settings.
            </Text>

            <Text style={footer}>
              — The FormaOS Team
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
};

const header = {
  padding: '32px 20px',
  textAlign: 'center' as const,
  borderBottom: '1px solid #e6e6e6',
};

const h1 = {
  color: '#1a1a1a',
  fontSize: '32px',
  fontWeight: '700',
  margin: '0',
  padding: '0',
};

const content = {
  padding: '32px 40px',
};

const h2 = {
  color: '#1a1a1a',
  fontSize: '24px',
  fontWeight: '600',
  lineHeight: '1.3',
  margin: '0 0 20px',
};

const text = {
  color: '#525252',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '16px 0',
};

const alertBox = {
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
};

const alertText = {
  color: '#1a1a1a',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0',
};

const buttonContainer = {
  margin: '32px 0',
  textAlign: 'center' as const,
};

const button = {
  backgroundColor: '#000000',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 32px',
};

const smallText = {
  color: '#8a8a8a',
  fontSize: '14px',
  lineHeight: '1.5',
  margin: '16px 0',
};

const footer = {
  color: '#8a8a8a',
  fontSize: '14px',
  marginTop: '32px',
  fontStyle: 'italic',
};
