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

interface WelcomeEmailProps {
  userName?: string;
  organizationName?: string;
  loginUrl?: string;
}

export default function WelcomeEmail({
  userName = 'there',
  organizationName = 'My Organization',
  loginUrl = `${DEFAULT_APP_URL.replace(/\/$/, '')}/app`,
}: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Welcome to FormaOS — Your compliance journey starts now</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={logo}>FormaOS</Heading>
            <Text style={tagline}>Compliance Operating System</Text>
          </Section>

          {/* Content */}
          <Section style={content}>
            <Heading style={h2}>Welcome, {userName}! 🎉</Heading>

            <Text style={text}>
              Your organization{' '}
              <strong style={{ color: '#22d3ee' }}>{organizationName}</strong>{' '}
              has been successfully created. You&rsquo;re all set to start your
              compliance journey.
            </Text>

            <Text style={text}>FormaOS helps your team manage:</Text>

            <Section style={featureList}>
              {[
                'Governance policies and compliance frameworks',
                'Task management and compliance roadmaps',
                'Evidence collection and secure storage',
                'Tamper-proof audit trails and logs',
                'Team collaboration with role-based access',
              ].map((feature) => (
                <Text key={feature} style={featureItem}>
                  <span style={{ color: '#22d3ee', fontWeight: '700' }}>✓</span>
                  &nbsp;&nbsp;{feature}
                </Text>
              ))}
            </Section>

            <Section style={buttonContainer}>
              <Button style={button} href={loginUrl}>
                Go to Dashboard →
              </Button>
            </Section>

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

const featureList = {
  margin: '20px 0',
};

const featureItem = {
  color: '#cbd5e1',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '8px 0',
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

const divider = {
  borderColor: 'rgba(34,211,238,0.1)',
  margin: '24px 0',
};

const footer = {
  color: '#475569',
  fontSize: '13px',
  marginTop: '16px',
  fontStyle: 'italic' as const,
};
